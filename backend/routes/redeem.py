from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

from services.db import get_db
from logger import get_logger

router = APIRouter(prefix="/api/redeem", tags=["Redeem"])
logger = get_logger("gcz-redeem")


class Redeem(BaseModel):
    telegram_id: int
    site: str
    account_id: str


@router.post("/")
async def redeem(payload: Redeem):
    db = await get_db()
    await db.execute(
        """
        INSERT INTO redemptions (telegram_id, site, account_id, created_at)
        VALUES ($1, $2, $3, $4)
        """,
        payload.telegram_id,
        payload.site,
        payload.account_id,
        datetime.utcnow(),
    )
    await db.close()
    logger.info(f"Redemption: {payload.telegram_id} on {payload.site}")
    return {"success": True}