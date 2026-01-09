from __future__ import annotations

import asyncio
import os
from typing import Any, Dict, Optional

from ai.ai_logger import get_logger
from ai.health_engine import run_health_scan
from ai.memory_monitor import HealthMonitor
from ai.memory_store import log_anomaly
from ai.db import DB

logger = get_logger("gcz-ai.bridge")

# ============================================================
# GLOBALS
# ============================================================

_MONITOR: Optional[HealthMonitor] = None
_DB_READY = False

GCZ_ENV = os.getenv("GCZ_ENV", "unknown")
AI_DISABLED = os.getenv("GCZ_AI_DISABLED") == "1"

# ============================================================
# EVENT LOOP SAFETY
# ============================================================

def _run(coro):
    """
    Safely execute an async coroutine from sync or async context.
    Never raises to caller.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        try:
            return asyncio.run(coro)
        except Exception as e:
            logger.error("asyncio.run failed", extra={"error": str(e)})
            return None
    else:
        try:
            return loop.create_task(coro)
        except Exception as e:
            logger.error("create_task failed", extra={"error": str(e)})
            return None

# ============================================================
# DB GUARD
# ============================================================

async def _ensure_db():
    global _DB_READY
    if _DB_READY:
        return
    try:
        await DB.init()
        _DB_READY = True
    except Exception as e:
        logger.error("DB init failed", extra={"error": str(e)})

# ============================================================
# HEALTH
# ============================================================

async def health_scan_async() -> Dict[str, Any]:
    if AI_DISABLED:
        return {"ai": {"ok": False, "reason": "disabled"}}
    try:
        return await run_health_scan()
    except Exception as e:
        logger.error("health_scan_async failed", extra={"error": str(e)})
        return {"ai": {"ok": False, "error": str(e)}}


def health_scan() -> Dict[str, Any]:
    result = _run(health_scan_async())
    return result if isinstance(result, dict) else {"ai": {"ok": False}}

# ============================================================
# BACKGROUND MONITOR
# ============================================================

async def start_background_monitor_async(interval: int = 60) -> Optional[HealthMonitor]:
    global _MONITOR
    if AI_DISABLED:
        logger.warning("AI background monitor disabled")
        return None
    if _MONITOR:
        return _MONITOR
    try:
        monitor = HealthMonitor(interval=interval)
        await monitor.start()
        _MONITOR = monitor
        logger.info("Background health monitor started", extra={"interval": interval})
        return monitor
    except Exception as e:
        logger.error("Failed to start background monitor", extra={"error": str(e)})
        return None


def start_background_monitor(interval: int = 60) -> Optional[HealthMonitor]:
    return _run(start_background_monitor_async(interval))

# ============================================================
# DB EXECUTION
# ============================================================

async def execute_async(query: str, params: list[Any] | None = None) -> bool:
    if AI_DISABLED:
        return False
    try:
        await _ensure_db()
        await DB.execute(query, params)
        return True
    except Exception as e:
        logger.error(
            "DB execute failed",
            extra={"query": query[:80], "error": str(e)},
        )
        return False


def execute(query: str, params: list[Any] | None = None) -> bool:
    result = _run(execute_async(query, params))
    return bool(result)

# ============================================================
# DB FETCH
# ============================================================

async def fetch_async(query: str, params: list[Any] | None = None) -> list[dict]:
    if AI_DISABLED:
        return []
    try:
        await _ensure_db()
        return await DB.fetch(query, params)
    except Exception as e:
        logger.error(
            "DB fetch failed",
            extra={"query": query[:80], "error": str(e)},
        )
        return []


def fetch(query: str, params: list[Any] | None = None) -> list[dict]:
    result = _run(fetch_async(query, params))
    return result if isinstance(result, list) else []

# ============================================================
# ANOMALY LOGGING
# ============================================================

async def anomaly_async(kind: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
    if AI_DISABLED:
        return False
    try:
        await _ensure_db()
        await log_anomaly(kind, message, meta or {})
        return True
    except Exception as e:
        logger.error("anomaly_async failed", extra={"error": str(e)})
        return False


def anomaly(kind: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
    result = _run(anomaly_async(kind, message, meta))
    return bool(result)

# ============================================================
# EXPORTS
# ============================================================

__all__ = [
    "health_scan",
    "health_scan_async",
    "start_background_monitor",
    "start_background_monitor_async",
    "execute",
    "execute_async",
    "fetch",
    "fetch_async",
    "anomaly",
    "anomaly_async",
]
