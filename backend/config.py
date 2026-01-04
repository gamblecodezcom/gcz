import os
from functools import lru_cache

class Settings:
    PROJECT_NAME: str = "GambleCodez Backend"
    ENV: str = os.getenv("GCZ_ENV", "production")

    # Database
    DATABASE_URL: str = os.getenv(
        "NEON_DB_URL",
        "postgresql://neondb_owner:npg_C7kPSNtVgmD4@ep-calm-base-a4zc750u-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )

    # AI
    PERPLEXITY_API_KEY: str = os.getenv("PERPLEXITY_API_KEY", "")

    # Security
    SUPER_ADMIN_ID: int = 6668510825
    JWT_SECRET: str = os.getenv("JWT_SECRET", "GCZ_SECRET")
    JWT_EXPIRE_DAYS: int = 7


@lru_cache()
def get_settings():
    return Settings()