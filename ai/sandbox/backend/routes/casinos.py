from fastapi import APIRouter, HTTPException
from services.db import get_db
from backend.logger import get_logger

router = APIRouter(prefix="/api/casinos", tags=["Casinos"])
logger = get_logger("gcz-casinos")


@router.get("/")
async def casinos():
    """
    Returns all active casinos with full GCZ metadata.
    Pool‑safe, error‑safe, and optimized.
    """
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT
                name,
                category,
                icon_url,
                priority,
                status,
                affiliate_url,
                resolved_domain,
                level,
                redemption_minimum,
                redemption_speed,
                redemption_type
            FROM casinos
            WHERE status = 'active'
            ORDER BY priority DESC
            """
        )

        return [dict(r) for r in rows]

    except Exception as e:
        logger.error(f"[CASINOS] Failed to load casinos: {e}")
        raise HTTPException(status_code=500, detail="Failed to load casinos")