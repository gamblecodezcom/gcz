from __future__ import annotations

import asyncio
import json
import os
import random
import time
from pathlib import Path
from typing import Any, Iterable, Optional, List

import asyncpg

from ai.ai_logger import get_logger
from ai.config.loader import build_settings

logger = get_logger("gcz-ai.db")


# ======================================================
# PARAM HELPERS
# ======================================================
def _normalize_param(value: Any) -> Any:
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return value


def _normalize_params(params: Optional[Iterable[Any]]) -> List[Any]:
    if not params:
        return []
    return [_normalize_param(v) for v in params]


# ======================================================
# DATABASE LAYER
# ======================================================
class Database:
    """
    Hardened async DB client with:
    - pool auto-recovery
    - Neon retry logic
    - structured telemetry hooks
    - health backoff
    """

    def __init__(
        self,
        dsn: Optional[str],
        min_size: int = 1,
        max_size: int = 5,
    ) -> None:
        self._dsn = dsn
        self._pool: Optional[asyncpg.Pool] = None
        self._lock = asyncio.Lock()
        self._min_size = min_size
        self._max_size = max_size
        self._cooldown_until: float = 0.0
        self._last_error: Optional[str] = None
        self._last_ok_ts: float = 0.0

    # --------------------------------------------------
    @property
    def enabled(self) -> bool:
        return bool(self._dsn)

    # --------------------------------------------------
    async def init(self, retries: int = 5, base_delay: float = 0.5) -> bool:
        if not self.enabled:
            logger.error("Database disabled — missing connection string")
            return False

        async with self._lock:
            if self._pool:
                return True

            now = time.time()
            if now < self._cooldown_until:
                return False

            for attempt in range(1, retries + 1):
                try:
                    logger.info("Opening DB pool", extra={"attempt": attempt})

                    self._pool = await asyncpg.create_pool(
                        dsn=self._dsn,
                        min_size=self._min_size,
                        max_size=self._max_size,
                        command_timeout=12,
                    )

                    self._last_ok_ts = time.time()
                    self._last_error = None
                    logger.info("DB pool ready")
                    return True

                except Exception as exc:
                    self._last_error = str(exc)
                    logger.error(
                        "DB init failed",
                        extra={"attempt": attempt, "error": str(exc)},
                    )

                    await asyncio.sleep(
                        base_delay * (2 ** (attempt - 1))
                        + random.uniform(0, 0.25)
                    )

            self._cooldown_until = time.time() + 10
            return False

    # --------------------------------------------------
    async def close(self) -> None:
        if self._pool:
            await self._pool.close()
            self._pool = None
            logger.info("DB pool closed")

    # --------------------------------------------------
    async def _ensure_pool(self) -> bool:
        if not self._pool:
            return await self.init()
        return True

    # --------------------------------------------------
    async def fetchrow(self, query: str, params=None) -> Optional[dict]:
        if not await self._ensure_pool():
            return None

        values = _normalize_params(params)

        try:
            async with self._pool.acquire() as conn:
                row = await conn.fetchrow(query, *values)
                self._last_ok_ts = time.time()
                return dict(row) if row else None

        except (asyncpg.InterfaceError, asyncpg.PostgresConnectionError) as exc:
            logger.warning("DB connection dropped", extra={"error": str(exc)})
            await self.close()
            await self.init()
            return await self.fetchrow(query, params)

        except Exception as exc:
            logger.error("DB query failed", extra={"error": str(exc)})
            return None

    # --------------------------------------------------
    async def fetch(self, query: str, params=None) -> list[dict]:
        if not await self._ensure_pool():
            return []

        values = _normalize_params(params)

        try:
            async with self._pool.acquire() as conn:
                rows = await conn.fetch(query, *values)
                self._last_ok_ts = time.time()
                return [dict(r) for r in rows]

        except (asyncpg.InterfaceError, asyncpg.PostgresConnectionError) as exc:
            logger.warning("DB connection dropped", extra={"error": str(exc)})
            await self.close()
            await self.init()
            return await self.fetch(query, params)

        except Exception as exc:
            logger.error("DB fetch failed", extra={"error": str(exc)})
            return []

    # --------------------------------------------------
    async def execute(self, query: str, params=None) -> bool:
        if not await self._ensure_pool():
            return False

        values = _normalize_params(params)

        try:
            async with self._pool.acquire() as conn:
                await conn.execute(query, *values)
                self._last_ok_ts = time.time()
                return True

        except (asyncpg.InterfaceError, asyncpg.PostgresConnectionError) as exc:
            logger.warning("DB connection dropped", extra={"error": str(exc)})
            await self.close()
            await self.init()
            return await self.execute(query, params)

        except Exception as exc:
            logger.error("DB execute failed", extra={"error": str(exc)})
            return False

    # --------------------------------------------------
    async def health_check(self) -> dict:
        row = await self.fetchrow("SELECT 1 AS ok;")
        return {
            "ok": bool(row and row.get("ok") == 1),
            "last_ok": self._last_ok_ts,
            "last_error": self._last_error,
        }


# ======================================================
# FACTORY
# ======================================================
def get_database() -> Database:
    root = Path(__file__).resolve().parents[1]
    settings = build_settings(root)
    return Database(settings.database_url)


DB = get_database()

__all__ = ["DB", "Database"]
