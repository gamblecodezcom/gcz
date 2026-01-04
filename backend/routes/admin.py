from fastapi import APIRouter
from services.db import get_db
from services.auth import require_admin
from logger import get_logger

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = get_logger("gcz-admin")


@router.get("/users")
async def list_users(admin_id: int):
    require_admin(admin_id)
    db = await get_db()
    rows = await db.fetch(
        "SELECT telegram_id, username, created_at FROM users ORDER BY created_at DESC"
    )
    await db.close()
    return [dict(r) for r in rows]