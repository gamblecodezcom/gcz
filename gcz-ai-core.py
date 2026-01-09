#!/usr/bin/env python3
"""
GCZ AI CORE — GOD MODE
Resident AI supervisor.
Controls PM2, DB health, monitors, escalation, and recovery.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import subprocess
import time
from pathlib import Path
from typing import Dict

from ai.ai_logger import get_logger
from ai.config.loader import build_settings
from ai.db import DB
from ai.health_engine import run_health_scan
from ai.memory_monitor import HealthMonitor

logger = get_logger("gcz-ai.core")

# ============================================================
# CONFIG
# ============================================================

CYCLE_INTERVAL = 60
MAX_CONSECUTIVE_FAILS = 3

PM2_SERVICES = [
    "gcz-api",
    "gcz-redirect",
    "gcz-drops",
    "gcz-bot",
    "gcz-discord",
    "gcz-watchdog",
    "gcz-ai",
]

FAIL_CATEGORY = "ai_core"

# ============================================================
# ARGUMENTS
# ============================================================

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True)
    p.add_argument("--control")
    return p.parse_args()

# ============================================================
# CONTROL FILE
# ============================================================

def load_control(path: Path) -> str:
    if not path.exists():
        return ""
    try:
        return path.read_text().strip()
    except Exception as e:
        logger.error("Failed reading control file", extra={"error": str(e)})
        return ""

# ============================================================
# PM2 HELPERS
# ============================================================

def pm2_exists(name: str) -> bool:
    return subprocess.run(
        ["pm2", "describe", name],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    ).returncode == 0


def pm2_restart(name: str):
    logger.warning("Restarting PM2 service", extra={"service": name})
    subprocess.run(["pm2", "restart", name], check=False)


def pm2_restart_all():
    logger.critical("Restarting FULL PM2 stack")
    subprocess.run(["pm2", "restart", "all"], check=False)


def pm2_save():
    subprocess.run(["pm2", "save"], check=False)

# ============================================================
# FAIL MEMORY (DB)
# ============================================================

async def get_fail_count() -> int:
    rows = await DB.fetch(
        """
        SELECT meta->>'fails' AS fails
        FROM ai_memory
        WHERE category=$1
        ORDER BY created_at DESC
        LIMIT 1
        """,
        FAIL_CATEGORY,
    )
    if rows and rows[0].get("fails"):
        return int(rows[0]["fails"])
    return 0


async def set_fail_count(n: int):
    await DB.execute(
        """
        INSERT INTO ai_memory (category, message, source, meta)
        VALUES ($1, 'update', 'ai-core', $2::jsonb)
        """,
        FAIL_CATEGORY,
        {"fails": n},
    )

# ============================================================
# CORE CYCLE
# ============================================================

async def run_cycle(root: Path, control_path: Path):
    control = load_control(control_path)
    if control:
        logger.info("Control file loaded", extra={"preview": control[:120]})

    # Ensure PM2 services exist
    for svc in PM2_SERVICES:
        if not pm2_exists(svc):
            logger.error("PM2 service missing", extra={"service": svc})
            pm2_restart(svc)

    pm2_save()

    health = await run_health_scan()
    db_ok = health.get("db", {}).get("ok", False)

    fails = await get_fail_count()

    if db_ok:
        logger.info("AI Core health OK")
        await set_fail_count(0)
    else:
        fails += 1
        await set_fail_count(fails)
        logger.error("AI Core health degraded", extra={"fails": fails})

        if fails >= MAX_CONSECUTIVE_FAILS:
            pm2_restart_all()
            await set_fail_count(0)

# ============================================================
# MAIN LOOP
# ============================================================

async def main():
    args = parse_args()
    root = Path(args.root).resolve()
    settings = build_settings(root)

    control_path = (
        Path(args.control)
        if args.control
        else root / "AIAGENT_MASTERCONTROL.txt"
    )

    await DB.init()

    monitor = HealthMonitor()
    await monitor.start()

    logger.info("AI Core GOD MODE started", extra={"env": settings.environment})

    try:
        while True:
            try:
                await run_cycle(root, control_path)
            except Exception as e:
                logger.exception("Unhandled AI Core error", extra={"error": str(e)})
            await asyncio.sleep(CYCLE_INTERVAL)
    finally:
        await monitor.stop()
        await DB.close()

# ============================================================
# ENTRYPOINT
# ============================================================

if __name__ == "__main__":
    asyncio.run(main())
