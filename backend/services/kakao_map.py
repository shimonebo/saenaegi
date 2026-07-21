# backend/services/kakao_map.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()
KAKAO_API_KEY = os.getenv("KAKAO_API_KEY")

def get_kakao_route(origin: str, destination: str):
    """
    카카오 모빌리티 API를 호출하여 출발지와 목적지 간의 경로 정보를 가져오는 함수입니다.
    """
    # API 키가 없거나 설정되지 않은 경우를 위한 MVP 더미 데이터 반환
    if not KAKAO_API_KEY or KAKAO_API_KEY == "여러분의_카카오_디벨로퍼스_API_키_입력":
        return {
            "origin": origin,
            "destination": destination,
            "distance": "3.5km",
            "duration": "15분",
            "path_summary": "초등학교 안전 보호구역 우회 경로 (더미 데이터)",
            "mode": "fallback_mock"
        }

    url = "https://apis-navi.kakaomobility.com/v1/directions"
    headers = {
        "Authorization": f"KakaoAK {KAKAO_API_KEY}",
        "Content-Type": "application/json"
    }
    params = {
        "origin": origin,
        "destination": destination
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": "카카오맵 API 호출 실패",
                "status_code": response.status_code,
                "detail": response.text
            }
    except Exception as e:
        return {
            "error": "카카오맵 통신 중 오류 발생",
            "detail": str(e)
        }