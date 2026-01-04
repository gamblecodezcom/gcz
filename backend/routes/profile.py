from fastapi import APIRouter, HTTPException
from services.db import get_db
from logger import get_logger

router = APIRouter(prefix="/api/profile", tags=["Profile"])
logger = get_logger("gcz-profile")


@router.get("/{telegram_id}")
async def get_profile(telegram_id: int):
    db = await get_db()

    try:
        # ============================
        # USER CORE PROFILE
        # ============================
        user = await db.fetchrow(
            """
            SELECT
                telegram_id,
                username,
                cwallet_id,
                runewager_username,
                winna_username,
                newsletter_agreed,
                jurisdiction,
                raffle_pin_set,
                created_at
            FROM users
            WHERE telegram_id = $1
            """,
            telegram_id,
        )

        if not user:
            logger.warning(f"[PROFILE] User not found: {telegram_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # ============================
        # LINKED CASINOS
        # ============================
        linked = await db.fetch(
            """
            SELECT site, account_id, created_at
            FROM linked_casinos
            WHERE telegram_id = $1
            ORDER BY created_at DESC
            """,
            telegram_id,
        )

        # ============================
        # RESPONSE
        # ============================
        return {
            "telegram_id": user["telegram_id"],
            "username": user["username"],
            "cwallet_id": user["cwallet_id"],
            "runewager_username": user["runewager_username"],
            "winna_username": user["winna_username"],
            "newsletterAgreed": user["newsletter_agreed"],
            "jurisdiction": user["jurisdiction"],
            "rafflePinSet": user["raffle_pin_set"],
            "created_at": user["created_at"],
            "linkedCasinos": [dict(r) for r in linked],
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"[PROFILE] Error loading profile {telegram_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to load profile")