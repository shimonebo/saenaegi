# backend/routers/schedule.py
"""아이 귀가 일정 등록 / 조회 / 삭제 + 예상 소요시간 계산."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import math

from services.database import get_connection

router = APIRouter(prefix="/schedule", tags=["Schedule"])

WALK_SPEED_M_PER_MIN = 50.0
DAY_ORDER = {"월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6, "일": 7}
WEEKDAY_KR = ["월", "화", "수", "목", "금", "토", "일"]


class ScheduleIn(BaseModel):
    child_id: str
    day: str
    start_name: str
    start_lat: float
    start_lng: float
    end_name: str
    end_lat: float
    end_lng: float
    depart_time: str


def _haversine_m(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _estimate_minutes(distance_m):
    return distance_m / WALK_SPEED_M_PER_MIN


def _add_minutes(hhmm, minutes):
    try:
        base = datetime.strptime(hhmm, "%H:%M")
    except ValueError:
        return None
    return (base + timedelta(minutes=minutes)).strftime("%H:%M")


def _row_to_item(r):
    dist = _haversine_m(r["start_lat"], r["start_lng"], r["end_lat"], r["end_lng"])
    minutes = _estimate_minutes(dist)
    return {
        "schedule_id": r["id"],
        "day": r["day"],
        "route": f"{r['start_name']} → {r['end_name']}",
        "start": {"name": r["start_name"], "lat": r["start_lat"], "lng": r["start_lng"]},
        "end": {"name": r["end_name"], "lat": r["end_lat"], "lng": r["end_lng"]},
        "depart_time": r["depart_time"],
        "distance_m": round(dist),
        "estimated_minutes": round(minutes),
        "expected_arrival": _add_minutes(r["depart_time"], minutes),
    }


@router.post("", summary="아이 귀가 일정 등록")
def create_schedule(s: ScheduleIn):
    dist = _haversine_m(s.start_lat, s.start_lng, s.end_lat, s.end_lng)
    minutes = _estimate_minutes(dist)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO schedules
        (child_id, day, start_name, start_lat, start_lng, end_name, end_lat, end_lng, depart_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (s.child_id, s.day, s.start_name, s.start_lat, s.start_lng,
         s.end_name, s.end_lat, s.end_lng, s.depart_time),
    )
    schedule_id = cur.lastrowid
    conn.commit()
    conn.close()
    return {
        "message": "일정이 등록되었습니다",
        "schedule_id": schedule_id,
        "child_id": s.child_id,
        "day": s.day,
        "route": f"{s.start_name} → {s.end_name}",
        "depart_time": s.depart_time,
        "distance_m": round(dist),
        "estimated_minutes": round(minutes),
        "expected_arrival": _add_minutes(s.depart_time, minutes),
    }


@router.get("/today/{child_id}", summary="오늘 일정 (보호자 홈)")
def get_today_schedule(child_id: str):
    today = WEEKDAY_KR[datetime.now().weekday()]
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM schedules WHERE child_id = ? AND day = ? ORDER BY depart_time",
        (child_id, today),
    )
    rows = cur.fetchall()
    conn.close()
    return {
        "child_id": child_id,
        "today": today,
        "count": len(rows),
        "schedules": [_row_to_item(r) for r in rows],
    }


@router.get("/{child_id}", summary="특정 아이의 전체 일정")
def get_schedules(child_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM schedules WHERE child_id = ?", (child_id,))
    rows = cur.fetchall()
    conn.close()
    items = [_row_to_item(r) for r in rows]
    items.sort(key=lambda x: (DAY_ORDER.get(x["day"], 99), x["depart_time"]))
    return {"child_id": child_id, "count": len(items), "schedules": items}


@router.delete("/{schedule_id}", summary="일정 삭제")
def delete_schedule(schedule_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM schedules WHERE id = ?", (schedule_id,))
    if cur.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="해당 일정을 찾을 수 없습니다")
    cur.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
    conn.commit()
    conn.close()
    return {"message": "일정이 삭제되었습니다", "schedule_id": schedule_id}
