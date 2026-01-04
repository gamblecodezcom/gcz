# backend/scripts/sync_casinos.py

from services.db import get_db
from backend.logger import get_logger

logger = get_logger("script-sync-casinos")


async def sync_casinos():
    """
    Syncs casinos table from affiliates_master.
    """
    db = await get_db()

    logger.info("[CASINOS] Syncing casinos from affiliates_master...")

    try:
        rows = await db.fetch("""
            SELECT name, slug, category, icon_url, priority, status, level,
                   bonus_code, bonus_description, redemption_speed,
                   redemption_minimum, redemption_type
            FROM affiliates_master
        """)

        await db.execute("TRUNCATE TABLE casinos")

        for r in rows:
            await db.execute(
                """
                INSERT INTO casinos (
                    name, slug, category, icon_url, priority, status, level,
                    bonus_code, bonus_description, redemption_speed,
                    redemption_minimum, redemption_type
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                """,
                *r.values()
            )

        logger.info(f"[CASINOS] Synced {len(rows)} casinos")

    except Exception as e:
        logger.error(f"[CASINOS] Sync failed: {e}")