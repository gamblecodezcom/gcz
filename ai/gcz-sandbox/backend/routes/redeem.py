from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

from services.db import get_db
from backend.logger import get_logger

router = APIRouter(prefix="/api/redeem", tags=["Redeem"])
logger = get_logger("gcz-redeem")


class Redeem(BaseModel):
    telegram_id: int
    site: str
    account_id: str


ALLOWED_SITES = ["runewager", "winna", "cwallet", "stake", "wow", "pulse"]


def validate_site(site: str):
    if site.lower() not in ALLOWED_SITES:
        raise HTTPException(status_code=400, detail="Unsupported site")


@router.post("/")
async def redeem(payload: Redeem):
    validate_site(payload.site)

    db = await get_db()

    try:
        await db.execute(
            """
            INSERT INTO redemptions (telegram_id, site, account_id, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            payload.telegram_id,
            payload.site.lower(),
            payload.account_id,
            datetime.utcnow(),
        )

        logger.info(
            f"[REDEEM] Redemption logged: tg={payload.telegram_id} site={payload.site}"
        )

        return {"success": True}

    except Exception as e:
        logger.error(f"[REDEEM] DB insert error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log redemption")