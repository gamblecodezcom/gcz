#!/usr/bin/env python3
"""
GCZ Unified Watchdog — God Mode
This replaces ALL previous watchdogs (Node + Python).
Fully AI‑integrated, DB‑aware, PM2‑aware, and self‑healing.
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from typing import Any, Dict, List

import requests

# ============================================================
# PATH / IMPORT BOOTSTRAP
# ============================================================

ROOT = "/var/www/html/gcz"
AI_DIR = os.path.join(ROOT, "ai")

for p in (ROOT, AI_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

# -- Safe imports with fallbacks ---------------------------------------------

# logger
try:
    from ai_logger import get_logger  # type: ignore
except Exception:
    import logging

    def get_logger(name: str):
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
        )
        return logging.getLogger(name)

logger = get_logger("gcz.watchdog")

# gcz_ai: execute, health_scan, start_background_monitor, anomaly
GCZ_AI_AVAILABLE = True
try:
    from gcz_ai import (  # type: ignore
        execute,
        health_scan,
        start_background_monitor,
        anomaly,
    )
except Exception as e:
    GCZ_AI_AVAILABLE = False
    logger.error(f"[watchdog] gcz_ai import failed, running in degraded mode: {e}")

    def execute(query: str, params: List[Any] | None = None):
        logger.warning("[watchdog] execute() called but gcz_ai is unavailable")
        return []

    def health_scan() -> Dict[str, Any]:
        logger.warning("[watchdog] health_scan() called but gcz_ai is unavailable")
        return {"neon_db": {"ok": False, "reason": "gcz_ai_unavailable"}}

    def start_background_monitor():
        logger.warning("[watchdog] start_background_monitor() called but gcz_ai is unavailable")

    def anomaly(kind: str, meta: Dict[str, Any] | None = None):
        logger.warning(f"[watchdog] anomaly('{kind}') called but gcz_ai is unavailable: {meta}")


# ============================================================
# CONFIG
# ============================================================

LOG_DIR = Path(f"{ROOT}/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

PM2_SERVICES = [
    "gcz-api",
    "gcz-redirect",
    "gcz-drops",
    "gcz-bot",
    "gcz-discord",
    "gcz-ai",
    # "gcz-mcp",  # REMOVED — no longer a production service
    "gcz-watchdog",
]

EXTERNAL_HEALTH = [
    "https://gamble-codez.com/health",  # FIXED SSL hostname
]

MAX_FAILS = 3
FAIL_CATEGORY = "watchdog"


# ============================================================
# DB‑BACKED FAIL COUNTER (DEGRADES GRACEFULLY)
# ============================================================

def get_fail_count() -> int:
    if not GCZ_AI_AVAILABLE:
        return 0

    try:
        rows = execute(
            """
            SELECT meta->>'fails' AS fails
            FROM ai_memory
            WHERE category=%s
            ORDER BY created_at DESC
            LIMIT 1;
            """,
            [FAIL_CATEGORY],
        )
        if rows and rows[0].get("fails"):
            return int(rows[0]["fails"])
    except Exception as e:
        logger.error(f"[watchdog] get_fail_count() failed: {e}")
    return 0


def set_fail_count(count: int):
    if not GCZ_AI_AVAILABLE:
        return

    try:
        execute(
            """
            INSERT INTO ai_memory (category, message, source, meta)
            VALUES (%s, 'update', 'watchdog', %s)
            """,
            [FAIL_CATEGORY, {"fails": count}],
        )
    except Exception as e:
        logger.error(f"[watchdog] set_fail_count({count}) failed: {e}")


# ============================================================
# PM2 HELPERS
# ============================================================

def pm2_exists(name: str) -> bool:
    try:
        return subprocess.run(
            ["pm2", "describe", name],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        ).returncode == 0
    except Exception as e:
        logger.error(f"[watchdog] pm2_exists({name}) failed: {e}")
        return False


def pm2_restart(name: str):
    logger.warning(f"[watchdog] Restarting PM2 service: {name}")
    try:
        subprocess.run(["pm2", "restart", name], check=False)
    except Exception as e:
        logger.error(f"[watchdog] pm2_restart({name}) failed: {e}")


def pm2_save():
    try:
        subprocess.run(["pm2", "save"], check=False)
    except Exception as e:
        logger.error(f"[watchdog] pm2_save() failed: {e}")


# ============================================================
# EXTERNAL HEALTH CHECK
# ============================================================

def external_health_ok() -> bool:
    for url in EXTERNAL_HEALTH:
        try:
            r = requests.get(url, timeout=5)
            if r.status_code != 200:
                logger.error(f"[watchdog] External health failed: {url} -> {r.status_code}")
                return False
        except Exception as e:
            logger.error(f"[watchdog] External health exception for {url}: {e}")
            return False
    return True


# ============================================================
# MAIN WATCHDOG CYCLE
# ============================================================

def run_cycle():
    logger.info("🔍 GCZ Watchdog cycle starting")

    # 1. Ensure PM2 services exist
    for svc in PM2_SERVICES:
        if not pm2_exists(svc):
            logger.error(f"[watchdog] Missing PM2 service (describe failed): {svc}")
            pm2_restart(svc)

    pm2_save()

    # 2. AI engine health scan
    ai = health_scan()
    ai_ok = ai.get("neon_db", {}).get("ok", False)

    # 3. External health
    ext_ok = external_health_ok()

    # 4. Combined health
    healthy = ai_ok and ext_ok

    # 5. Fail counter
    fails = get_fail_count()

    if not healthy:
        fails += 1
        set_fail_count(fails)
        logger.error(f"❌ Health degraded (fail count = {fails}) | ai_ok={ai_ok} ext_ok={ext_ok}")

        anomaly(
            "watchdog_failure",
            {
                "fails": fails,
                "ai": ai,
                "external_ok": ext_ok,
                "gcz_ai_available": GCZ_AI_AVAILABLE,
            },
        )

        if fails >= MAX_FAILS:
            logger.critical("🛠 Restarting full PM2 stack (3 consecutive failures)")
            try:
                subprocess.run(["pm2", "restart", "all"], check=False)
            except Exception as e:
                logger.error(f"[watchdog] pm2 restart all failed: {e}")
            set_fail_count(0)
    else:
        logger.info("✅ System healthy")
        set_fail_count(0)

    logger.info("✨ GCZ Watchdog cycle complete")


# ============================================================
# ENTRYPOINT
# ============================================================

if __name__ == "__main__":
    logger.info("🚀 GCZ Unified Watchdog starting…")

    if GCZ_AI_AVAILABLE:
        try:
            start_background_monitor()
        except Exception as e:
            logger.error(f"[watchdog] start_background_monitor() failed: {e}")
    else:
        logger.warning("[watchdog] Running without background AI monitor (gcz_ai unavailable)")

    while True:
        try:
            run_cycle()
        except Exception as e:
            logger.error(f"[watchdog] Unhandled exception in run_cycle(): {e}")
        time.sleep(60)
