import asyncpg
import asyncio
import os

NEON_URL = os.getenv("GCZ_DB")

_pool = None
_pool_lock = asyncio.Lock()


async def init_pool():
    """
    Initialize the global asyncpg pool once.
    Thread-safe. Prevents Neon connection exhaustion.
    """
    global _pool

    if _pool is None:
        async with _pool_lock:
            if _pool is None:
                _pool = await asyncpg.create_pool(
                    dsn=NEON_URL,
                    min_size=1,
                    max_size=10,
                    command_timeout=30,
                )
    return _pool


async def get_db():
    """
    Returns the global connection pool.
    Usage:
        db = await get_db()
        row = await db.fetchrow("SELECT ...")
    """
    pool = await init_pool()
    return pool