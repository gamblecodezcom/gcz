# backend/scripts/rebuild_redirects.py

from services.db import get_db
from backend.logger import get_logger

logger = get_logger("script-rebuild-redirects")


async def rebuild_redirects():
    """
    Rebuilds redirect table from affiliates_master.
    """
    db = await get_db()

    logger.info("[REDIRECTS] Rebuilding redirect table...")

    try:
        rows = await db.fetch("SELECT name, affiliate_url, slug FROM affiliates_master")

        await db.execute("TRUNCATE TABLE redirects")

        for r in rows:
            await db.execute(
                """
                INSERT INTO redirects (name, slug, url)
                VALUES ($1, $2, $3)
                """,
                r["name"], r["slug"], r["affiliate_url"]
            )

        logger.info(f"[REDIRECTS] Rebuilt {len(rows)} redirects")

    except Exception as e:
        logger.error(f"[REDIRECTS] Failed: {e}")