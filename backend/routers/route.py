# backend/routers/route.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.kakao_map import get_kakao_route
from services.public_data import get_tram_construction_data
from services.ai_analysis import analyze_route_safety

router = APIRouter(
    prefix="/route",
    tags=["Route"]
)

class RouteRequest(BaseModel):
    origin: str
    destination: str

@router.post("/safe")
async def get_safe_route(request: RouteRequest):
    """
    출발지와 목적지를 받아 카카오 길찾기, 대전 트램 공사 정보, Claude AI 안전 분석을 수행합니다.
    """
    try:
        # 1. 카카오맵 길찾기 데이터 조회
        route_info = get_kakao_route(request.origin, request.destination)
        
        # 2. 대전 트램 공사 및 위험 지역 데이터 조회
        construction_info = get_tram_construction_data()
        
        # 3. Claude AI 위험도 분석 수행
        ai_analysis = analyze_route_safety(route_info, construction_info)
        
        return {
            "status": "success",
            "route_data": route_info,
            "construction_data": construction_info,
            "safety_analysis": ai_analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))