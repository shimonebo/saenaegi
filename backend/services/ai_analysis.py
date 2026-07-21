# backend/services/ai_analysis.py
import os
import requests
from dotenv import load_dotenv

# 환경 변수 로드 (.env에서 ANTHROPIC_API_KEY를 읽어옵니다)
load_dotenv()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

def analyze_route_safety(route_info: dict, construction_info: list):
    """
    카카오맵 경로 데이터와 트램 공사/위험 지역 데이터를 조합하여 
    Claude AI를 통해 아동 귀가 경로의 위험도(안전, 주의, 위험)를 분석하는 함수입니다[cite: 1].
    """
    # API 키가 설정되지 않은 경우를 대비한 MVP용 안전 장치
    if not ANTHROPIC_API_KEY:
        return {
            "risk_level": "주의",
            "ai_comment": "경로 내 트램 공사 구간이 포함되어 있습니다. 보호자의 주의가 필요합니다.",
            "mode": "fallback_mock"
        }

    url = "https://api.anthropic.com/v1/messages"
    
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-Type": "application/json"
    }
    
    prompt = f"""
    당신은 초등학생 아동 안심 귀가 서비스 '아이온길'의 AI 안전 분석 시스템입니다[cite: 1].
    아래의 경로 정보와 대전 트램 공사/위험 지역 데이터를 분석하여, 
    초등학생이 이동하기에 안전한지 평가하고 보호자에게 전달할 분석 결과를 작성해주세요.

    [경로 정보]
    {route_info}

    [공사 및 위험 지역 정보]
    {construction_info}

    결과는 위험도(안전, 주의, 위험 중 하나)와 이해하기 쉬운 안내 코멘트로 구성해 주세요.
    """

    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 500,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            result = response.json()
            return {
                "status": "success",
                "analysis": result["content"][0]["text"]
            }
        else:
            return {
                "error": "Claude API 호출 실패",
                "status_code": response.status_code,
                "detail": response.text
            }
    except Exception as e:
        return {
            "error": "AI 분석 중 오류 발생",
            "detail": str(e)
        }