# backend/routers/location.py
"""아이 위치 저장 / 조회 기능."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

from services.database import get_connection

router = APIRouter(prefix="/location", tags=["Location"])


class LocationIn(BaseModel):
    child_id: str
    latitude: float
    longitude: float


@router.post("", summary="아이 현재 위치 저장")
def save_location(loc: LocationIn):
    """아이의 현재 위치를 저장한다."""
    now = datetime.now().isoformat(timespec="seconds")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO locations (child_id, latitude, longitude, recorded_at) "
        "VALUES (?, ?, ?, ?)",
        (loc.child_id, loc.latitude, loc.longitude, now),
    )
    conn.commit()
    conn.close()
    return {
        "message": "위치가 저장되었습니다",
        "child_id": loc.child_id,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "recorded_at": now,
    }


@router.get("/all", summary="모든 아이의 최신 위치 (보호자 대시보드)")
def list_locations():
    """등록된 모든 아이의 가장 최근 위치를 한 번에 보여준다."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT child_id, latitude, longitude, recorded_at
        FROM locations
        WHERE id IN (SELECT MAX(id) FROM locations GROUP BY child_id)
        ORDER BY child_id
        """
    )
    rows = cur.fetchall()
    conn.close()
    return {
        "count": len(rows),
        "children": [
            {
                "child_id": r["child_id"],
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "recorded_at": r["recorded_at"],
            }
            for r in rows
        ],
    }


@router.get("/{child_id}", summary="특정 아이의 최신 위치 조회")
def get_latest_location(child_id: str):
    """보호자가 특정 아이의 가장 최근 위치를 확인한다."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT child_id, latitude, longitude, recorded_at FROM locations "
        "WHERE child_id = ? ORDER BY id DESC LIMIT 1",
        (child_id,),
    )
    row = cur.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="해당 아이의 위치 기록이 없습니다")
    return {
        "child_id": row["child_id"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "recorded_at": row["recorded_at"],
    }
