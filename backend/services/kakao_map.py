import requests

from config import KAKAO_API_KEY


# 카카오모빌리티 자동차 길찾기 API 주소
KAKAO_DRIVING_URL = (
    "https://apis-navi.kakaomobility.com/v1/directions"
)


class KakaoDrivingAPIError(Exception):
    """
    카카오 자동차 길찾기 API 호출에 실패했을 때
    사용하는 사용자 정의 예외입니다.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 502,
    ):
        self.message = message
        self.status_code = status_code

        super().__init__(message)


def _validate_coordinate_text(
    coordinate_text: str,
    field_name: str,
) -> None:
    """
    좌표 문자열이 '경도,위도' 형식인지 검사합니다.

    예:
    127.3845,36.3502
    """

    if not coordinate_text:
        raise KakaoDrivingAPIError(
            message=f"{field_name} 좌표가 비어 있습니다.",
            status_code=400,
        )

    coordinate_parts = coordinate_text.split(",")

    if len(coordinate_parts) != 2:
        raise KakaoDrivingAPIError(
            message=(
                f"{field_name} 좌표는 "
                "'경도,위도' 형식이어야 합니다."
            ),
            status_code=400,
        )

    try:
        longitude = float(coordinate_parts[0].strip())
        latitude = float(coordinate_parts[1].strip())

    except ValueError as exc:
        raise KakaoDrivingAPIError(
            message=(
                f"{field_name} 좌표에는 "
                "숫자만 입력할 수 있습니다."
            ),
            status_code=400,
        ) from exc

    if not -180 <= longitude <= 180:
        raise KakaoDrivingAPIError(
            message=(
                f"{field_name} 경도는 "
                "-180부터 180 사이여야 합니다."
            ),
            status_code=400,
        )

    if not -90 <= latitude <= 90:
        raise KakaoDrivingAPIError(
            message=(
                f"{field_name} 위도는 "
                "-90부터 90 사이여야 합니다."
            ),
            status_code=400,
        )


def get_kakao_driving_route(
    origin: str,
    destination: str,
) -> dict:
    """
    카카오 자동차 길찾기 API를 호출합니다.

    주의:
    이 함수가 반환하는 경로는 자동차 경로입니다.
    아동 도보 안전 경로로 사용하지 않습니다.

    좌표 형식:
    경도,위도

    예:
    127.3845,36.3502
    """

    # API 키가 없으면 가짜 경로를 반환하지 않고 오류 처리합니다.
    if not KAKAO_API_KEY:
        raise KakaoDrivingAPIError(
            message=(
                "KAKAO_API_KEY가 설정되지 않았습니다. "
                "backend/.env 파일을 확인하세요."
            ),
            status_code=503,
        )

    # 카카오 API에 요청하기 전에 좌표 형식을 검사합니다.
    _validate_coordinate_text(
        coordinate_text=origin,
        field_name="출발지",
    )

    _validate_coordinate_text(
        coordinate_text=destination,
        field_name="목적지",
    )

    headers = {
        "Authorization": f"KakaoAK {KAKAO_API_KEY}",
        "Content-Type": "application/json",
    }

    params = {
        "origin": origin,
        "destination": destination,
        "priority": "RECOMMEND",
        "summary": "false",
    }

    try:
        response = requests.get(
            KAKAO_DRIVING_URL,
            headers=headers,
            params=params,
            timeout=8,
        )

    except requests.Timeout as exc:
        raise KakaoDrivingAPIError(
            message="카카오 API 응답 시간이 초과되었습니다.",
            status_code=504,
        ) from exc

    except requests.ConnectionError as exc:
        raise KakaoDrivingAPIError(
            message="카카오 API 서버에 연결할 수 없습니다.",
            status_code=502,
        ) from exc

    except requests.RequestException as exc:
        raise KakaoDrivingAPIError(
            message="카카오 API 요청 중 오류가 발생했습니다.",
            status_code=502,
        ) from exc

    if response.status_code != 200:
        raise KakaoDrivingAPIError(
            message=(
                "카카오 자동차 길찾기 API 호출에 실패했습니다. "
                f"HTTP 상태 코드: {response.status_code}"
            ),
            status_code=502,
        )

    try:
        response_body = response.json()

    except ValueError as exc:
        raise KakaoDrivingAPIError(
            message="카카오 API 응답이 올바른 JSON이 아닙니다.",
            status_code=502,
        ) from exc

    routes = response_body.get("routes", [])

    if not routes:
        raise KakaoDrivingAPIError(
            message="카카오 API 응답에 경로 정보가 없습니다.",
            status_code=404,
        )

    first_route = routes[0]

    result_code = first_route.get("result_code", -1)

    if result_code != 0:
        result_message = first_route.get(
            "result_msg",
            first_route.get(
                "result_message",
                "경로를 찾지 못했습니다.",
            ),
        )

        raise KakaoDrivingAPIError(
            message=f"경로 탐색 실패: {result_message}",
            status_code=404,
        )

    summary = first_route.get("summary", {})

    return {
        "success": True,

        # 결과가 카카오모빌리티에서 왔음을 표시합니다.
        "source": "kakao_mobility",

        # 자동차 경로라는 것을 명확하게 표시합니다.
        "route_type": "driving",

        # 이 경로를 아동 안전 경로로 착각하지 않도록 합니다.
        "is_safe_route": False,

        "warning": (
            "이 결과는 카카오 자동차 길찾기 API "
            "연결 시험용입니다. "
            "아동 도보 안전 경로로 사용하면 안 됩니다."
        ),

        "route": {
            "distance_m": int(
                summary.get("distance", 0)
            ),
            "duration_sec": int(
                summary.get("duration", 0)
            ),
        },

        # 현재 단계에서는 연결 확인을 위해 원본도 함께 반환합니다.
        # 나중에는 지도에 필요한 좌표만 추출하도록 변경합니다.
        "raw_response": response_body,
    }

# ============================================================================
# 지오코딩(장소 이름 -> 좌표) : 프론트가 "대전서원초등학교" 같은 이름을 보내면
# 위/경도로 바꿔준다. KAKAO_API_KEY가 있으면 카카오 장소검색을 쓰고,
# 없으면 아래 데모용 사전으로 대체한다. (해커톤 시연이 키 없이도 되게)
# ============================================================================

# 데모용 대전 둔산동 일대 주요 지점 (트램 공사구간 주변으로 배치)
DEMO_PLACES = {
    "대전서원초등학교": (36.3490, 127.3760),
    "둔산동 보라아파트": (36.3565, 127.3862),
    "갤러리아타임월드": (36.3522, 127.3800),
    "타임월드": (36.3522, 127.3781),
    "대전정부청사역": (36.3607, 127.3893),
    "정부청사역": (36.3598, 127.3847),
    "대전시청": (36.3504, 127.3845),
    "둔산초등학교": (36.3540, 127.3820),
}

KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"


def _geocode_from_demo(query: str):
    """데모 사전에서 이름으로 좌표를 찾는다. 부분 일치도 허용."""
    q = query.strip()
    if q in DEMO_PLACES:
        lat, lng = DEMO_PLACES[q]
        return {"name": q, "lat": lat, "lng": lng, "source": "demo_dict"}
    # 부분 일치(공백 제거 후 포함 관계)
    q_norm = q.replace(" ", "")
    for name, (lat, lng) in DEMO_PLACES.items():
        if q_norm in name.replace(" ", "") or name.replace(" ", "") in q_norm:
            return {"name": name, "lat": lat, "lng": lng, "source": "demo_dict"}
    return None


def geocode_place(query: str):
    """
    장소 이름 -> {"name","lat","lng","source"} 또는 None.
    1순위: 카카오 장소검색(키 있을 때), 2순위: 데모 사전.
    """
    if not query or not query.strip():
        return None

    # 카카오 키가 있으면 실제 검색 시도
    if KAKAO_API_KEY:
        try:
            res = requests.get(
                KAKAO_KEYWORD_URL,
                headers={"Authorization": f"KakaoAK {KAKAO_API_KEY}"},
                params={"query": query, "size": 1},
                timeout=8,
            )
            if res.status_code == 200:
                docs = res.json().get("documents", [])
                if docs:
                    d = docs[0]
                    return {
                        "name": d.get("place_name", query),
                        "lat": float(d["y"]),
                        "lng": float(d["x"]),
                        "source": "kakao",
                    }
        except requests.RequestException:
            pass  # 실패하면 아래 데모 사전으로 넘어감

    # 키가 없거나 검색 실패 -> 데모 사전
    return _geocode_from_demo(query)


def demo_place_names():
    """지원하는 데모 지명 목록 (사용자 안내용)."""
    return list(DEMO_PLACES.keys())
