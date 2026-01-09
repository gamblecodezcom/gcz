#!/usr/bin/env python3
"""
GCZ AI CLI — God-mode launcher for the AI core supervisor.
Repository-relative, environment-safe, idempotent.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# ============================================================
# PATH RESOLUTION
# ============================================================

ROOT = Path(__file__).resolve().parents[1]
LOGS = ROOT / "logs"
CONTROL = ROOT / "AIAGENT_MASTERCONTROL.txt"
AI_CORE = ROOT / "gcz-ai-core.py"
LOCKFILE = ROOT / ".ai_core.lock"

LOGS.mkdir(parents=True, exist_ok=True)

# ============================================================
# SAFETY CHECKS
# ============================================================

if not AI_CORE.exists():
    raise SystemExit(f"[FATAL] AI Core missing: {AI_CORE}")

if LOCKFILE.exists():
    print("[INFO] AI Core already running (lockfile exists)")
    sys.exit(0)

# ============================================================
# ENV VALIDATION
# ============================================================

GCZ_ENV = os.getenv("GCZ_ENV", "unknown")
if GCZ_ENV not in {"production", "sandbox"}:
    print(f"[WARN] GCZ_ENV is '{GCZ_ENV}' (expected production|sandbox)")

# ============================================================
# LOCK
# ============================================================

LOCKFILE.write_text(
    f"started_at={datetime.utcnow().isoformat()}Z\n"
    f"env={GCZ_ENV}\n"
)

# ============================================================
# COMMAND
# ============================================================

cmd = [
    "python3",
    str(AI_CORE),
    "--root",
    str(ROOT),
    "--control",
    str(CONTROL),
]

print(f"[INFO] Launching AI Core (env={GCZ_ENV})")
print(f"[INFO] Root: {ROOT}")

# ============================================================
# EXECUTION
# ============================================================

try:
    subprocess.run(cmd, check=False)
finally:
    # If the core exits, remove lock
    if LOCKFILE.exists():
        LOCKFILE.unlink()
