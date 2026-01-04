from fastapi import APIRouter, HTTPException, Query
from services.db import get_db
from logger import get_logger
import random

router = APIRouter(prefix="/api/affiliates", tags=["Affiliates"])
logger = get_logger("gcz-affiliates")


# ============================================================
#  GET ALL AFFILIATES
# ============================================================

@router.get("/")
async def list_affiliates():
    """
    Returns full affiliate metadata from affiliates_master.
    This table is synced from /var/www/html/gcz/master_affiliates.csv.
    """
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT
                id,
                name,
                affiliate_url,
                priority,
                category,
                status,
                level,
                date_added,
                bonus_code,
                bonus_description,
                icon_url,
                resolved_domain,
                redemption_speed,
                redemption_minimum,
                redemption_type,
                created_by,
                source,
                top_pick,
                jurisdiction,
                sc_allowed,
                crypto_allowed,
                cwallet_allowed,
                lootbox_allowed,
                show_in_profile,
                sort_order,
                slug,
                description
            FROM affiliates_master
            ORDER BY priority DESC, name ASC
            """
        )

        return [dict(r) for r in rows]

    except Exception as e:
        logger.error(f"[AFFILIATES] Failed to load affiliates: {e}")
        raise HTTPException(status_code=500, detail="Failed to load affiliates")


# ============================================================
#  GET SINGLE AFFILIATE BY SLUG
# ============================================================

@router.get("/{slug}")
async def get_affiliate(slug: str):
    db = await get_db()

    try:
        row = await db.fetchrow(
            """
            SELECT *
            FROM affiliates_master
            WHERE slug = $1
            LIMIT 1
            """,
            slug.lower(),
        )

        if not row:
            raise HTTPException(status_code=404, detail="Affiliate not found")

        return dict(row)

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"[AFFILIATES] Failed to load slug {slug}: {e}")
        raise HTTPException(status_code=500, detail="Failed to load affiliate")


# ============================================================
#  SEARCH AFFILIATES
# ============================================================

@router.get("/search/query")
async def search_affiliates(q: str = Query(..., min_length=2)):
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT *
            FROM affiliates_master
            WHERE
                LOWER(name) LIKE LOWER('%' || $1 || '%')
                OR LOWER(category) LIKE LOWER('%' || $1 || '%')
                OR LOWER(description) LIKE LOWER('%' || $1 || '%')
                OR LOWER(slug) LIKE LOWER('%' || $1 || '%')
                OR LOWER(resolved_domain) LIKE LOWER('%' || $1 || '%')
            ORDER BY priority DESC
            """,
            q,
        )

        return [dict(r) for r in rows]

    except Exception as e:
        logger.error(f"[AFFILIATES] Search failed for query '{q}': {e}")
        raise HTTPException(status_code=500, detail="Search failed")


# ============================================================
#  TOP PICKS
# ============================================================

@router.get("/top-picks/list")
async def top_picks():
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT *
            FROM affiliates_master
            WHERE top_pick = TRUE
            ORDER BY priority DESC, name ASC
            """
        )
        return [dict(r) for r in rows]

    except Exception as e:
        logger.error(f"[AFFILIATES] Failed to load top picks: {e}")
        raise HTTPException(status_code=500, detail="Failed to load top picks")


# ============================================================
#  CATEGORY FILTER
# ============================================================

@router.get("/category/{category}")
async def affiliates_by_category(category: str):
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT *
            FROM affiliates_master
            WHERE LOWER(category) = LOWER($1)
            ORDER BY priority DESC, name ASC
            """,
            category,
        )

        return [dict(r) for r in rows]

    except Exception as e:
        logger.error(f"[AFFILIATES] Category filter failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to load category")


# ============================================================
#  LEVEL FILTER
# ============================================================

@router.get("/levels/{level}")
async def affiliates_by_level(level: int):
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT *
            FROM affiliates_master
            WHERE level = $1
            ORDER BY priority DESC, name ASC
            """,
            level,
        )

        return [dict(r) for r in rows]

    except Exception as e:
        logger.error(f"[AFFILIATES] Level filter failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to load level")


# ============================================================
#  RANDOM AFFILIATE
# ============================================================

@router.get("/random/one")
async def random_affiliate():
    db = await get_db()

    try:
        rows = await db.fetch(
            """
            SELECT *
            FROM affiliates_master
            WHERE status = 'active'
            """
        )
        if not rows:
            raise HTTPException(status_code=404, detail="No affiliates found")

        return dict(random.choice(rows))

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"[AFFILIATES] Random pick failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to pick random affiliate")