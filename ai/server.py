from __future__ import annotations
import os
import json
import datetime
import traceback
import subprocess
from pathlib import Path
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests


# ======================================================
# GLOBALS
# ======================================================
ENV = os.getenv("GCZ_ENV", "sandbox")
ROOT = Path("/var/www/html/gcz")
LOG_FILE = "/var/log/gcz/codex_sandbox_log.jsonl"

TELEGRAM_BOT = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_ADMIN = os.getenv("TELEGRAM_ADMIN_ID")

API = (
    f"https://api.telegram.org/bot{TELEGRAM_BOT}"
    if TELEGRAM_BOT else None
)

app = FastAPI(
    title="GCZ Codex — Sandbox GOD MODE",
    version="3.0"
)


# ======================================================
# HELPERS
# ======================================================
def log_event(event_type: str, payload: Dict[str, Any]):
    entry = {
        "ts": datetime.datetime.utcnow().isoformat(),
        "env": ENV,
        "type": event_type,
        "payload": payload,
    }
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


def telegram(msg: str):
    if not API or not TELEGRAM_ADMIN:
        return
    try:
        requests.post(
            f"{API}/sendMessage",
            json={
                "chat_id": TELEGRAM_ADMIN,
                "text": msg,
                "parse_mode": "Markdown"
            },
            timeout=5
        )
    except Exception:
        pass


# ======================================================
# MODELS
# ======================================================
class ChatRequest(BaseModel):
    message: str
    user: str | None = "console"


# ======================================================
# CORE ROUTES
# ======================================================
@app.get("/health")
async def health():
    return {"status": "ok", "env": ENV}


@app.post("/chat")
async def chat(req: ChatRequest):
    text = req.message.lower().strip()

    if "hello" in text or "hi" in text:
        reply = "Codex online. God-mode sandbox AI supervising cluster."
    elif "status" in text:
        reply = "System heartbeat nominal. PM2 services stable."
    elif "help" in text:
        reply = (
            "Commands you can send via `cc`:\n"
            "- audit system\n"
            "- normalize dotenv\n"
            "- risk check\n"
            "- explain logs\n"
        )
    else:
        reply = "Message received. I am listening."

    log_event("chat", {"msg": text, "reply": reply})
    telegram(f"💬 Codex Chat:\n{text}")

    return {"reply": reply}


# ======================================================
# AUDIT MODE
# ======================================================
@app.get("/codex/audit")
async def audit():
    try:
        pm2 = json.loads(subprocess.check_output(["pm2", "jlist"]))
        ports = subprocess.check_output(["ss", "-lntp"]).decode()
        tg_env = {k: v for k, v in os.environ.items() if k.startswith("TELEGRAM_")}

        res = {
            "pm2": pm2,
            "ports": ports,
            "telegram_env": tg_env
        }

        log_event("audit", res)
        return {"status": "ok", "env": ENV, "audit": res}

    except Exception:
        log_event("audit_error", {"err": traceback.format_exc()})
        raise HTTPException(500, "audit failed")


# ======================================================
# WRITE MODE — EXECUTOR
# ======================================================
@app.post("/codex/exec")
async def codex_exec(req: ChatRequest):

    cmd = req.message.lower()

    # --------------------------------------------------
    # 1) Dotenv Normalization
    # --------------------------------------------------
    if "dotenv" in cmd and "normalize" in cmd:

        changed: List[str] = []

        for pkg in ROOT.rglob("package.json"):
            service = pkg.parent
            pkg_json = json.loads(pkg.read_text())
            esm = pkg_json.get("type") == "module"

            for js in service.rglob("*.js"):
                txt = js.read_text()

                if "dotenv" in txt:
                    continue

                if esm:
                    block = (
                        'import dotenv from "dotenv";\n'
                        'dotenv.config({ path: "/var/www/html/gcz/.env.sandbox" });\n'
                    )
                else:
                    block = (
                        'require("dotenv").config({ path: "/var/www/html/gcz/.env.sandbox" });\n'
                    )

                js.write_text(block + txt)
                changed.append(str(js))

        log_event("dotenv_normalized", {"files": changed})
        telegram(f"🛠 Dotenv normalization updated {len(changed)} files")

        return {"status": "ok", "updated": changed}

    # --------------------------------------------------
    # 2) Risk Engine Stub
    # --------------------------------------------------
    if "risk" in cmd:
        score = 12  # placeholder
        log_event("risk_scan", {"score": score})
        telegram(f"⚠ Risk score = {score}")
        return {"risk": score}

    # --------------------------------------------------
    # 3) Human Approval Mode
    # --------------------------------------------------
    if "deploy" in cmd:
        telegram("🟡 Deployment approval required.")
        log_event("deploy_request", {"msg": cmd})
        return {"status": "awaiting human approval"}

    return {"status": "noop", "msg": "No rule matched"}


# ======================================================
# ROOT
# ======================================================
@app.get("/")
async def root():
    return {"msg": "GCZ Codex Sandbox API — WRITE MODE ENABLED"}
