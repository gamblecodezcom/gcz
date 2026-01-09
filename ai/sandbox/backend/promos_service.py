from services.db import get_db
from backend.logger import get_logger

logger = get_logger("gcz-promos-service")


# ============================================================
#  GET PROMO CODES (type = 'code')
# ============================================================

async def get_promo_codes():
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT
                id,
                site,
                description,
                created_at,
                verified,
                code
            FROM promos
            WHERE type = 'code' AND active = TRUE
            ORDER BY created_at DESC
            """
        )

        return [
            {
                "id": r["id"],
                "site": r["site"].lower() if r["site"] else None,
                "code": r["code"],
                "description": r["description"],
                "createdAt": r["created_at"],
                "verified": bool(r["verified"]),
            }
            for r in rows
        ]

    except Exception as e:
        logger.error(f"[PROMOS] Failed to load promo codes: {e}")
        return []


# ============================================================
#  GET PROMO LINKS (type = 'link')
# ============================================================

async def get_promo_links():
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT
                id,
                site,
                description,
                created_at,
                verified,
                url
            FROM promos
            WHERE type = 'link' AND active = TRUE
            ORDER BY created_at DESC
            """
        )

        return [
            {
                "id": r["id"],
                "site": r["site"].lower() if r["site"] else None,
                "url": r["url"],
                "description": r["description"],
                "createdAt": r["created_at"],
                "verified": bool(r["verified"]),
            }
            for r in rows
        ]

    except Exception as e:
        logger.error(f"[PROMOS] Failed to load promo links: {e}")
        return []
