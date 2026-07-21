# backend/routers/route.py
"""
아동 안전 경로 API.

엔드포인트
- POST /route/plan  : (권장·통합) 출발/도착 '이름'을 받아 지오코딩 → 안전경로 → AI분석까지 한 번에.
- POST /route/safe  : 좌표를 직접 받아 안전경로만 계산 (기존 호환용).
- POST /route/driving-test : 카카오 자동차 길찾기 연결 시험.

특징
- 도로망(OSM) 캐시로 재요청 시 즉시 응답.
- 위험구간(트램 공사 등)에 가중치를 줘서 안전 경로가 우회하도록 함.
- osmnx가 없거나 실패해도 데모가 멈추지 않도록 '직선 폴백 경로'를 반환.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import math

from config import APP_MODE
from services.public_data import get_tram_construction_data
from services.kakao_map import (
    KakaoDrivingAPIError,
    get_kakao_driving_route,
    geocode_place,
    demo_place_names,
)
from services.ai_analysis import analyze_route_safety

router = APIRouter(prefix="/route", tags=["Route"])

# --- 튜닝 파라미터 (발표용: 확실히 우회하도록 세게) ---
INFLUENCE_M = 200.0
RISK_WEIGHT = {"고": 20.0, "중": 12.0, "저": 5.0}

# --- 도로망 캐시 (메모리) ---
_GRAPH_CACHE = {}


class RouteRequest(BaseModel):
    origin: str = Field(..., description="출발지 '경도,위도'", examples=["127.3760,36.3500"])
    destination: str = Field(..., description="목적지 '경도,위도'", examples=["127.3820,36.3560"])


class PlanRequest(BaseModel):
    start: str = Field(..., description="출발지 이름", examples=["대전서원초등학교"])
    destination: str = Field(..., description="도착지 이름", examples=["둔산동 보라아파트"])
    construction: bool = Field(True, description="공사구간(위험지역) 반영 여부. False면 공사 없는 상황으로 계산")


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


def _coords_pass_danger(coords, zones):
    for i in range(len(coords) - 1):
        ml = (coords[i]["lat"] + coords[i + 1]["lat"]) / 2
        mn = (coords[i]["lng"] + coords[i + 1]["lng"]) / 2
        if _danger_penalty(ml, mn, zones) > 0:
            return True
    return False


def _coords_min_dist_to_danger(coords, zones):
    m = float("inf")
    for i in range(len(coords) - 1):
        ml = (coords[i]["lat"] + coords[i + 1]["lat"]) / 2
        mn = (coords[i]["lng"] + coords[i + 1]["lng"]) / 2
        for z in zones:
            m = min(m, _haversine_m(ml, mn, z["lat"], z["lng"]))
    return round(m) if m != float("inf") else None


def _coords_length_m(coords):
    total = 0.0
    for i in range(len(coords) - 1):
        total += _haversine_m(coords[i]["lat"], coords[i]["lng"],
                              coords[i + 1]["lat"], coords[i + 1]["lng"])
    return total


def _route_block(coords, zones):
    """경로 좌표 리스트를 프론트가 쓰는 표준 형태로 감싼다."""
    return {
        "coords": coords,
        "distance_m": round(_coords_length_m(coords)),
        "passes_danger": _coords_pass_danger(coords, zones),
        "min_dist_to_danger_m": _coords_min_dist_to_danger(coords, zones),
    }


def _nearest_node(G, lat, lng):
    """scikit-learn 없이 위/경도로 가장 가까운 도로 노드를 찾는다."""
    best, best_d = None, float("inf")
    for n, data in G.nodes(data=True):
        d = _haversine_m(lat, lng, data["y"], data["x"])
        if d < best_d:
            best_d, best = d, n
    return best


def _path_coords_osmnx(G, path):
    """노드 경로를 실제 도로 모양(엣지 geometry)을 따라 좌표 리스트로 변환한다.
    geometry가 없으면 두 노드를 직선으로 잇는다."""
    coords = []
    for u, v in zip(path[:-1], path[1:]):
        edge_dict = G.get_edge_data(u, v)
        best = None
        if edge_dict:
            best = min(edge_dict.values(), key=lambda d: d.get("length", 1.0))
        if best is not None and best.get("geometry") is not None:
            xs, ys = best["geometry"].xy
            pts = [{"lat": y, "lng": x} for x, y in zip(xs, ys)]
            # geometry가 v->u 방향으로 저장돼 있을 수 있어 u에 가까운 쪽이 앞이 되게 정렬
            uy, ux = G.nodes[u]["y"], G.nodes[u]["x"]
            if pts:
                d0 = abs(pts[0]["lat"] - uy) + abs(pts[0]["lng"] - ux)
                dN = abs(pts[-1]["lat"] - uy) + abs(pts[-1]["lng"] - ux)
                if d0 > dN:
                    pts.reverse()
            coords.extend(pts[1:] if coords else pts)
        else:
            if not coords:
                coords.append({"lat": G.nodes[u]["y"], "lng": G.nodes[u]["x"]})
            coords.append({"lat": G.nodes[v]["y"], "lng": G.nodes[v]["x"]})
    if not coords:
        coords = [{"lat": G.nodes[n]["y"], "lng": G.nodes[n]["x"]} for n in path]
    return coords


def _get_zones():
    zones_raw = get_tram_construction_data().get("data", [])
    return [{"lat": z["lat"], "lng": z["lng"], "risk_level": z.get("risk_level", "중"),
             "location_name": z.get("location_name", ""), "id": z.get("id")}
            for z in zones_raw]


# ---------- 폴백 경로 (osmnx 없이도 화면이 나오게) ----------
def _fallback_routes(o_lat, o_lng, d_lat, d_lng, zones):
    """
    도로망을 못 쓸 때 쓰는 단순 경로.
    - 최단: 출발→도착 직선(2점)
    - 안전: 위험구간 평균 위치의 반대쪽으로 중간점을 밀어 우회하는 3점
    """
    shortest = [{"lat": o_lat, "lng": o_lng}, {"lat": d_lat, "lng": d_lng}]

    mid_lat, mid_lng = (o_lat + d_lat) / 2, (o_lng + d_lng) / 2
    if zones:
        z_lat = sum(z["lat"] for z in zones) / len(zones)
        z_lng = sum(z["lng"] for z in zones) / len(zones)
        # 위험구간 반대 방향으로 중간점을 약 250m 정도 이동
        dlat, dlng = mid_lat - z_lat, mid_lng - z_lng
        norm = math.hypot(dlat, dlng) or 1.0
        offset = 0.0025
        mid_lat += (dlat / norm) * offset
        mid_lng += (dlng / norm) * offset

    safe = [{"lat": o_lat, "lng": o_lng},
            {"lat": mid_lat, "lng": mid_lng},
            {"lat": d_lat, "lng": d_lng}]
    return shortest, safe


# ---------- 안전 경로 계산 (osmnx, 실패 시 폴백) ----------
def _compute_route(o_lat, o_lng, d_lat, d_lng, consider_danger=True):
    zones = _get_zones() if consider_danger else []
    engine = "osmnx"
    cache_hit = False

    try:
        import osmnx as ox
        import networkx as nx

        try:
            ox.settings.use_cache = True
            ox.settings.log_console = False
        except Exception:
            pass

        center_lat = (o_lat + d_lat) / 2
        center_lng = (o_lng + d_lng) / 2
        span = _haversine_m(o_lat, o_lng, d_lat, d_lng)
        radius = max(400, int(span / 2 + 400))

        key = (round(center_lat, 3), round(center_lng, 3), radius)
        if key in _GRAPH_CACHE:
            G, cache_hit = _GRAPH_CACHE[key], True
        else:
            G = ox.graph_from_point((center_lat, center_lng), dist=radius, network_type="walk")
            _GRAPH_CACHE[key] = G

        for u, v, k, data in G.edges(keys=True, data=True):
            length = data.get("length", 1.0)
            ml = (G.nodes[u]["y"] + G.nodes[v]["y"]) / 2
            mn = (G.nodes[u]["x"] + G.nodes[v]["x"]) / 2
            data["safe_weight"] = length * (1 + _danger_penalty(ml, mn, zones))

        # scikit-learn 없이 직접 최근접 도로 노드를 찾는다.
        start = _nearest_node(G, o_lat, o_lng)
        goal = _nearest_node(G, d_lat, d_lng)
        path_short = nx.shortest_path(G, start, goal, weight="length")
        path_safe = nx.shortest_path(G, start, goal, weight="safe_weight")

        short_coords = _path_coords_osmnx(G, path_short)
        safe_coords = _path_coords_osmnx(G, path_safe)

    except Exception:
        # osmnx 미설치/네트워크 실패/경로없음 등 -> 폴백 경로로 데모 유지
        engine = "fallback"
        short_coords, safe_coords = _fallback_routes(o_lat, o_lng, d_lat, d_lng, zones)

    return {
        "engine": engine,
        "cache_hit": cache_hit,
        "danger_zones": zones,
        "shortest_route": _route_block(short_coords, zones),
        "safe_route": _route_block(safe_coords, zones),
    }


# ---------- 통합 엔드포인트 (프론트가 쓰는 것) ----------
@router.post("/plan", summary="[통합] 이름 입력 → 지오코딩 → 안전경로 → AI분석")
def plan_route(req: PlanRequest):
    origin = geocode_place(req.start)
    dest = geocode_place(req.destination)
    if origin is None or dest is None:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "GEOCODE_FAILED",
                "message": "장소를 좌표로 변환하지 못했습니다. (카카오 키가 없으면 데모 지명만 가능)",
                "supported_demo_places": demo_place_names(),
            },
        )

    result = _compute_route(origin["lat"], origin["lng"], dest["lat"], dest["lng"], consider_danger=req.construction)

    # AI 분석 (실제 경로 정보를 넘겨줌)
    ai = analyze_route_safety(
        route_info={
            "distance_m": result["safe_route"]["distance_m"],
            "passes_danger": result["safe_route"]["passes_danger"],
            "min_dist_to_danger_m": result["safe_route"]["min_dist_to_danger_m"],
            "engine": result["engine"],
        },
        danger_zones=result["danger_zones"],
    )

    # 위험도(문자) -> 안전점수(숫자)로도 환산해서 화면 게이지에 쓰게 함
    score_map = {"안전": 92, "주의": 70, "위험": 45}

    return {
        "success": True,
        "app_mode": APP_MODE,
        "engine": result["engine"],
        "cache_hit": result["cache_hit"],
        "start": {"query": req.start, **origin},
        "destination": {"query": req.destination, **dest},
        "danger_zones": result["danger_zones"],
        "shortest_route": result["shortest_route"],
        "safe_route": result["safe_route"],
        "ai": ai,
        "safety_score": score_map.get(ai["risk_level"], 70),
    }


# ---------- 좌표 직접 입력 (기존 호환) ----------
@router.post("/safe", summary="아동 안전 경로 추천 (좌표 직접 입력)")
def get_safe_route(request: RouteRequest):
    o_lat, o_lng = _parse_lng_lat(request.origin)
    d_lat, d_lng = _parse_lng_lat(request.destination)
    result = _compute_route(o_lat, o_lng, d_lat, d_lng)
    return {
        "success": True,
        "app_mode": APP_MODE,
        "engine": result["engine"],
        "cache_hit": result["cache_hit"],
        "origin": {"lat": o_lat, "lng": o_lng},
        "destination": {"lat": d_lat, "lng": d_lng},
        "danger_zones": result["danger_zones"],
        "shortest_route": result["shortest_route"],
        "safe_route": result["safe_route"],
        "message": "안전 경로와 최단 경로를 함께 반환합니다.",
    }


@router.post("/driving-test", summary="카카오 자동차 길찾기 연결 시험")
def test_kakao_driving_route(request: RouteRequest):
    try:
        return get_kakao_driving_route(origin=request.origin, destination=request.destination)
    except KakaoDrivingAPIError as exc:
        raise HTTPException(status_code=exc.status_code,
                            detail={"code": "KAKAO_DRIVING_API_ERROR", "message": exc.message}) from exc
