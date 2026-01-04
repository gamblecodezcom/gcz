from fastapi import APIRouter
from services.db import get_db
from logger import get_logger

router = APIRouter(prefix="/api/casinos", tags=["Casinos"])
logger = get_logger("gcz-casinos")


@router.get("/")
async def casinos():
    db = await get_db()
    rows = await db.fetch(
        """
        SELECT name, category, icon_url, priority, status
        FROM casinos
        WHERE status='active'
        ORDER BY priority DESC
        """
    )
    await db.close()
    return [dict(r) for r in rows]