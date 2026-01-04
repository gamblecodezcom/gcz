from fastapi import APIRouter, HTTPException
from services.db import get_db
from services.auth import require_admin
from logger import get_logger

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = get_logger("gcz-admin")


@router.get("/users")
async def list_users(admin_id: int):
    """
    Returns all users for the admin panel.
    Fully async, pool-safe, and GCZ aligned.
    """
    # Admin validation (async)
    await require_admin(admin_id)

    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT telegram_id, username, created_at
            FROM users
            ORDER BY created_at DESC
            """
        )

        logger.info(f"[ADMIN] User list requested by admin {admin_id}")

        return [dict(r) for r in rows]

    except Exception as e:
        logger.error(f"[ADMIN] Failed to load users: {e}")
        raise HTTPException(status_code=500, detail="Failed to load users")