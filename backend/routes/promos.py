from fastapi import APIRouter, HTTPException
from services.db import get_db
from services.promos_service import get_promo_codes, get_promo_links
from logger import get_logger

router = APIRouter(prefix="/api/promos", tags=["Promos"])
logger = get_logger("gcz-promos")


# ============================================================
#  MASTER LIST (codes + links)
# ============================================================

@router.get("/")
async def all_promos():
    """
    Returns both promo codes and promo links in GCZ format.
    Used by:
      - Drops dashboard
      - Telegram forwarder
      - Admin panel
      - AI extraction pipeline
    """
    try:
        codes = await get_promo_codes()
        links = await get_promo_links()

        return {
            "codes": codes,
            "links": links
        }

    except Exception as e:
        logger.error(f"[PROMOS] Failed to load all promos: {e}")
        raise HTTPException(status_code=500, detail="Failed to load promos")


# ============================================================
#  RAW DB LIST (legacy consumers)
# ============================================================

@router.get("/raw")
async def list_promos_raw():
    """
    Returns the latest active promos directly from DB.
    Normalized for GCZ frontend + bots.
    """
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT
                id,
                type,
                site,
                description,
                created_at,
                verified,
                code,
                url
            FROM promos
            WHERE active = TRUE
            ORDER BY created_at DESC
            LIMIT 200
            """
        )

        promos = []
        for r in rows:
            promos.append({
                "id": r["id"],
                "type": r["type"].lower() if r["type"] else None,
                "site": r["site"].lower() if r["site"] else None,
                "description": r["description"],
                "created_at": r["created_at"],
                "verified": bool(r["verified"]),
                "code": r["code"],
                "url": r["url"],
            })

        return promos

    except Exception as e:
        logger.error(f"[PROMOS] Failed to load raw promos: {e}")
        raise HTTPException(status_code=500, detail="Failed to load promos")


# ============================================================
#  CODES ONLY
# ============================================================

@router.get("/codes")
async def promo_codes():
    """
    Returns only promo codes.
    """
    try:
        return await get_promo_codes()
    except Exception as e:
        logger.error(f"[PROMOS] Failed to load promo codes: {e}")
        raise HTTPException(status_code=500, detail="Failed to load promo codes")


# ============================================================
#  LINKS ONLY
# ============================================================

@router.get("/links")
async def promo_links():
    """
    Returns only promo links.
    """
    try:
        return await get_promo_links()
    except Exception as e:
        logger.error(f"[PROMOS] Failed to load promo links: {e}")
        raise HTTPException(status_code=500, detail="Failed to load promo links")