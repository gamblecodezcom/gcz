from __future__ import annotations

import asyncio
import random

from ai.ai_logger import get_logger
from ai.health_engine import run_health_scan

logger = get_logger("gcz-ai.monitor")


class HealthMonitor:
    def __init__(self, interval: int = 60) -> None:
        self._interval = interval
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()

    async def start(self) -> None:
        if self._task and not self._task.done():
            logger.info("Health monitor already running")
            return
        self._stop.clear()
        self._task = asyncio.create_task(self._run(), name="gcz-ai-monitor")
        logger.info("Health monitor started")

    async def stop(self) -> None:
        if not self._task:
            return
        self._stop.set()
        await asyncio.sleep(0)
        await self._task
        logger.info("Health monitor stopped")

    async def _run(self) -> None:
        jitter = random.uniform(0, 3)
        await asyncio.sleep(jitter)

        backoff = self._interval
        cycle = 0

        while not self._stop.is_set():
            cycle += 1
            try:
                await run_health_scan()
                backoff = self._interval
            except Exception as exc:
                logger.error("Monitor scan error", extra={"error": str(exc)})
                backoff = min(backoff * 2, 300)

            if cycle % 10 == 0:
                logger.info("Monitor heartbeat", extra={"cycle": cycle, "interval": backoff})

            try:
                await asyncio.wait_for(self._stop.wait(), timeout=backoff)
            except asyncio.TimeoutError:
                continue


__all__ = ["HealthMonitor"]
