# health.py
from fastapi import APIRouter
import asyncpg

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("/")
async def health():
    try:
        conn = await asyncpg.connect(
            "postgresql://neondb_owner:npg_C7kPSNtVgmD4@ep-calm-base-a4zc750u-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
        )
        await conn.close()
        return {"status": "ok"}
    except:
        return {"status": "db_error"}