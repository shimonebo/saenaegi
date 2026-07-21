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