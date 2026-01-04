import os
import time
import random
import threading
from health_engine import run_health_scan
from ai_logger import get_logger

logger = get_logger("gcz-ai.monitor")

# ============================================================
# CONFIG
# ============================================================

DEFAULT_INTERVAL = int(os.getenv("AI_MONITOR_INTERVAL", "60"))
MAX_BACKOFF = 300  # 5 minutes
HEARTBEAT_EVERY = 10  # cycles


# ============================================================
# INTERNAL LOOP
# ============================================================

def _monitor_loop(interval: int):
    """
    Runs continuous health scans with jitter, backoff, and heartbeat logging.
    Never blocks FastAPI. Runs forever in a daemon thread.
    """

    # Initial jitter to avoid synchronized load spikes
    jitter = random.uniform(0, 3)
    logger.info(f"Monitor starting with jitter={jitter:.2f}s")
    time.sleep(jitter)

    cycle = 0
    backoff = interval

    while True:
        cycle += 1

        try:
            run_health_scan()
            backoff = interval  # reset backoff on success

        except Exception as e:
            logger.error(f"Monitor scan error: {e}")

            # Exponential backoff
            backoff = min(backoff * 2, MAX_BACKOFF)
            logger.warning(f"Backoff increased to {backoff}s due to failure")

        # Heartbeat every N cycles
        if cycle % HEARTBEAT_EVERY == 0:
            logger.info(f"Monitor heartbeat — cycle={cycle}, interval={backoff}s")

        time.sleep(backoff)


# ============================================================
# THREAD STARTER
# ============================================================

_monitor_thread = None
_thread_lock = threading.Lock()


def start_monitor(interval: int = DEFAULT_INTERVAL):
    """
    Starts the monitor in a daemon thread.
    Safe to call from FastAPI startup or standalone.
    Ensures only one monitor thread runs.
    """

    global _monitor_thread

    with _thread_lock:
        if _monitor_thread and _monitor_thread.is_alive():
            logger.info("Monitor already running")
            return _monitor_thread

        logger.info(f"Starting memory monitor (interval={interval}s)")

        thread = threading.Thread(
            target=_monitor_loop,
            args=(interval,),
            daemon=True,
            name="gcz-ai-monitor"
        )
        thread.start()

        _monitor_thread = thread
        return thread


# ============================================================
# STANDALONE MODE
# ============================================================

if __name__ == "__main__":
    logger.info("Starting memory monitor in standalone mode...")
    start_monitor(DEFAULT_INTERVAL)

    # Keep main thread alive
    while True:
        time.sleep(3600)
