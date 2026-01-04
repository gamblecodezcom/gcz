# backend/scripts/health_check.py

from services.db import get_db
from logger import get_logger

logger = get_logger("script-health-check")


async def health_check():
    """
    Simple DB health check.
    """
    db = await get_db()

    try:
        row = await db.fetchrow("SELECT NOW() AS ts")
        logger.info(f"[HEALTH] DB OK at {row['ts']}")
        return True

    except Exception as e:
        logger.error(f"[HEALTH] DB ERROR: {e}")
        return False