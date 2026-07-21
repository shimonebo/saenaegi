# backend/routers/danger.py
"""
위험지역(트램 공사구간 등) 목록 API.
프론트가 지도에 위험구간을 표시할 때 사용한다.
데이터 출처: services/public_data.py (한음)
"""
from fastapi import APIRouter

from services.public_data import get_tram_construction_data

router = APIRouter(prefix="/danger-zones", tags=["DangerZone"])


@router.get("", summary="위험지역 전체 목록")
def list_danger_zones():
    """
    지도에 표시할 위험지역(공사/통제 구간) 목록을 반환한다.
    각 항목: id, 이름, 위험도, 설명, 좌표(lat/lng).
    """
    raw = get_tram_construction_data()
    zones = raw.get("data", [])
    return {
        "count": len(zones),
        "danger_zones": zones,
        "source": "tram_construction",
    }


@router.get("/summary", summary="위험지역 요약 (위험도별 개수)")
def danger_zones_summary():
    """위험도(고/중/저)별로 몇 개인지 요약. 대시보드 통계용."""
    zones = get_tram_construction_data().get("data", [])
    summary = {}
    for z in zones:
        level = z.get("risk_level", "미분류")
        summary[level] = summary.get(level, 0) + 1
    return {"total": len(zones), "by_risk_level": summary}
