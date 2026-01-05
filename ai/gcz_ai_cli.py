#!/usr/bin/env python3
"""
GCZ AI CLI — repository-relative launcher for the AI core.
"""

from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOGS = ROOT / "logs"
CONTROL = ROOT / "AIAGENT_MASTERCONTROL.txt"
AI_CORE = ROOT / "gcz-ai-core.py"
MEMORY = ROOT / "memory_index.json"

LOGS.mkdir(parents=True, exist_ok=True)

if not AI_CORE.exists():
    raise SystemExit(f"AI Core script missing: {AI_CORE}")

cmd = [
    "python3",
    str(AI_CORE),
    "--root",
    str(ROOT),
    "--control",
    str(CONTROL),
    "--logs",
    str(LOGS),
]

subprocess.run(cmd, check=False)
