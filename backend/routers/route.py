# backend/routers/route.py
"""
아동 안전 경로 API (v2 - 속도개선 + 가중치 강화).

개선점:
1) 도로망 캐시: 한 번 받아온 OSM 도로망을 메모리에 저장해두고 재사용
   -> 같은 구역 재요청 시 다운로드 없이 즉시 응답 (시연 안정성 ↑)
2) 위험 가중치 강화: 위험구간을 확실히 피하도록 벌점/영향반경 상향
3) 응답 형식은 v1과 동일 (프론트 재연동 영향 없음)
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

# --- 튜닝 파라미터 (발표용: 확실히 우회하도록 세게) ---
INFLUENCE_M = 200.0                                  # 위험구간 영향 반경(m)
RISK_WEIGHT = {"고": 20.0, "중": 12.0, "저": 5.0}     # 위험도별 벌점

# --- 도로망 캐시 (메모리) ---
_GRAPH_CACHE = {}


class RouteRequest(BaseModel):
    origin: str = Field(..., description="출발지 '경도,위도'", examples=["127.3760,36.3500"])
    destination: str = Field(..., description="목적지 '경도,위도'", examples=["127.3820,36.3560"])


# ---------- 유틸 ----------
def _parse_lng_lat(s: str):
    try:
        lng_str, lat_str = s.split(",")
        return float(lat_str), float(lng_str)
    except Exception:
        raise HTTPException(status_code=400,
                            detail="좌표 형식은 '경도,위도' 여야 합니다. 예: 127.3760,36.3500")


def _haversine_m(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _danger_penalty(mid_lat, mid_lng, zones):
    penalty = 0.0
    for z in zones:
        d = _haversine_m(mid_lat, mid_lng, z["lat"], z["lng"])
        if d < INFLUENCE_M:
            lw = RISK_WEIGHT.get(z.get("risk_level"), 12.0)
            penalty += lw * ((INFLUENCE_M - d) / INFLUENCE_M)
    return penalty


def _path_passes_danger(G, path, zones):
    for i in range(len(path) - 1):
        ml = (G.nodes[path[i]]["y"] + G.nodes[path[i + 1]]["y"]) / 2
        mn = (G.nodes[path[i]]["x"] + G.nodes[path[i + 1]]["x"]) / 2
        if _danger_penalty(ml, mn, zones) > 0:
            return True
    return False


def _min_dist_to_danger(G, path, zones):
    """경로가 위험구간에 가장 가까이 접근한 거리(m). 발표 설명용."""
    m = float("inf")
    for i in range(len(path) - 1):
        ml = (G.nodes[path[i]]["y"] + G.nodes[path[i + 1]]["y"]) / 2
        mn = (G.nodes[path[i]]["x"] + G.nodes[path[i + 1]]["x"]) / 2
        for z in zones:
            m = min(m, _haversine_m(ml, mn, z["lat"], z["lng"]))
    return round(m) if m != float("inf") else None


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


def _get_graph(center_lat, center_lng, radius, ox):
    """도로망을 캐시에서 찾고, 없으면 받아서 캐시에 저장."""
    key = (round(center_lat, 3), round(center_lng, 3), radius)
    if key in _GRAPH_CACHE:
        return _GRAPH_CACHE[key], True
    G = ox.graph_from_point((center_lat, center_lng), dist=radius, network_type="walk")
    _GRAPH_CACHE[key] = G
    return G, False


# ---------- 안전 경로 계산 ----------
@router.post("/safe", summary="아동 안전 경로 추천")
def get_safe_route(request: RouteRequest):
    if APP_MODE != "demo":
        raise HTTPException(status_code=503,
                            detail={"code": "SAFE_ROUTE_NOT_READY",
                                    "message": "실제 안전 경로 기능은 준비 중입니다. APP_MODE=demo에서 동작합니다."})

    o_lat, o_lng = _parse_lng_lat(request.origin)
    d_lat, d_lng = _parse_lng_lat(request.destination)

    try:
        import osmnx as ox
        import networkx as nx
    except ImportError:
        raise HTTPException(status_code=500,
                            detail="osmnx/networkx가 설치되어 있지 않습니다. pip install osmnx")

    try:
        ox.settings.use_cache = True
        ox.settings.log_console = False
    except Exception:
        pass

    center_lat = (o_lat + d_lat) / 2
    center_lng = (o_lng + d_lng) / 2
    span = _haversine_m(o_lat, o_lng, d_lat, d_lng)
    radius = max(400, int(span / 2 + 400))

    try:
        G, cache_hit = _get_graph(center_lat, center_lng, radius, ox)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"도로망을 가져오지 못했습니다: {e}")

    zones_raw = get_tram_construction_data().get("data", [])
    zones = [{"lat": z["lat"], "lng": z["lng"], "risk_level": z.get("risk_level", "중")}
             for z in zones_raw]

    for u, v, k, data in G.edges(keys=True, data=True):
        length = data.get("length", 1.0)
        ml = (G.nodes[u]["y"] + G.nodes[v]["y"]) / 2
        mn = (G.nodes[u]["x"] + G.nodes[v]["x"]) / 2
        data["safe_weight"] = length * (1 + _danger_penalty(ml, mn, zones))

    start = ox.nearest_nodes(G, o_lng, o_lat)
    goal = ox.nearest_nodes(G, d_lng, d_lat)

    try:
        path_short = nx.shortest_path(G, start, goal, weight="length")
        path_safe = nx.shortest_path(G, start, goal, weight="safe_weight")
    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="두 지점을 잇는 경로를 찾지 못했습니다.")

    return {
        "success": True,
        "app_mode": APP_MODE,
        "cache_hit": cache_hit,
        "origin": {"lat": o_lat, "lng": o_lng},
        "destination": {"lat": d_lat, "lng": d_lng},
        "danger_zones": zones,
        "shortest_route": {
            "coords": _path_to_coords(G, path_short),
            "distance_m": round(_path_length_m(G, path_short)),
            "passes_danger": _path_passes_danger(G, path_short, zones),
            "min_dist_to_danger_m": _min_dist_to_danger(G, path_short, zones),
        },
        "safe_route": {
            "coords": _path_to_coords(G, path_safe),
            "distance_m": round(_path_length_m(G, path_safe)),
            "passes_danger": _path_passes_danger(G, path_safe, zones),
            "min_dist_to_danger_m": _min_dist_to_danger(G, path_safe, zones),
        },
        "message": "안전 경로와 최단 경로를 함께 반환합니다. 프론트에서 두 경로를 비교해 표시하세요.",
    }


@router.post("/driving-test", summary="카카오 자동차 길찾기 연결 시험")
def test_kakao_driving_route(request: RouteRequest):
    try:
        return get_kakao_driving_route(origin=request.origin, destination=request.destination)
    except KakaoDrivingAPIError as exc:
        raise HTTPException(status_code=exc.status_code,
                            detail={"code": "KAKAO_DRIVING_API_ERROR", "message": exc.message}) from exc
