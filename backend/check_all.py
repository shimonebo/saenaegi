# backend/check_all.py
"""
전체 백엔드 통합 점검 스크립트.
서버가 켜진 상태(127.0.0.1:8000)에서 실행: python check_all.py
모든 엔드포인트를 순서대로 호출해 정상인지 확인한다.
"""
import requests

BASE = "http://127.0.0.1:8000"
ok = 0
fail = 0
fails = []


def check(name, method, path, expect=200, json_body=None, note=""):
    global ok, fail
    url = BASE + path
    try:
        if method == "GET":
            r = requests.get(url, timeout=60)
        elif method == "POST":
            r = requests.post(url, json=json_body, timeout=90)
        elif method == "DELETE":
            r = requests.delete(url, timeout=60)
        else:
            raise ValueError(method)

        if r.status_code == expect:
            print(f"  [OK]   {method:6} {path:32} {note}")
            ok += 1
            return r.json() if r.headers.get("content-type","").startswith("application/json") else None
        else:
            print(f"  [FAIL] {method:6} {path:32} -> {r.status_code} (기대 {expect})")
            print(f"         응답: {r.text[:200]}")
            fail += 1
            fails.append(f"{method} {path} = {r.status_code}")
            return None
    except Exception as e:
        print(f"  [ERR]  {method:6} {path:32} -> {type(e).__name__}: {str(e)[:150]}")
        fail += 1
        fails.append(f"{method} {path} = {type(e).__name__}")
        return None


print("=" * 60)
print("아이온길 백엔드 전체 점검 시작")
print("=" * 60)

print("\n[1] 기본 상태")
check("root", "GET", "/")
check("health", "GET", "/health")

print("\n[2] 위험지역 (DangerZone)")
check("danger list", "GET", "/danger-zones")
check("danger summary", "GET", "/danger-zones/summary")

print("\n[3] 위치 (Location)")
check("위치저장 A", "POST", "/location",
      json_body={"child_id": "테스트A", "latitude": 36.3504, "longitude": 127.3845})
check("위치저장 A 2번째", "POST", "/location",
      json_body={"child_id": "테스트A", "latitude": 36.3600, "longitude": 127.3900})
check("위치저장 B", "POST", "/location",
      json_body={"child_id": "테스트B", "latitude": 36.3620, "longitude": 127.3560})
check("특정아이 조회", "GET", "/location/테스트A")
check("전체목록", "GET", "/location/all")
check("없는아이 조회", "GET", "/location/없는아이ZZZ", expect=404, note="(404 정상)")

print("\n[4] 위급알림 (Alert)")
alert_res = check("신고접수 A", "POST", "/alert",
                  json_body={"child_id": "테스트A", "message": "길을 잃었어요"})
check("신고목록", "GET", "/alert/list")
if alert_res and "alert_id" in alert_res:
    aid = alert_res["alert_id"]
    check("신고처리", "POST", f"/alert/{aid}/resolve", note=f"(alert_id={aid})")
check("없는신고 처리", "POST", "/alert/999999/resolve", expect=404, note="(404 정상)")

print("\n[5] 스케줄 (Schedule)")
sch_res = check("일정등록", "POST", "/schedule",
                json_body={"child_id": "테스트A", "day": "월",
                           "start_name": "집", "start_lat": 36.3504, "start_lng": 127.3845,
                           "end_name": "학교", "end_lat": 36.3560, "end_lng": 127.3900,
                           "depart_time": "08:00"})
check("전체일정", "GET", "/schedule/테스트A")
check("오늘일정", "GET", "/schedule/today/테스트A")
if sch_res and "schedule_id" in sch_res:
    sid = sch_res["schedule_id"]
    check("일정삭제", "DELETE", f"/schedule/{sid}", note=f"(schedule_id={sid})")

print("\n[6] 안전경로 (Route) - OSM 받느라 느릴 수 있음, 기다려주세요...")
route_res = check("안전경로 계산", "POST", "/route/safe",
                  json_body={"origin": "127.3760,36.3500", "destination": "127.3820,36.3560"},
                  note="(첫 호출은 느림)")
if route_res:
    sr = route_res.get("safe_route", {})
    st = route_res.get("shortest_route", {})
    ai = route_res.get("ai_analysis", {})
    print(f"         → 안전경로 {sr.get('distance_m')}m (위험최근접 {sr.get('min_dist_to_danger_m')}m)")
    print(f"         → 최단경로 {st.get('distance_m')}m (위험최근접 {st.get('min_dist_to_danger_m')}m)")
    print(f"         → AI분석: {ai.get('risk_level')} ({ai.get('mode')})")
    print(f"         → cache_hit: {route_res.get('cache_hit')}")

# 두 번째 호출 - 캐시 확인
route_res2 = check("안전경로 재계산(캐시)", "POST", "/route/safe",
                   json_body={"origin": "127.3760,36.3500", "destination": "127.3820,36.3560"},
                   note="(캐시로 빨라야 함)")
if route_res2:
    print(f"         → cache_hit: {route_res2.get('cache_hit')} (True면 캐시 정상)")

print("\n" + "=" * 60)
print(f"점검 완료:  성공 {ok}개 / 실패 {fail}개")
if fails:
    print("실패 목록:")
    for f in fails:
        print("  -", f)
else:
    print("🎉 모든 엔드포인트 정상 작동!")
print("=" * 60)
