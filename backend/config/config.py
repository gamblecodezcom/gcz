import os
from functools import lru_cache
from pathlib import Path


class Settings:
    PROJECT_NAME: str = "GambleCodez Backend"

    # ============================================================
    # ENVIRONMENT
    # ============================================================
    ENV: str = os.getenv("ENV", "production")

    # ============================================================
    # DATABASE (Neon + Local)
    # ============================================================
    DATABASE_URL: str = (
        os.getenv("AI_AGENT_NEON_DB_URL")
        or os.getenv("DATABASE_URL")
        or "postgresql://neondb_owner:npg_C7kPSNtVgmD4@ep-calm-base-a4zc750u-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )

    # ============================================================
    # AI PROVIDERS — GOD MODE
    # ============================================================

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4.1")

    # Perplexity
    PERPLEXITY_API_KEY: str = os.getenv("PERPLEXITY_API_KEY", "")
    PERPLEXITY_MODEL: str = os.getenv("PERPLEXITY_MODEL", "sonar-pro")

    # Cursor
    CURSOR_API_KEY: str = os.getenv("CURSOR_API_KEY", "")
    CURSOR_API_BASE: str = os.getenv("CURSOR_API_BASE", "https://api.cursor.sh/v1")
    CURSOR_MODEL: str = os.getenv("CURSOR_MODEL", "cursor-large")

    # Goose / OpenAI-compatible
    GOOSE_API_KEY: str = os.getenv("GOOSE_API_KEY", "")
    GOOSE_API_BASE: str = os.getenv("GOOSE_API_BASE", "")
    GOOSE_MODEL: str = os.getenv("GOOSE_MODEL", "auto")

    # Anthropic
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-opus")

    # OpenRouter
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4.1")

    # ============================================================
    # SECURITY
    # ============================================================
    SUPER_ADMIN_ID: int = int(os.getenv("SUPER_ADMIN_ID", "6668510825"))
    ADMIN_TELEGRAM_IDS: str = os.getenv("ADMIN_TELEGRAM_IDS", "")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "GCZ_SECRET")
    JWT_EXPIRE_DAYS: int = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

    # ============================================================
    # TELEGRAM BOT
    # ============================================================
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_WEBHOOK_URL: str = os.getenv("TELEGRAM_WEBHOOK_URL", "")

    # ============================================================
    # DOMAIN + URLS
    # ============================================================
    DOMAIN: str = os.getenv("DOMAIN", "https://gamblecodez.com")

    # ============================================================
    # LOGGING
    # ============================================================
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    LOG_DIR: Path = Path(os.getenv("LOG_DIR", "/var/log/gamblecodez"))

    # ============================================================
    # PATHS
    # ============================================================
    ROOT_DIR: Path = Path(__file__).resolve().parents[1]
    ENV_FILE: Path = ROOT_DIR / ".env"


@lru_cache()
def get_settings():
    return Settings()