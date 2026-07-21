# backend/main.py
from fastapi import FastAPI
from config import APP_MODE

# 한음: 경로 라우터
from routers import route
# 현빈: 위치 / 알림 / 스케줄 라우터
from routers import location, alert, schedule
# 현빈: DB 초기화
from services.database import init_db

app = FastAPI(
    title="아이온길(Aion-gil) 백엔드",
    version="1.0.0",
    description="AI 아동 안심 귀가 서비스 백엔드 API",
)

# 서버 시작 시 DB 테이블 준비 (위치/알림/스케줄)
init_db()

# 경로 관련 라우터 등록 (한음)
app.include_router(route.router)
# 위치 / 알림 / 스케줄 라우터 등록 (현빈)
app.include_router(location.router)
app.include_router(alert.router)
app.include_router(schedule.router)


@app.get("/", tags=["default"], summary="백엔드 기본 상태 확인")
async def root():
    return {
        "service": "Aion-gil Backend",
        "message": "아이온길 백엔드 서버가 정상적으로 실행 중입니다.",
        "status": "running",
        "app_mode": APP_MODE,
    }


@app.get("/health", tags=["default"], summary="백엔드 상태 검사")
async def health_check():
    return {
        "status": "healthy",
        "service": "Aion-gil Backend",
        "app_mode": APP_MODE,
        "safe_route_status": (
            "demo_scope_ready" if APP_MODE == "demo" else "live_not_ready"
        ),
    }
