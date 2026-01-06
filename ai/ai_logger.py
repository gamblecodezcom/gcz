from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict
import contextvars
import threading

from ai.config.loader import build_settings

_LOGGER_LOCK = threading.Lock()
_CONFIGURED = False
_TRACE_ID = contextvars.ContextVar("trace_id", default="-")


def set_trace_id(trace_id: str) -> None:
    _TRACE_ID.set(trace_id)


def get_trace_id() -> str:
    return _TRACE_ID.get()


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "trace_id": getattr(record, "trace_id", get_trace_id()),
        }

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        for key, value in record.__dict__.items():
            if key.startswith("_") or key in payload:
                continue
            if key in {"msg", "args", "levelname", "levelno", "pathname", "filename", "module",
                       "exc_info", "exc_text", "stack_info", "lineno", "funcName", "created",
                       "msecs", "relativeCreated", "thread", "threadName", "processName", "process",
                       "name"}:
                continue
            payload[key] = value

        return json.dumps(payload, ensure_ascii=False)


class TraceIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.trace_id = get_trace_id()
        return True


def _configure_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    repo_root = Path(__file__).resolve().parents[1]
    settings = build_settings(repo_root)

    log_dir = settings.log_dir
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "gcz-ai-core.log"

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.environment == "dev" else logging.INFO)
    root_logger.handlers.clear()

    formatter = JsonFormatter()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(TraceIdFilter())
    root_logger.addHandler(handler)

    if os.getenv("GCZ_LOG_TO_FILE", "1") == "1":
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(formatter)
        file_handler.addFilter(TraceIdFilter())
        root_logger.addHandler(file_handler)

    _CONFIGURED = True


def get_logger(name: str = "gcz-ai") -> logging.Logger:
    with _LOGGER_LOCK:
        _configure_logging()
        return logging.getLogger(name)


__all__ = ["get_logger", "set_trace_id", "get_trace_id"]
