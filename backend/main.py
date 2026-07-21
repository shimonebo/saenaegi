from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import sqlite3

app = FastAPI(title="Aion-gil API")

DB_NAME = "aiongil.db"


# --- 데이터베이스 준비 ---
def init_db():
    """서버 시작 시 필요한 테이블을 만든다."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            child_id TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            recorded_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            child_id TEXT NOT NULL,
            message TEXT,
            latitude REAL,
            longitude REAL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


init_db()


# --- 요청/응답 형식 정의 ---
class LocationIn(BaseModel):
    child_id: str
    latitude: float
    longitude: float


class AlertIn(BaseModel):
    child_id: str
    message: str = "긴급 도움 요청"


# --- 내부 함수: 특정 아이의 마지막 위치 가져오기 ---
def fetch_last_location(child_id: str):
    conn = sqlite3.connect(DB_NAME)
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
    return row[0], row[1]


# --- 기본 확인용 엔드포인트 ---
@app.get("/")
def root():
    return {"message": "Aion-gil API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# --- 위치 저장 ---
@app.post("/location")
def save_location(loc: LocationIn):
    """아이의 현재 위치를 저장한다."""
    now = datetime.now().isoformat(timespec="seconds")
    conn = sqlite3.connect(DB_NAME)
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


# --- 특정 아이의 최신 위치 조회 ---
@app.get("/location/{child_id}")
def get_latest_location(child_id: str):
    """보호자가 특정 아이의 가장 최근 위치를 확인한다."""
    conn = sqlite3.connect(DB_NAME)
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
        "child_id": row[0],
        "latitude": row[1],
        "longitude": row[2],
        "recorded_at": row[3],
    }


# --- 전체 아이 목록(각자 최신 위치) 조회 ---
@app.get("/locations")
def list_locations():
    """등록된 모든 아이의 최신 위치를 한 번에 보여준다 (보호자 대시보드용)."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT child_id, latitude, longitude, recorded_at
        FROM locations
        WHERE id IN (
            SELECT MAX(id) FROM locations GROUP BY child_id
        )
        ORDER BY child_id
        """
    )
    rows = cur.fetchall()
    conn.close()

    return {
        "count": len(rows),
        "children": [
            {
                "child_id": r[0],
                "latitude": r[1],
                "longitude": r[2],
                "recorded_at": r[3],
            }
            for r in rows
        ],
    }


# --- 위급 신고 접수 ---
@app.post("/alert")
def create_alert(alert: AlertIn):
    """아이가 위급 상황을 신고하면, 마지막 위치와 함께 기록하고 보호자에게 알린다."""
    now = datetime.now().isoformat(timespec="seconds")

    # 신고한 아이의 마지막 위치를 자동으로 붙인다
    lat, lng = fetch_last_location(alert.child_id)

    conn = sqlite3.connect(DB_NAME)
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


# --- 활성 신고 목록 조회 (보호자용) ---
@app.get("/alerts")
def list_alerts():
    """아직 처리되지 않은(active) 위급 신고를 모두 보여준다."""
    conn = sqlite3.connect(DB_NAME)
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
                "alert_id": r[0],
                "child_id": r[1],
                "message": r[2],
                "latitude": r[3],
                "longitude": r[4],
                "status": r[5],
                "created_at": r[6],
            }
            for r in rows
        ],
    }


# --- 신고 처리 완료 (보호자가 확인함) ---
@app.post("/alert/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    """보호자가 신고를 확인하면 상태를 'resolved'로 바꾼다."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT id FROM alerts WHERE id = ?", (alert_id,))
    if cur.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="해당 신고를 찾을 수 없습니다")

    cur.execute("UPDATE alerts SET status = 'resolved' WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()

    return {"message": "신고가 처리되었습니다", "alert_id": alert_id, "status": "resolved"}
