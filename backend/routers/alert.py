# backend/routers/alert.py
"""위급 신고 접수 / 조회 / 처리 기능."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

from services.database import get_connection

router = APIRouter(prefix="/alert", tags=["Alert"])


class AlertIn(BaseModel):
    child_id: str
    message: str = "긴급 도움 요청"


def _fetch_last_location(child_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT latitude, longitude FROM locations "
        "WHERE child_id = ? ORDER BY id DESC LIMIT 1",
        (child_id,),
    )
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None, None
    return row["latitude"], row["longitude"]


@router.post("", summary="위급 신고 접수 (마지막 위치 자동 첨부)")
def create_alert(alert: AlertIn):
    """아이가 위급 상황을 신고하면, 마지막 위치와 함께 기록하고 보호자에게 알린다."""
    now = datetime.now().isoformat(timespec="seconds")
    lat, lng = _fetch_last_location(alert.child_id)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO alerts (child_id, message, latitude, longitude, status, created_at) "
        "VALUES (?, ?, ?, ?, 'active', ?)",
        (alert.child_id, alert.message, lat, lng, now),
    )
    alert_id = cur.lastrowid
    conn.commit()
    conn.close()

    return {
        "message": "보호자에게 위급 상황을 전달했습니다",
        "alert_id": alert_id,
        "child_id": alert.child_id,
        "content": alert.message,
        "latitude": lat,
        "longitude": lng,
        "status": "active",
        "created_at": now,
        "location_available": lat is not None,
    }


@router.get("/list", summary="활성 신고 목록 (보호자용)")
def list_alerts():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, child_id, message, latitude, longitude, status, created_at "
        "FROM alerts WHERE status = 'active' ORDER BY id DESC"
    )
    rows = cur.fetchall()
    conn.close()
    return {
        "count": len(rows),
        "alerts": [
            {
                "alert_id": r["id"],
                "child_id": r["child_id"],
                "message": r["message"],
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "status": r["status"],
                "created_at": r["created_at"],
            }
            for r in rows
        ],
    }


@router.post("/{alert_id}/resolve", summary="신고 처리 완료")
def resolve_alert(alert_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM alerts WHERE id = ?", (alert_id,))
    if cur.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="해당 신고를 찾을 수 없습니다")
    cur.execute("UPDATE alerts SET status = 'resolved' WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"message": "신고가 처리되었습니다", "alert_id": alert_id, "status": "resolved"}
