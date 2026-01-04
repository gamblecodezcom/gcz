#!/usr/bin/env python3
"""
GCZ AI CORE — Modernized Version
Replaces the old JSON-based AI core with a DB-backed,
AI-integrated, production-grade GCZ engine controller.

This script is invoked by gcz_ai_cli.py.
"""

import os
import subprocess
import argparse
import time
from pathlib import Path

from gcz_ai import (
    execute,
    health_scan,
    start_background_monitor,
)
from ai_logger import get_logger

logger = get_logger("gcz-ai.core")


# ============================================================
# ARGUMENTS
# ============================================================

parser = argparse.ArgumentParser()
parser.add_argument("--root", required=True)
parser.add_argument("--db", required=True)
parser.add_argument("--memory")
parser.add_argument("--control")
parser.add_argument("--logs")
args = parser.parse_args()

ROOT = Path(args.root)
CONTROL = Path(args.control) if args.control else None
LOGS = Path(args.logs) if args.logs else ROOT / "logs"
LOGS.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD CONTROL FILE
# ============================================================

def load_control():
    if CONTROL and CONTROL.exists():
        try:
            return CONTROL.read_text().strip()
        except Exception as e:
            logger.error(f"Failed to read control file: {e}")
    return ""


# ============================================================
# PM2 HELPERS
# ============================================================

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
        stderr=subprocess.DEVNULL
    ).returncode == 0


def pm2_restart(name: str):
    logger.warning(f"Restarting PM2 service: {name}")
    subprocess.run(["pm2", "restart", name])


def pm2_save():
    subprocess.run(["pm2", "save"])


# ============================================================
# NODE DEPENDENCY CHECK (NON-BLOCKING)
# ============================================================

def verify_node_deps():
    logger.info("🔧 Verifying Node dependencies (non-blocking)…")
    subprocess.Popen(["npm", "install", "--omit=dev"], cwd=ROOT)


# ============================================================
# HEALTH LOGGING (DB-BACKED)
# ============================================================

def record_health(status: str, details: dict):
    execute(
        """
        INSERT INTO service_health (service, status, details)
        VALUES ('ai-core', %s, %s)
        """,
        [status, details],
    )


# ============================================================
# MAIN CYCLE
# ============================================================

def run_cycle():
    logger.info("🔍 Starting AI Core cycle")

    # Load control file
    control = load_control()
    if control:
        logger.info(f"📜 Control file loaded: {control[:80]}…")

    # Verify PM2 services
    for svc in PM2_SERVICES:
        if not pm2_exists(svc):
            logger.error(f"⚠️ Missing PM2 service: {svc}")
            pm2_restart(svc)

    pm2_save()

    # Run AI health scan
    health = health_scan()
    db_ok = health.get("neon_db", {}).get("ok", False)

    if db_ok:
        logger.info("✅ AI Core health OK")
        record_health("ok", health)
    else:
        logger.error("❌ AI Core health degraded")
        record_health("error", health)

    logger.info("✨ AI Core cycle complete")


# ============================================================
# ENTRYPOINT
# ============================================================

if __name__ == "__main__":
    logger.info("🚀 GCZ AI Core starting…")

    # Start background AI monitor
    start_background_monitor()

    # Verify Node deps (non-blocking)
    verify_node_deps()

    # Run cycle once (this script is invoked manually or via CLI)
    run_cycle()

    logger.info("🏁 GCZ AI Core finished")