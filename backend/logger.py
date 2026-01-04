import logging
import logging.handlers
import os
from pathlib import Path

LOG_LEVEL = os.getenv("GCZ_LOG_LEVEL", "INFO").upper()

LOG_DIR = Path("/var/www/html/gcz/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOG_FILE = LOG_DIR / "gcz-backend.log"


def get_logger(name: str):
    """
    Unified GCZ logger.
    - Rotating file handler
    - Stream handler for PM2
    - No duplicate handlers
    - Consistent formatting across all services
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger  # Prevent duplicate handlers

    logger.setLevel(LOG_LEVEL)

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s :: %(message)s",
        "%Y-%m-%d %H:%M:%S"
    )

    # File handler (rotating)
    fh = logging.handlers.RotatingFileHandler(
        LOG_FILE,
        maxBytes=5_000_000,
        backupCount=5,
        encoding="utf-8"
    )
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    # Stream handler (PM2 / console)
    sh = logging.StreamHandler()
    sh.setFormatter(formatter)
    logger.addHandler(sh)

    logger.propagate = False
    return logger