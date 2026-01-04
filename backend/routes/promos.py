from fastapi import APIRouter
from services.db import get_db
from logger import get_logger

router = APIRouter(prefix="/api/promos", tags=["Promos"])
logger = get_logger("gcz-promos")


@router.get("/")
async def list_promos():
    db = await get_db()
    rows = await db.fetch(
        """
        SELECT id, title, description, url, created_at, active
        FROM promos
        WHERE active = true
        ORDER BY created_at DESC
        """
    )
    await db.close()
    return [dict(r) for r in rows]