"""
backend/services/__init__.py

Initializes the services package for GambleCodez backend.

This file ensures all service modules are importable and cleanly exposed.
"""

from .auth import *
from .cache import *
from .db import *
from .sc_service import *

# AI submodule (if needed)
try:
    from .ai import *
except ImportError:
    pass

__all__ = [
    "auth",
    "cache",
    "db",
    "sc_service",
    "ai",
]