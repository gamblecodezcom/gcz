from __future__ import annotations

import asyncio
from typing import Any, Dict

from ai.ai_logger import get_logger
from ai.health_engine import run_health_scan
from ai.memory_monitor import HealthMonitor
from ai.db import DB

logger = get_logger("gcz-ai.core")


def _run(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    return loop.create_task(coro)


async def health_scan_async() -> Dict[str, Any]:
    return await run_health_scan()


async def start_background_monitor_async(interval: int = 60) -> HealthMonitor:
    monitor = HealthMonitor(interval=interval)
    await monitor.start()
    return monitor


def health_scan() -> Dict[str, Any]:
    return _run(health_scan_async())


def start_background_monitor(interval: int = 60) -> HealthMonitor:
    return _run(start_background_monitor_async(interval))


async def execute_async(query: str, params: list[Any] | None = None) -> bool:
    return await DB.execute(query, params)


__all__ = [
    "health_scan",
    "health_scan_async",
    "start_background_monitor",
    "start_background_monitor_async",
    "execute_async",
    "get_logger",
]
