import asyncpg
from config import get_settings

settings = get_settings()

async def get_db():
    return await asyncpg.connect(settings.DATABASE_URL)