import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)

APP_MODE = os.getenv(
    "APP_MODE",
    "demo"
).strip().lower()

ALLOWED_APP_MODES = {
    "demo",
    "live",
}

if APP_MODE not in ALLOWED_APP_MODES:
    raise RuntimeError(
        "APP_MODE must be demo or live. "
        f"present input: {APP_MODE}"
    )

KAKAO_API_KEY = os.getenv(
    "KAKAO_API_KEY",
    ""
).strip()

ANTHROPIC_API_KEY = os.getenv(
    "ANTHROPIC_API_KEY",
    ""
).strip()