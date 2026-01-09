from fastapi import APIRouter
from services.db import get_db
from backend.logger import get_logger

router = APIRouter(prefix="/api/health", tags=["Health"])
logger = get_logger("gcz-health")


@router.get("/")
async def health():
    """
    Full GCZ health check:
      - Confirms DB pool is alive
      - Confirms a simple SELECT works
    """
    try:
        db = await get_db()

        # Simple DB check
        row = await db.fetchval("SELECT 1")
        if row != 1:
            logger.error("[HEALTH] DB returned unexpected value")
            return {"status": "db_error"}

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"[HEALTH] DB error: {e}")
        return {"status": "db_error"}