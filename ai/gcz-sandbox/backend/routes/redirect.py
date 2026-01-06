from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from services.db import get_db
from backend.logger import get_logger
from datetime import datetime

router = APIRouter(tags=["Redirect"])
logger = get_logger("gcz-redirect")


@router.get("/go/{slug}")
async def redirect_slug(slug: str):
    db = await get_db()

    try:
        row = await db.fetchrow(
            """
            SELECT id, name, affiliate_url
            FROM affiliates_master
            WHERE slug = $1
            LIMIT 1
            """,
            slug.lower(),
        )

        if not row:
            raise HTTPException(status_code=404, detail="Affiliate not found")

        # Log click
        await db.execute(
            """
            INSERT INTO affiliate_clicks (affiliate_id, slug, clicked_at)
            VALUES ($1, $2, $3)
            """,
            row["id"],
            slug.lower(),
            datetime.utcnow(),
        )

        logger.info(f"[REDIRECT] {slug} → {row['affiliate_url']}")

        return RedirectResponse(url=row["affiliate_url"])

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"[REDIRECT] Failed redirect for slug {slug}: {e}")
        raise HTTPException(status_code=500, detail="Redirect failed")