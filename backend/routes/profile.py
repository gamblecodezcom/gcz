from fastapi import APIRouter, HTTPException
from services.db import get_db
from logger import get_logger

router = APIRouter(prefix="/api/profile", tags=["Profile"])
logger = get_logger("gcz-profile")


@router.get("/{telegram_id}")
async def get_profile(telegram_id: int):
    db = await get_db()

    user = await db.fetchrow(
        """
        SELECT telegram_id, username, created_at
        FROM users WHERE telegram_id=$1
        """,
        telegram_id,
    )

    if not user:
        await db.close()
        raise HTTPException(status_code=404, detail="User not found")

    linked = await db.fetch(
        """
        SELECT site, account_id, created_at
        FROM linked_casinos
        WHERE telegram_id=$1
        """,
        telegram_id,
    )

    await db.close()

    return {
        "telegram_id": user["telegram_id"],
        "username": user["username"],
        "created_at": user["created_at"],
        "linkedCasinos": [dict(r) for r in linked],
    }