from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import APP_MODE
from services.kakao_map import (
    KakaoDrivingAPIError,
    get_kakao_driving_route,
)


router = APIRouter(
    prefix="/route",
    tags=["Route"],
)


class RouteRequest(BaseModel):
    """
    경로 요청에 사용하는 임시 입력 모델입니다.

    현재는 카카오 API 형식에 맞춰
    '경도,위도' 문자열을 받습니다.

    다음 단계에서는 경도와 위도를
    별도 숫자 필드로 개선할 예정입니다.
    """

    origin: str = Field(
        ...,
        description=(
            "출발지 좌표입니다. "
            "경도,위도 순서로 입력합니다."
        ),
        examples=[
            "127.3845,36.3502",
        ],
    )

    destination: str = Field(
        ...,
        description=(
            "목적지 좌표입니다. "
            "경도,위도 순서로 입력합니다."
        ),
        examples=[
            "127.3912,36.3561",
        ],
    )


@router.post(
    "/safe",
    summary="아동 안전 경로 추천",
)
def get_safe_route(
    request: RouteRequest,
):
    """
    앞으로 아동 안전 경로 기능이 들어갈 API입니다.

    현재 단계에서는 자동차 길찾기를 호출하지 않고,
    구현 상태만 반환합니다.
    """

    if APP_MODE != "demo":
        raise HTTPException(
            status_code=503,
            detail={
                "code": "SAFE_ROUTE_NOT_READY",
                "message": (
                    "실제 안전 경로 기능은 아직 구현 중입니다. "
                    "현재는 APP_MODE=demo로 실행해야 합니다."
                ),
            },
        )

    return {
        "success": True,
        "app_mode": APP_MODE,
        "implementation_status": "route_scope_separated",
        "source": "demo",
        "route_type": "walking_candidate",
        "is_demo": True,

        # 현재는 범위만 나눈 상태이므로 완료라고 표시하지 않습니다.
        "is_safe_route_complete": False,

        "request": {
            "origin": request.origin,
            "destination": request.destination,
        },

        "message": (
            "안전 경로 API와 자동차 경로 API를 "
            "분리했습니다. 다음 단계에서 일반 도보 후보와 "
            "안전 우회 후보 경로를 추가합니다."
        ),
    }


@router.post(
    "/driving-test",
    summary="카카오 자동차 길찾기 연결 시험",
)
def test_kakao_driving_route(
    request: RouteRequest,
):
    """
    카카오 자동차 길찾기 API의 연결 상태를
    검사하기 위한 테스트 전용 API입니다.
    """

    try:
        return get_kakao_driving_route(
            origin=request.origin,
            destination=request.destination,
        )

    except KakaoDrivingAPIError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={
                "code": "KAKAO_DRIVING_API_ERROR",
                "message": exc.message,
            },
        ) from exc