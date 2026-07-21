# backend/main.py
from fastapi import FastAPI
from routers import route

app = FastAPI(
    title="아이온길(Aion-gil) 백엔드",
    version="1.0.0"
)

# 경로 라우터 등록
app.include_router(route.router)

@app.get("/")
async def root():
    return {"message": "아이온길 백엔드 서버가 정상적으로 실행중입니다."}