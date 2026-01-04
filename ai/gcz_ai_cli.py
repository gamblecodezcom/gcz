#!/usr/bin/env python3
"""
GCZ AI CLI — Python replacement for the old gcz-ai.sh launcher.

This script:
- Resolves ROOT, LOGS, CONTROL, MEMORY paths
- Resolves DB connection (ENV first, fallback to .env)
- Validates AI core file exists
- Prints the same startup banner
- Executes the AI core Python file with the same arguments
"""

import os
import sys
import subprocess
from pathlib import Path

# ============================================================
# PATHS
# ============================================================

ROOT = Path("/var/www/html/gcz")
LOGS = ROOT / "logs"
CONTROL = ROOT / "AIAGENT_MASTERCONTROL.txt"
AI_CORE = ROOT / "gcz-ai-core.py"
MEMORY = ROOT / "memory_index.json"

LOGS.mkdir(parents=True, exist_ok=True)

# ============================================================
# RESOLVE DB CONNECTION
# ============================================================

DB = os.getenv("GCZ_DB")

if not DB:
    env_path = ROOT / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.startswith("GCZ_DB="):
                    DB = line.split("=", 1)[1].strip()
                    break

if not DB:
    print("❌ No DB connection string found (GCZ_DB missing)")
    sys.exit(1)

# ============================================================
# VALIDATE AI CORE
# ============================================================

if not AI_CORE.exists():
    print("❌ AI Core script missing:")
    print(f"   {AI_CORE}")
    sys.exit(1)

# ============================================================
# BANNER
# ============================================================

print("===============================================")
print(" 🧠  GAMBLECODEZ AI GOD MODE — LIVE")
print("===============================================")
print(f"ROOT:    {ROOT}")
print(f"DB:      {DB}")
print(f"CONTROL: {CONTROL}")
print(f"LOGS:    {LOGS}")
print("===============================================")

# ============================================================
# EXECUTE AI CORE
# ============================================================

cmd = [
    "python3",
    str(AI_CORE),
    "--root", str(ROOT),
    "--db", DB,
    "--memory", str(MEMORY),
    "--control", str(CONTROL),
    "--logs", str(LOGS),
]

subprocess.run(cmd)