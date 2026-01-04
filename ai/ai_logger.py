import logging
import logging.handlers
import os
import sys
import threading
from pathlib import Path

_LOGGER = None
_LOCK = threading.Lock()


def get_logger(name: str = "gcz-ai") -> logging.Logger:
    global _LOGGER

    # Thread-safe singleton
    with _LOCK:
        if _LOGGER:
            return _LOGGER

        # ------------------------------------------------------------
        # LOG DIRECTORY (with fallback)
        # ------------------------------------------------------------
        primary_dir = Path("/var/www/html/gcz/logs")
        fallback_dir = Path("/tmp/gcz-logs")

        try:
            primary_dir.mkdir(parents=True, exist_ok=True)
            log_dir = primary_dir
        except Exception:
            fallback_dir.mkdir(parents=True, exist_ok=True)
            log_dir = fallback_dir

        log_file = log_dir / "gcz-ai-core.log"

        # ------------------------------------------------------------
        # LOGGER SETUP
        # ------------------------------------------------------------
        logger = logging.getLogger(name)

        # Environment-aware log level
        env = os.getenv("GCZ_ENV", "prod").lower()
        logger.setLevel(logging.DEBUG if env == "dev" else logging.INFO)

        # Prevent duplicate handlers
        if logger.handlers:
            _LOGGER = logger
            return logger

        # ------------------------------------------------------------
        # FORMATTERS
        # ------------------------------------------------------------
        base_format = (
            "%(asctime)s.%(msecs)03d "
            "[%(levelname)s] "
            "%(process)d:%(threadName)s "
            "%(name)s: %(message)s"
        )

        date_format = "%Y-%m-%d %H:%M:%S"

        formatter = logging.Formatter(base_format, date_format)

        # Colored console output
        class ColorFormatter(logging.Formatter):
            COLORS = {
                "DEBUG": "\033[36m",
                "INFO": "\033[32m",
                "WARNING": "\033[33m",
                "ERROR": "\033[31m",
                "CRITICAL": "\033[41m",
            }
            RESET = "\033[0m"

            def format(self, record):
                color = self.COLORS.get(record.levelname, "")
                message = super().format(record)
                return f"{color}{message}{self.RESET}"

        color_formatter = ColorFormatter(base_format, date_format)

        # ------------------------------------------------------------
        # FILE HANDLER (rotating)
        # ------------------------------------------------------------
        fh = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10_000_000,
            backupCount=10,
            encoding="utf-8"
        )
        fh.setFormatter(formatter)

        # ------------------------------------------------------------
        # CONSOLE HANDLER
        # ------------------------------------------------------------
        ch = logging.StreamHandler(sys.stdout)
        ch.setFormatter(color_formatter)

        # ------------------------------------------------------------
        # ATTACH HANDLERS
        # ------------------------------------------------------------
        logger.addHandler(fh)
        logger.addHandler(ch)
        logger.propagate = False

        _LOGGER = logger
        return logger