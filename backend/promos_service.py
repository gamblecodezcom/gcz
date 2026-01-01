from database import get_db
from models import PromoCode, PromoLink

async def get_promo_codes():
    try:
        db = await get_db()
        rows = await db.fetch("SELECT * FROM promo_codes ORDER BY created_at DESC")
        await db.close()
        return [dict(row) for row in rows]
    except Exception:
        # fallback mock
        return [{
            "id": "mock1",
            "site": "Stake.us",
            "code": "GCZ50",
            "description": "50 Free Sweeps Coins",
            "createdAt": "2026-01-01T00:00:00Z",
            "verified": True
        }]

async def get_promo_links():
    try:
        db = await get_db()
        rows = await db.fetch("SELECT * FROM promo_links ORDER BY created_at DESC")
        await db.close()
        return [dict(row) for row in rows]
    except Exception:
        return [{
            "id": "mock1",
            "site": "Rollbit",
            "url": "https://rollbit.com/ref/gcz",
            "description": "10% Lootbox Boost",
            "createdAt": "2026-01-01T00:00:00Z",
            "verified": True
        }]