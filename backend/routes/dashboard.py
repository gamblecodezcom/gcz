from fastapi import APIRouter
from services.db import get_db
from logger import get_logger

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = get_logger("gcz-dashboard")


@router.get("/stats")
async def stats():
    db = await get_db()

    users = await db.fetchval("SELECT COUNT(*) FROM users")
    linked = await db.fetchval("SELECT COUNT(*) FROM linked_casinos")
    giveaways = await db.fetchval("SELECT COUNT(*) FROM giveaway_winners")
    raffle = await db.fetchval("SELECT COUNT(*) FROM raffle_entries")

    await db.close()

    return {
        "totalUsers": users,
        "linkedCasinos": linked,
        "giveawaysWon": giveaways,
        "raffleEntries": raffle,
    }