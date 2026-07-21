# backend/services/ai_analysis.py
"""
경로의 위험도를 Claude AI로 분석하는 모듈.

핵심 원칙:
- 항상 같은 형태로 결과를 돌려준다.
  { "risk_level": "안전|주의|위험", "ai_comment": "...", "mode": "ai|fallback_mock" }
- ANTHROPIC_API_KEY 가 없거나 호출이 실패하면, 서버가 죽지 않고
  규칙 기반(mock) 결과로 자동 대체한다. (해커톤 데모 안정성)
"""
import json
import requests

from config import ANTHROPIC_API_KEY

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-3-5-sonnet-20241022"
ALLOWED_LEVELS = {"안전", "주의", "위험"}


def _rule_based_result(danger_zones: list) -> dict:
    """API 키가 없거나 실패했을 때 쓰는 간단한 규칙 기반 판단."""
    levels = [z.get("risk_level") for z in danger_zones]
    if "고" in levels:
        return {
            "risk_level": "위험",
            "ai_comment": "경로 주변에 위험도가 높은 공사 구간이 있습니다. 보호자 동행을 권장합니다.",
            "mode": "fallback_mock",
        }
    if "중" in levels:
        return {
            "risk_level": "주의",
            "ai_comment": "경로 주변에 공사/정비 구간이 있어 주의가 필요합니다.",
            "mode": "fallback_mock",
        }
    return {
        "risk_level": "안전",
        "ai_comment": "경로 주변에 특별한 위험 요소가 확인되지 않았습니다.",
        "mode": "fallback_mock",
    }


def analyze_route_safety(route_info: dict, danger_zones: list) -> dict:
    """
    경로 정보 + 위험 구간 정보를 받아 아동 귀가 안전도를 분석한다.
    route_info 예: {"distance_m": 1100, "passes_danger": True, "min_dist_to_danger_m": 40}
    danger_zones 예: [{"location_name": "...", "risk_level": "고", ...}, ...]
    """
    # 키가 없으면 규칙 기반으로 즉시 대체
    if not ANTHROPIC_API_KEY:
        return _rule_based_result(danger_zones)

    prompt = (
        "당신은 초등학생 아동 안심 귀가 서비스의 AI 안전 분석 시스템입니다. "
        "아래 경로 정보와 대전 지역 위험 구간 정보를 보고 초등학생이 걷기에 안전한지 평가하세요.\n\n"
        f"[경로 정보]\n{json.dumps(route_info, ensure_ascii=False)}\n\n"
        f"[위험 구간 정보]\n{json.dumps(danger_zones, ensure_ascii=False)}\n\n"
        "반드시 아래 JSON 형식으로만 답하세요. 다른 말은 붙이지 마세요.\n"
        '{"risk_level": "안전|주의|위험 중 하나", "ai_comment": "보호자에게 전달할 한두 문장"}'
    )

    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": MODEL,
        "max_tokens": 400,
        "messages": [{"role": "user", "content": prompt}],
    }

    try:
        res = requests.post(ANTHROPIC_URL, json=payload, headers=headers, timeout=15)
        if res.status_code != 200:
            return _rule_based_result(danger_zones)

        text = res.json()["content"][0]["text"].strip()

        # Claude가 코드블록(```json ... ```)으로 감쌀 때를 대비해 벗겨낸다
        if text.startswith("```"):
            text = text.strip("`")
            text = text[text.find("{"):]

        parsed = json.loads(text[text.find("{"): text.rfind("}") + 1])
        level = parsed.get("risk_level", "").strip()
        if level not in ALLOWED_LEVELS:
            level = "주의"

        return {
            "risk_level": level,
            "ai_comment": parsed.get("ai_comment", "").strip() or "분석 결과를 확인하세요.",
            "mode": "ai",
        }
    except Exception:
        # 네트워크/파싱 등 어떤 오류든 데모가 멈추지 않게 규칙 기반으로 대체
        return _rule_based_result(danger_zones)
