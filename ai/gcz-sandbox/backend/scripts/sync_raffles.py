# backend/scripts/sync_raffles.py

from services.db import get_db
from backend.logger import get_logger

logger = get_logger("script-sync-raffles")


async def sync_raffles():
    """
    Cleans expired raffles and rebuilds raffle cache.
    """
    db = await get_db()

    logger.info("[RAFFLES] Syncing raffles...")

    try:
        await db.execute("""
            DELETE FROM raffles
            WHERE end_time < NOW() - INTERVAL '7 days'
        """)

        logger.info("[RAFFLES] Old raffles cleaned")

    except Exception as e:
        logger.error(f"[RAFFLES] Sync failed: {e}")