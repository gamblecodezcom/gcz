#!/usr/bin/env python3
"""
GCZ AI CORE — Production AI workflow supervisor.
"""

from __future__ import annotations

import argparse
import asyncio
import subprocess
from pathlib import Path
from typing import Dict

from ai.ai_logger import get_logger
from ai.config.loader import build_settings
from ai.db import DB
from ai.health_engine import run_health_scan
from ai.memory_monitor import HealthMonitor

logger = get_logger("gcz-ai.core")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--control")
    parser.add_argument("--logs")
    return parser.parse_args()


def load_control(control_path: Path) -> str:
    if control_path.exists():
        try:
            return control_path.read_text().strip()
        except Exception as exc:
            logger.error("Failed to read control file", extra={"error": str(exc)})
    return ""


PM2_SERVICES = [
    "gcz-api",
    "gcz-redirect",
    "gcz-drops",
    "gcz-bot",
    "gcz-discord",
    "gcz-watchdog",
]


def pm2_exists(name: str) -> bool:
    return subprocess.run(
        ["pm2", "describe", name],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    ).returncode == 0


def pm2_restart(name: str) -> None:
    logger.warning("Restarting PM2 service", extra={"service": name})
    subprocess.run(["pm2", "restart", name], check=False)


def pm2_save() -> None:
    subprocess.run(["pm2", "save"], check=False)


async def record_health(status: str, details: Dict) -> None:
    await DB.execute(
        """
        INSERT INTO service_health (service, status, details)
        VALUES ($1, $2, $3::jsonb)
        """,
        ("ai-core", status, details),
    )


async def run_cycle(root: Path, control_path: Path) -> None:
    control = load_control(control_path)
    if control:
        logger.info("Control file loaded", extra={"preview": control[:80]})

    for svc in PM2_SERVICES:
        if not pm2_exists(svc):
            logger.error("Missing PM2 service", extra={"service": svc})
            pm2_restart(svc)

    pm2_save()

    health = await run_health_scan()
    db_ok = health.get("db", {}).get("ok", False)

    if db_ok:
        logger.info("AI Core health OK")
        await record_health("ok", health)
    else:
        logger.error("AI Core health degraded")
        await record_health("error", health)

    logger.info("AI Core cycle complete")


async def main() -> None:
    args = parse_args()
    root = Path(args.root).resolve()
    build_settings(root)

    control_path = Path(args.control) if args.control else root / "AIAGENT_MASTERCONTROL.txt"

    await DB.init()
    monitor = HealthMonitor()
    await monitor.start()

    try:
        await run_cycle(root, control_path)
    finally:
        await monitor.stop()
        await DB.close()


if __name__ == "__main__":
    asyncio.run(main())
