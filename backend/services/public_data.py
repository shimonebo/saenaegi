# backend/services/public_data.py
import requests

def get_tram_construction_data():
    """
    대전 트램 공사 구간 및 도로 통제 정보를 가져오는 함수입니다.
    프로젝트 기획서에 명시된 실시간 트램 공사 정보 및 위험 지역 데이터를 처리합니다[cite: 1].
    """
    # TODO: 추후 공공데이터포털 API나 대전시 교통정보 데이터를 연동할 때 
    # 이 부분에 실제 requests 요청 로직을 추가합니다.
    
    # 해커톤 MVP 구현을 위한 대전 지역 주요 트램 공사 및 통행 제한 더미 데이터
    construction_zones = [
        {
            "id": "tram_zone_01",
            "location_name": "대전 둔산동 타임월드 인근 트램 공사 구간",
            "risk_level": "고",
            "description": "보도 통행 제한 및 우회 필요",
            "lat": 36.3522,
            "lng": 127.3781
        },
        {
            "id": "tram_zone_02",
            "location_name": "대전 정부청사역 주변 도로 정비",
            "risk_level": "중",
            "description": "차량 및 보행자 주의 구간",
            "lat": 36.3598,
            "lng": 127.3847
        }
    ]
    
    return {
        "status": "success",
        "count": len(construction_zones),
        "data": construction_zones
    }