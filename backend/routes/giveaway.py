from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import uuid

from services.db import get_db
from services.auth import require_admin
from logger import get_logger

router = APIRouter(prefix="/api/giveaway", tags=["Giveaways"])
logger = get_logger("gcz-giveaway")


class StartGiveaway(BaseModel):
    site: str
    winners: int
    prize_value: float
    duration_minutes: int
    started_by_telegram_id: int


class JoinGiveaway(BaseModel):
    telegram_id: int
    username: str
    site: str


class LogGiveaway(BaseModel):
    giveaway_id: str
    telegram_id: int
    username: str
    site: str
    status: str  # "entered", "won", "delivered"


ALLOWED_SITES = ["runewager", "winna", "cwallet"]


def validate_site(site: str):
    if site.lower() not in ALLOWED_SITES:
        raise HTTPException(status_code=400, detail="Unsupported site for giveaways")


@router.post("/start")
async def start_giveaway(payload: StartGiveaway):
    require_admin(payload.started_by_telegram_id)
    validate_site(payload.site)

    db = await get_db()
    giveaway_id = str(uuid.uuid4())
    end_time = datetime.utcnow() + timedelta(minutes=payload.duration_minutes)

    await db.execute(
        """
        INSERT INTO giveaways (id, site, winners, prize_value, end_time, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        """,
        giveaway_id,
        payload.site,
        payload.winners,
        payload.prize_value,
        end_time,
    )

    await db.close()
    logger.info(f"Started giveaway {giveaway_id} on {payload.site}")

    return {"success": True, "giveaway_id": giveaway_id, "message": "Giveaway started"}


@router.post("/join")
async def join_giveaway(payload: JoinGiveaway):
    validate_site(payload.site)
    db = await get_db()

    active = await db.fetchrow(
        """
        SELECT id FROM giveaways
        WHERE status='active' AND site=$1
        ORDER BY end_time DESC LIMIT 1
        """,
        payload.site,
    )

    if not active:
        await db.close()
        raise HTTPException(status_code=400, detail="No active giveaway")

    await db.execute(
        """
        INSERT INTO giveaway_entries (giveaway_id, telegram_id, username, site)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
        """,
        active["id"],
        payload.telegram_id,
        payload.username,
        payload.site,
    )

    await db.close()
    logger.info(f"User {payload.telegram_id} joined giveaway {active['id']} on {payload.site}")

    return {"success": True, "message": "Entry recorded"}


@router.post("/pick-winners")
async def pick_winners(admin_id: int):
    require_admin(admin_id)
    db = await get_db()

    giveaway = await db.fetchrow(
        """
        SELECT * FROM giveaways
        WHERE status='active'
        ORDER BY end_time ASC LIMIT 1
        """
    )

    if not giveaway:
        await db.close()
        raise HTTPException(status_code=400, detail="No active giveaway")

    entries = await db.fetch(
        """
        SELECT * FROM giveaway_entries
        WHERE giveaway_id=$1
        """,
        giveaway["id"],
    )

    if not entries:
        await db.execute("UPDATE giveaways SET status='ended' WHERE id=$1", giveaway["id"])
        await db.close()
        logger.info(f"Ended giveaway {giveaway['id']} with no entries")
        return {"success": True, "winners": [], "message": "No entries"}

    import random

    winners = random.sample(entries, min(giveaway["winners"], len(entries)))

    for w in winners:
        await db.execute(
            """
            INSERT INTO giveaway_winners (giveaway_id, telegram_id, username, site)
            VALUES ($1, $2, $3, $4)
            """,
            giveaway["id"],
            w["telegram_id"],
            w["username"],
            w["site"],
        )

    await db.execute("UPDATE giveaways SET status='ended' WHERE id=$1", giveaway["id"])
    await db.close()

    logger.info(f"Picked {len(winners)} winners for giveaway {giveaway['id']}")

    return {
        "success": True,
        "winners": [
            {"telegram_id": w["telegram_id"], "username": w["username"], "site": w["site"]}
            for w in winners
        ],
    }


@router.post("/log")
async def log_delivery(payload: LogGiveaway):
    db = await get_db()

    await db.execute(
        """
        INSERT INTO giveaway_logs (giveaway_id, telegram_id, username, site, status)
        VALUES ($1, $2, $3, $4, $5)
        """,
        payload.giveaway_id,
        payload.telegram_id,
        payload.username,
        payload.site,
        payload.status,
    )

    await db.close()
    logger.info(
        f"Logged giveaway delivery: {payload.giveaway_id} -> {payload.telegram_id} ({payload.status})"
    )
    return {"success": True}


@router.get("/raffle-status")
async def raffle_status():
    db = await get_db()

    raffleEntriesResult = await db.fetchrow("SELECT COUNT(*) FROM raffle_entries")
    raffleEntriesTodayResult = await db.fetchrow(
        """
        SELECT COUNT(*) FROM raffle_entries
        WHERE DATE(created_at) = CURRENT_DATE
        """
    )
    wheelSpinsRemaining = 1
    giveawaysReceived = await db.fetchval("SELECT COUNT(*) FROM giveaway_winners")
    linkedCasinos = await db.fetchval("SELECT COUNT(*) FROM casinos WHERE enabled=true")

    await db.close()

    return {
        "raffleEntries": int(raffleEntriesResult["count"]),
        "raffleEntriesToday": int(raffleEntriesTodayResult["count"]),
        "wheelSpinsRemaining": wheelSpinsRemaining,
        "giveawaysReceived": giveawaysReceived,
        "linkedCasinos": linkedCasinos,
    }