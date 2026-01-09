#!/usr/bin/env python3
"""
GCZ Production Watchdog
Safe, conservative, non-AI watchdog.
Monitors critical services and restarts via PM2 if needed.
"""

import json
import logging
import subprocess
import time

# ============================================================
# CONFIG
# ============================================================

CHECK_INTERVAL = 60  # seconds

# ============================================================
# LOGGER
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [watchdog] %(message)s",
)
log = logging.getLogger("gcz-watchdog")

# ============================================================
# HELPERS
# ============================================================

def pm2_list() -> list[dict]:
    try:
        raw = subprocess.check_output(["pm2", "jlist"])
        return json.loads(raw.decode())
    except Exception:
        return []


def pm2_restart(name: str):
    log.warning(f"Restarting PM2 service: {name}")
    subprocess.run(["pm2", "restart", name], check=False)


def monitored_services() -> list[dict]:
    services = []
    for proc in pm2_list():
        name = proc.get("name", "")
        if not name.startswith("gcz-"):
            continue
        if name.startswith("gcz-sandbox-"):
            continue
        services.append(proc)
    return services

# ============================================================
# MAIN LOOP
# ============================================================

def run():
    log.info("Production watchdog started")

    while True:
        for proc in monitored_services():
            name = proc.get("name", "unknown")
            status = proc.get("pm2_env", {}).get("status")
            if status != "online":
                log.error(f"Service offline: {name}")
                pm2_restart(name)

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    run()
