import asyncpg
import asyncio
from config import get_settings

settings = get_settings()

# Global connection pool
_pool = None
_pool_lock = asyncio.Lock()


async def init_pool():
    """
    Initializes the global asyncpg pool once.
    Safe for concurrent calls.
    """
    global _pool

    if _pool is None:
        async with _pool_lock:
            if _pool is None:
                _pool = await asyncpg.create_pool(
                    dsn=settings.DATABASE_URL,
                    min_size=1,
                    max_size=10,
                    command_timeout=30,
                )
    return _pool


async def get_db():
    """
    Returns a pooled database connection.
    Usage:
        db = await get_db()
        row = await db.fetchrow(...)
    """
    pool = await init_pool()
    return pool