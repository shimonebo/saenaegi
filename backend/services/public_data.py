# backend/services/public_data.py
import requests  # (나중에 실제 공공데이터 API 연동 시 사용)


def get_tram_construction_data():
    """
    대전 트램 공사 구간 및 위험 지역 정보 (해커톤 데모용 샘플).

    === 위험구간 추가/수정법 ===
    아래 리스트에 딕셔너리를 추가하면 지도에 빨간 원으로 뜨고 안전경로가 피해 갑니다.
      lat/lng: 위경도, risk_level: "고"/"중"/"저", location_name/description: 설명
    ※ 팁: 경로 위에 정확히 놓아야 우회가 보입니다.
      (백엔드에 /route/plan 요청 → safe_route.coords 중간 좌표를 쓰면 확실)
    """
    construction_zones = [
        # === 데모 핵심: 서원초 → 보라2단지 실제 경로 한가운데에 배치 ===
        {
            "id": "tram_zone_01",
            "location_name": "둔산동 트램 공사 구간 (보도 전면 통제)",
            "risk_level": "고",
            "description": "트램 공사로 보행로 폐쇄, 우회 필요",
            "lat": 36.3548118,   # 경로 한가운데 (정확히 여기서 막음)
            "lng": 127.3989189,
        },
        {
            "id": "tram_zone_02",
            "location_name": "둔산동 도로 정비 구간",
            "risk_level": "고",
            "description": "중장비 이동 구간, 어린이 통행 위험",
            "lat": 36.3540,
            "lng": 127.3995,
        },
        # === 그 외 지역 위험구간 (지도 풍부하게) ===
        {
            "id": "tram_zone_03",
            "location_name": "갤러리아 타임월드 인근 트램 공사",
            "risk_level": "중",
            "description": "차량·보행자 혼재 구간",
            "lat": 36.3522,
            "lng": 127.3781,
        },
        {
            "id": "tram_zone_04",
            "location_name": "정부청사역 주변 도로 정비",
            "risk_level": "저",
            "description": "부분 통제, 경미한 주의",
            "lat": 36.3598,
            "lng": 127.3847,
        },
    ]

    return {
        "status": "success",
        "count": len(construction_zones),
        "data": construction_zones,
    }
