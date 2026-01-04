import os
from pathlib import Path
from dotenv import load_dotenv
from logger import get_logger

logger = get_logger("env-loader")


def load_env(env_path: Path):
    """
    Loads .env file and logs missing critical variables.
    """
    if not env_path.exists():
        logger.warning(f"[ENV] No .env file found at {env_path}")
        return

    load_dotenv(env_path)
    logger.info(f"[ENV] Loaded environment from {env_path}")

    required = [
        "JWT_SECRET",
        "TELEGRAM_BOT_TOKEN",
        "DATABASE_URL",
    ]

    for key in required:
        if not os.getenv(key):
            logger.warning(f"[ENV] Missing recommended variable: {key}")