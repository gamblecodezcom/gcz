"""
GCZ Root Package

This file makes /var/www/html/gcz a valid Python package so internal modules
like gcz_ai, backend.*, and shared utilities can be imported cleanly.
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Ensure root is importable
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Ensure AI engine is importable
AI_DIR = ROOT / "ai"
if AI_DIR.exists() and str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))