"""
backend/__init__.py

GambleCodez Backend Package Initializer

This file ensures:
- Clean package imports
- Centralized access to config + logger
- Predictable module resolution for FastAPI, scripts, and agents
"""

from .config import get_settings
from backend.logger import get_logger

__all__ = [
    "get_settings",
    "get_logger",
]