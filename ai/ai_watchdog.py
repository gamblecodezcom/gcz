#!/usr/bin/env python3
"""
GCZ AI Watchdog — Production
Monitors DB + AI + external health, records failures to ai_memory,
restarts PM2 targets only after threshold.
"""

from __future__ import annotations

import json
import os
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List

import requests

# ============================================================
# PATHS + ENV
# ============================================================

ROOT = Path("/var/www/html/gcz")
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

ENV = os.getenv("GCZ_ENV", "production").lower()

STATE_FILE = LOG_DIR / "ai_watchdog_state.json"

CHECK_INTERVAL = int(os.getenv("AI_WATCHDOG_INTERVAL", "60"))
MAX_FAILS = int(os.getenv("AI_WATCHDOG_MAX_FAILS", "3"))

DEFAULT_EXTERNAL = "https://gamble-codez.com/health"
EXTERNAL_HEALTH = [
    url.strip()
    for url in os.getenv("AI_WATCHDOG_EXTERNAL", DEFAULT_EXTERNAL).split(",")
    if url.strip()
]

DEFAULT_TARGETS = [
    "gcz-ai",
    "gcz-api",
    "gcz-redirect",
    "gcz-drops",
    "gcz-bot",
    "gcz-discord",
    "gcz-ai-watchdog",
]
PM2_TARGETS = [
    name.strip()
    for name in os.getenv("AI_WATCHDOG_PM2_TARGETS", ",".join(DEFAULT_TARGETS)).split(",")
    if name.strip()
]

# ============================================================
# LOGGER (SAFE FALLBACK)
# ============================================================

try:
    from ai.ai_logger import get_logger  # type: ignore
except Exception:
    import logging

    def get_logger(name: str):
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
        )
        return logging.getLogger(name)

logger = get_logger("gcz.ai_watchdog")

# ============================================================
# AI BRIDGE
# ============================================================

AI_AVAILABLE = True
try:
    from ai import gcz_ai  # type: ignore
except Exception as exc:
    AI_AVAILABLE = False
    gcz_ai = None
    logger.error("gcz_ai unavailable", extra={"error": str(exc)})

# ============================================================
# STATE
# ============================================================

def _load_state() -> Dict[str, Any]:
    if not STATE_FILE.exists():
        return {"fails": 0}
    try:
        return json.loads(STATE_FILE.read_text())
    except Exception:
        return {"fails": 0}


def _save_state(state: Dict[str, Any]) -> None:
    try:
        STATE_FILE.write_text(json.dumps(state))
    except Exception:
        pass

# ============================================================
# DB + MEMORY
# ============================================================

def _record_memory(category: str, message: str, meta: Dict[str, Any]) -> None:
    if not AI_AVAILABLE or not gcz_ai:
        return
    gcz_ai.execute(
        """
        INSERT INTO ai_memory (category, message, source, meta)
        VALUES ($1, $2, $3, $4::jsonb)
        """,
        [category, message, "ai_watchdog", meta],
    )


def _record_anomaly(kind: str, message: str, meta: Dict[str, Any]) -> None:
    if not AI_AVAILABLE or not gcz_ai:
        return
    gcz_ai.anomaly(kind, message, meta)

# ============================================================
# HEALTH CHECKS
# ============================================================

def _external_health_ok() -> bool:
    for url in EXTERNAL_HEALTH:
        try:
            r = requests.get(url, timeout=5)
            if r.status_code != 200:
                logger.error("External health failed", extra={"url": url, "status": r.status_code})
                return False
        except Exception as exc:
            logger.error("External health exception", extra={"url": url, "error": str(exc)})
            return False
    return True


def _ai_health_ok() -> bool:
    if not AI_AVAILABLE or not gcz_ai:
        return False
    try:
        health = gcz_ai.health_scan()
        if isinstance(health, dict):
            db_ok = bool(health.get("db", {}).get("ok"))
            ai_ok = bool(health.get("ai", {}).get("ok")) if "ai" in health else True
            return db_ok and ai_ok
    except Exception as exc:
        logger.error("health_scan failed", extra={"error": str(exc)})
    return False

# ============================================================
# PM2 HELPERS
# ============================================================

def _pm2_restart_targets() -> None:
    for name in PM2_TARGETS:
        logger.warning("Restarting PM2 service", extra={"service": name})
        subprocess.run(["pm2", "restart", name], check=False)

# ============================================================
# MAIN LOOP
# ============================================================

def run_cycle() -> None:
    state = _load_state()
    fails = int(state.get("fails", 0))

    db_ai_ok = _ai_health_ok()
    external_ok = _external_health_ok()

    healthy = db_ai_ok and external_ok

    if not healthy:
        fails += 1
        meta = {
            "fails": fails,
            "db_ai_ok": db_ai_ok,
            "external_ok": external_ok,
            "env": ENV,
        }
        _record_memory("watchdog.failure", "health_degraded", meta)
        _record_anomaly("watchdog_failure", "AI watchdog health degraded", meta)

        logger.error("Health degraded", extra=meta)

        if fails >= MAX_FAILS:
            logger.critical("Restart threshold reached", extra={"fails": fails})
            _pm2_restart_targets()
            fails = 0
    else:
        if fails:
            _record_memory("watchdog.recovery", "health_recovered", {"env": ENV})
        fails = 0
        logger.info("System healthy")

    _save_state({"fails": fails, "ts": int(time.time())})


def main() -> None:
    if ENV != "production":
        logger.error("AI watchdog started outside production", extra={"env": ENV})
        return

    logger.info("AI watchdog started", extra={"env": ENV})

    while True:
        try:
            run_cycle()
        except Exception as exc:
            logger.error("Unhandled exception", extra={"error": str(exc)})
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
