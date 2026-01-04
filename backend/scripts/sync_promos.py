# backend/scripts/sync_promos.py

from services.db import get_db
from backend.logger import get_logger

logger = get_logger("script-sync-promos")


async def sync_promos():
    """
    Syncs promos table from promo sources.
    """
    db = await get_db()

    logger.info("[PROMOS] Syncing promos...")

    try:
        await db.execute("REFRESH MATERIALIZED VIEW promos_view")
        logger.info("[PROMOS] Materialized view refreshed")

    except Exception as e:
        logger.error(f"[PROMOS] Sync failed: {e}")