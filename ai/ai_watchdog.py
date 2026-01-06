#!/usr/bin/env python3
import time, os, json, subprocess, logging, traceback

LOG = "/var/log/gcz/watchdog_sandbox.log"
CHECK_INTERVAL = 20
MAX_RESTARTS_PER_MIN = 4
SANDBOX_TAG = "gcz-sandbox"

restart_timestamps = []

logging.basicConfig(
    filename=LOG,
    level=logging.INFO,
    format="%(asctime)s [WATCHDOG] %(message)s"
)


def rate_limit():
    global restart_timestamps
    now = time.time()
    restart_timestamps = [t for t in restart_timestamps if now - t < 60]

    if len(restart_timestamps) >= MAX_RESTARTS_PER_MIN:
        logging.warning("Rate limit hit. Cooling 2m")
        time.sleep(120)
        restart_timestamps = []

    restart_timestamps.append(now)


def pm2_list():
    out = subprocess.check_output(["pm2", "jlist"]).decode()
    return json.loads(out)


def restart_service(name):
    if "watchdog" in name:
        return

    rate_limit()

    logging.warning(f"Restarting {name}")

    subprocess.Popen(
        ["pm2", "restart", name],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )


def check_services():

    for proc in pm2_list():

        name = proc["name"]
        status = proc["pm2_env"]["status"]
        restarts = proc["pm2_env"]["restart_time"]

        if SANDBOX_TAG not in name:
            continue

        if "watchdog" in name:
            continue

        if status != "online":
            logging.warning(f"{name} offline")
            restart_service(name)

        elif restarts > 50:
            logging.warning(f"{name} restart storm detected")
            restart_service(name)


def main():
    logging.info("Watchdog online — sandbox safe mode")

    while True:
        try:
            check_services()
        except Exception:
            logging.error(traceback.format_exc())

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
