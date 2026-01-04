"""
Unified GCZ AI Loader

This file gives you ONE import point for:
- MemoryClient (HTTP client)
- Direct DB helpers (fetchone, fetchall, execute, run_query)
- Health scan utilities
- Background monitor starter
- AI logger
- Version + metadata

This is the canonical GCZ AI entrypoint.
"""

from typing import Dict, Any

# Core modules
from ai_logger import get_logger
from memory_client import MemoryClient
from memory_monitor import start_monitor
from health_engine import run_health_scan
from db import fetchone, fetchall, execute, run_query

logger = get_logger("gcz-ai.core")

# ============================================================
# CLIENT FACTORY
# ============================================================

def get_client(base: str = "http://127.0.0.1:8010") -> MemoryClient:
    """
    Returns a preconfigured MemoryClient for interacting with the AI engine.
    """
    logger.debug(f"Creating MemoryClient for base={base}")
    return MemoryClient(base=base)


# ============================================================
# HEALTH SCAN WRAPPER
# ============================================================

def health_scan() -> Dict[str, Any]:
    """
    Runs a direct health scan (bypassing HTTP).
    """
    logger.info("Running direct health scan via gcz_ai")
    return run_health_scan()


# ============================================================
# BACKGROUND MONITOR WRAPPER
# ============================================================

def start_background_monitor(interval: int = 60):
    """
    Starts the health monitor thread.
    Safe to call from any service.
    """
    logger.info(f"Starting background monitor (interval={interval}s)")
    return start_monitor(interval=interval)


# ============================================================
# METADATA
# ============================================================

def version() -> str:
    return "GCZ-AI-Core v1.0.0"


def info() -> Dict[str, Any]:
    return {
        "service": "gcz-ai-core",
        "version": version(),
        "modules": [
            "db",
            "memory_store",
            "memory_monitor",
            "health_engine",
            "memory_client",
            "ai_logger",
        ],
    }


# ============================================================
# EXPORTS
# ============================================================

__all__ = [
    "get_client",
    "health_scan",
    "start_background_monitor",
    "fetchone",
    "fetchall",
    "execute",
    "run_query",
    "get_logger",
    "version",
    "info",
]