import asyncpg
import os

NEON_URL = os.getenv("GCZ_DB")

async def get_db():
    conn = await asyncpg.connect(NEON_URL)
    return conn