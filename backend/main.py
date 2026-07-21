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
    conn.commit()
    conn.close()


init_db()


# --- 요청/응답 형식 정의 ---
class LocationIn(BaseModel):
    child_id: str
    latitude: float
    longitude: float


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
