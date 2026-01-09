#!/usr/bin/env python3
"""
Sandbox AI API entrypoint.
Re-exports the legacy sandbox AI server implementation.
"""

from __future__ import annotations

import sys
from pathlib import Path

SANDBOX_ROOT = Path(__file__).resolve().parent
LEGACY_AI_DIR = SANDBOX_ROOT / "ai"

if str(LEGACY_AI_DIR) not in sys.path:
    sys.path.insert(0, str(LEGACY_AI_DIR))

from codex_api import app  # type: ignore

__all__ = ["app"]
