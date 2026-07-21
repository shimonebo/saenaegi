# backend/services/database.py
"""
위치 / 알림 / 스케줄 기능이 공용으로 쓰는 SQLite 데이터베이스 모듈.
서버 시작 시 필요한 테이블을 만들어 두고,
각 라우터는 get_connection()으로 연결을 얻어 쓴다.
"""
import sqlite3
from pathlib import Path

# backend 폴더 기준으로 db 파일 위치를 고정한다 (어디서 실행하든 같은 파일 사용)
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "aiongil.db"


def get_connection():
    """DB 연결을 돌려준다. 결과를 컬럼명으로도 꺼낼 수 있게 설정."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """서버 시작 시 필요한 테이블을 모두 생성한다."""
    conn = get_connection()
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

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            child_id TEXT NOT NULL,
            day TEXT NOT NULL,
            start_name TEXT NOT NULL,
            start_lat REAL NOT NULL,
            start_lng REAL NOT NULL,
            end_name TEXT NOT NULL,
            end_lat REAL NOT NULL,
            end_lng REAL NOT NULL,
            depart_time TEXT NOT NULL
        )
        """
    )

    conn.commit()
    conn.close()
