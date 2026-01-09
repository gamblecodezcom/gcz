from __future__ import annotations

import sys
from pathlib import Path

SANDBOX_ROOT = Path(__file__).resolve().parents[1]
LEGACY_AI_DIR = SANDBOX_ROOT / "ai"

if str(LEGACY_AI_DIR) not in sys.path:
    sys.path.insert(0, str(LEGACY_AI_DIR))
