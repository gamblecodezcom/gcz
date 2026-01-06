from fastapi import APIRouter, HTTPException
from services.db import get_db
from backend.logger import get_logger

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = get_logger("gcz-dashboard")


@router.get("/stats")
async def stats():
    """
    Ultra‑optimized GCZ dashboard stats.
    Uses a single DB round‑trip and never closes the pool.
    """
    db = await get_db()

    try:
        rows = await db.fetchrow(
            """
            SELECT
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM linked_casinos) AS linked_casinos,
                (SELECT COUNT(*) FROM giveaway_winners) AS giveaways_won,
                (SELECT COUNT(*) FROM raffle_entries) AS raffle_entries
            """
        )

        return {
            "totalUsers": rows["total_users"],
            "linkedCasinos": rows["linked_casinos"],
            "giveawaysWon": rows["giveaways_won"],
            "raffleEntries": rows["raffle_entries"],
        }

    except Exception as e:
        logger.error(f"[DASHBOARD] Failed to load stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard stats")