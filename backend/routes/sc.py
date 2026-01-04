from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from logger import get_logger

# Updated admin check (async + role-aware)
from services.auth import require_admin

# SC engine services
from services.sc_service import (
    check_runewager_tip_eligibility,
    log_runewager_tip_granted,
    create_drop_log,
    enter_raffle,
)

router = APIRouter(prefix="/api/sc", tags=["SC"])
logger = get_logger("gcz-sc")


# ============================================================
#  RUNEWAGER TIP
# ============================================================

class RunewagerEligibilityRequest(BaseModel):
    telegram_id: int


@router.post("/runewager/eligibility")
async def runewager_eligibility(payload: RunewagerEligibilityRequest):
    """
    Returns whether user qualifies for Runewager SC tip.
    Does NOT tip. Used by bot/admin to decide.
    """
    data = await check_runewager_tip_eligibility(payload.telegram_id)
    return data


class RunewagerTipLogRequest(BaseModel):
    telegram_id: int
    sc_amount: int
    admin_id: int


@router.post("/runewager/log-tip")
async def runewager_log_tip(payload: RunewagerTipLogRequest):
    """
    Called AFTER admin manually tips user on Runewager/sweeps site.
    Just logs in DB so they can't double-dip.
    """
    await require_admin(payload.admin_id)

    await log_runewager_tip_granted(
        telegram_id=payload.telegram_id,
        sc_amount=payload.sc_amount,
        admin_id=payload.admin_id,
    )

    logger.info(
        f"[SC] Runewager tip logged: tg={payload.telegram_id} "
        f"+{payload.sc_amount} SC by admin {payload.admin_id}"
    )

    return {"success": True}


# ============================================================
#  DROPS / PROMOS
# ============================================================

class DropRequest(BaseModel):
    telegram_id: int
    site: str
    base_sc: int
    reason: str
    admin_id: int


@router.post("/drop")
async def sc_drop(payload: DropRequest):
    """
    Creates a drop log using site multipliers.
    Admin still sends sweeps/SC/crypto manually on partner site.
    """
    await require_admin(payload.admin_id)

    drop = await create_drop_log(
        telegram_id=payload.telegram_id,
        site=payload.site,
        base_sc=payload.base_sc,
        drop_reason=payload.reason,
        admin_id=payload.admin_id,
    )

    logger.info(
        f"[SC] Drop logged: tg={payload.telegram_id} site={payload.site} "
        f"{payload.base_sc} -> {drop['final_sc']} ({payload.reason})"
    )

    return {"success": True, "drop": drop}


# ============================================================
#  RAFFLE
# ============================================================

class RaffleEntryRequest(BaseModel):
    telegram_id: int


@router.post("/raffle/enter")
async def sc_raffle_enter(payload: RaffleEntryRequest):
    """
    SC-powered raffle entry:
      - spends 1 SC (internal balance)
      - logs raffle entry
    """
    result = await enter_raffle(payload.telegram_id)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["reason"])

    return result