from fastapi import APIRouter
from services.db import get_db
from logger import get_logger

router = APIRouter(prefix="/api/affiliates", tags=["Affiliates"])
logger = get_logger("gcz-affiliates")


@router.get("/")
async def list_affiliates():
    db = await get_db()
    rows = await db.fetch(
        """
        SELECT name, affiliate_url, priority, category, status, level,
               bonus_code, bonus_description, icon_url, redemption_speed,
               redemption_minimum, redemption_type
        FROM affiliates
        ORDER BY priority DESC
        """
    )
    await db.close()
    return [dict(r) for r in rows]