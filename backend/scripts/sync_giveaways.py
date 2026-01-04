# backend/scripts/sync_giveaways.py

from services.db import get_db
from backend.logger import get_logger

logger = get_logger("script-sync-giveaways")


async def sync_giveaways():
    """
    Auto-manages endless giveaways and cleans expired ones.
    """
    db = await get_db()

    logger.info("[GIVEAWAYS] Syncing giveaways...")

    try:
        # Close ended giveaways
        await db.execute("""
            UPDATE giveaways
            SET status = 'ended'
            WHERE end_time < NOW() AND status = 'active'
        """)

        # Auto-start endless giveaways
        await db.execute("""
            UPDATE giveaways
            SET status = 'active'
            WHERE endless = TRUE AND status = 'pending'
        """)

        logger.info("[GIVEAWAYS] Sync complete")

    except Exception as e:
        logger.error(f"[GIVEAWAYS] Sync failed: {e}")