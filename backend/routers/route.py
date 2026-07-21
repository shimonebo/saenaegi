# backend/routers/route.py
"""
아동 안전 경로 API.

핵심 아이디어:
- OSM(OpenStreetMap)에서 실제 도보 도로망을 가져온다 (osmnx).
- 공사/사고 등 위험구간 근처를 지나는 길에 '위험 벌점'을 매긴다.
- 길의 비용 = 실제거리 * (1 + 위험벌점)  으로 두고 다익스트라를 돌리면,
  위험한 길은 비용이 커져서 자연스럽게 '피해가는' 안전 경로가 나온다.
- 결과 좌표 리스트를 프론트(카카오맵)가 지도에 선으로 그린다.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import math

from config import APP_MODE
from services.public_data import get_tram_construction_data
from services.kakao_map import (
    KakaoDrivingAPIError,
    get_kakao_driving_route,
)

router = APIRouter(prefix="/route", tags=["Route"])

# osmnx / networkx 는 무거워서, 요청이 올 때 안에서 import 한다 (서버 시작 지연 방지)
INFLUENCE_M = 120.0          # 위험구간 영향 반경(m)
RISK_WEIGHT = {"고": 5.0, "중": 3.0, "저": 1.5}


class RouteRequest(BaseModel):
    origin: str = Field(
        ...,
        description="출발지 좌표. '경도,위도' 순서.",
        examples=["127.3760,36.3500"],
    )
    destination: str = Field(
        ...,
        description="목적지 좌표. '경도,위도' 순서.",
        examples=["127.3820,36.3560"],
    )


# ---------- 유틸 ----------
def _parse_lng_lat(s: str):
    """'경도,위도' 문자열 -> (lat, lng) 숫자."""
    try:
        lng_str, lat_str = s.split(",")
        return float(lat_str), float(lng_str)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="좌표 형식은 '경도,위도' 여야 합니다. 예: 127.3760,36.3500",
        )


def _haversine_m(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _danger_penalty(mid_lat, mid_lng, zones):
    """엣지 중간점이 위험구간 근처면 벌점을 매긴다 (가까울수록/위험할수록 큼)."""
    penalty = 0.0
    for z in zones:
        d = _haversine_m(mid_lat, mid_lng, z["lat"], z["lng"])
        if d < INFLUENCE_M:
            lw = RISK_WEIGHT.get(z.get("risk_level"), 3.0)
            penalty += lw * ((INFLUENCE_M - d) / INFLUENCE_M)
    return penalty


def _path_passes_danger(G, path, zones):
    for i in range(len(path) - 1):
        ml = (G.nodes[path[i]]["y"] + G.nodes[path[i + 1]]["y"]) / 2
        mn = (G.nodes[path[i]]["x"] + G.nodes[path[i + 1]]["x"]) / 2
        if _danger_penalty(ml, mn, zones) > 0:
            return True
    return False


def _path_to_coords(G, path):
    return [{"lat": G.nodes[n]["y"], "lng": G.nodes[n]["x"]} for n in path]


def _path_length_m(G, path):
    total = 0.0
    for i in range(len(path) - 1):
        total += _haversine_m(
            G.nodes[path[i]]["y"], G.nodes[path[i]]["x"],
            G.nodes[path[i + 1]]["y"], G.nodes[path[i + 1]]["x"],
        )
    return total


# ---------- 안전 경로 계산 ----------
@router.post("/safe", summary="아동 안전 경로 추천")
def get_safe_route(request: RouteRequest):
    """
    출발지~목적지 사이의 도보 안전 경로를 계산한다.
    - 최단경로와 안전경로를 함께 돌려줘서 프론트가 비교해 보여줄 수 있다.
    """
    if APP_MODE != "demo":
        raise HTTPException(
            status_code=503,
            detail={"code": "SAFE_ROUTE_NOT_READY",
                    "message": "실제 안전 경로 기능은 준비 중입니다. APP_MODE=demo에서 동작합니다."},
        )

    o_lat, o_lng = _parse_lng_lat(request.origin)
    d_lat, d_lng = _parse_lng_lat(request.destination)

    # 무거운 라이브러리는 여기서 import
    try:
        import osmnx as ox
        import networkx as nx
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="osmnx/networkx가 설치되어 있지 않습니다. pip install osmnx",
        )

    # 1) 두 지점을 포함하는 도보 도로망 가져오기
    center_lat = (o_lat + d_lat) / 2
    center_lng = (o_lng + d_lng) / 2
    span = _haversine_m(o_lat, o_lng, d_lat, d_lng)
    radius = max(400, int(span / 2 + 400))  # 두 점을 넉넉히 감싸는 반경
    try:
        G = ox.graph_from_point((center_lat, center_lng),
                                dist=radius, network_type="walk")
    except Exception as e:
        raise HTTPException(status_code=502,
                            detail=f"도로망을 가져오지 못했습니다: {e}")

    # 2) 위험구간 데이터 (한음 public_data.py 재사용)
    zones_raw = get_tram_construction_data().get("data", [])
    zones = [{"lat": z["lat"], "lng": z["lng"], "risk_level": z.get("risk_level", "중")}
             for z in zones_raw]

    # 3) 각 엣지에 safe_weight = 거리 * (1 + 위험벌점)
    for u, v, k, data in G.edges(keys=True, data=True):
        length = data.get("length", 1.0)
        ml = (G.nodes[u]["y"] + G.nodes[v]["y"]) / 2
        mn = (G.nodes[u]["x"] + G.nodes[v]["x"]) / 2
        data["safe_weight"] = length * (1 + _danger_penalty(ml, mn, zones))

    # 4) 출발/도착에서 가장 가까운 도로망 노드 찾기
    start = ox.nearest_nodes(G, o_lng, o_lat)
    goal = ox.nearest_nodes(G, d_lng, d_lat)

    # 5) 최단경로 & 안전경로 각각 계산
    try:
        path_short = nx.shortest_path(G, start, goal, weight="length")
        path_safe = nx.shortest_path(G, start, goal, weight="safe_weight")
    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="두 지점을 잇는 경로를 찾지 못했습니다.")

    return {
        "success": True,
        "app_mode": APP_MODE,
        "origin": {"lat": o_lat, "lng": o_lng},
        "destination": {"lat": d_lat, "lng": d_lng},
        "danger_zones": zones,
        "shortest_route": {
            "coords": _path_to_coords(G, path_short),
            "distance_m": round(_path_length_m(G, path_short)),
            "passes_danger": _path_passes_danger(G, path_short, zones),
        },
        "safe_route": {
            "coords": _path_to_coords(G, path_safe),
            "distance_m": round(_path_length_m(G, path_safe)),
            "passes_danger": _path_passes_danger(G, path_safe, zones),
        },
        "message": "안전 경로와 최단 경로를 함께 반환합니다. 프론트에서 두 경로를 비교해 표시하세요.",
    }


# ---------- 기존 카카오 자동차 길찾기 테스트 (한음, 유지) ----------
@router.post("/driving-test", summary="카카오 자동차 길찾기 연결 시험")
def test_kakao_driving_route(request: RouteRequest):
    try:
        return get_kakao_driving_route(
            origin=request.origin,
            destination=request.destination,
        )
    except KakaoDrivingAPIError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"code": "KAKAO_DRIVING_API_ERROR", "message": exc.message},
        ) from exc
