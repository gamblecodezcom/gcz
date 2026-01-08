#!/usr/bin/env python3
"""
GCZ Codex Control Plane API
Production + Sandbox aware
Security-hardened
Adds Redis AI memory + MCP Ops Bridge
"""

from __future__ import annotations
import os
import json
import datetime
import traceback
import subprocess
from pathlib import Path
from typing import Dict, Any, List

import requests
import redis
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel


# ======================================================
# ENV + PATHS
# ======================================================
ENV = os.getenv("GCZ_ENV", "sandbox").lower()
ROOT = Path("/var/www/html/gcz")

LOG_FILE = (
    "/var/log/gcz/prod/codex_log.jsonl"
    if ENV == "production"
    else "/var/log/gcz/sandbox/codex_log.jsonl"
)

TELEGRAM_BOT = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_ADMIN = os.getenv("TELEGRAM_ADMIN_ID")
API = f"https://api.telegram.org/bot{TELEGRAM_BOT}" if TELEGRAM_BOT else None

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/3")

# ======================================================
# SECURE API KEY
# ======================================================
CONTROL_KEY = os.getenv("GCZ_CONTROL_KEY")

def require_auth(x_gcz_key: str | None):
    if not CONTROL_KEY:
        return
    if x_gcz_key != CONTROL_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


# ======================================================
# REDIS — AI MEMORY
# ======================================================
r = redis.from_url(REDIS_URL, decode_responses=True)


# ======================================================
# APP
# ======================================================
app = FastAPI(
    title=f"GCZ Codex Control — {ENV.upper()}",
    version="4.0",
)


# ======================================================
# HELPERS
# ======================================================
def log_event(event_type: str, payload: Dict[str, Any]):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    entry = {
        "ts": datetime.datetime.utcnow().isoformat(),
        "env": ENV,
        "type": event_type,
        "payload": payload,
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


def telegram(msg: str):
    if not API or not TELEGRAM_ADMIN:
        return
    try:
        requests.post(
            f"{API}/sendMessage",
            json={"chat_id": TELEGRAM_ADMIN, "text": msg},
            timeout=5,
        )
    except Exception:
        pass


# ======================================================
# MODELS
# ======================================================
class ChatRequest(BaseModel):
    message: str
    user: str | None = "console"


class MCPEvent(BaseModel):
    tool: str
    payload: dict


# ======================================================
# GLOBAL HEALTH CHECK
# ======================================================
@app.get("/health")
async def health():
    ok = True
    issues = []

    try:
        r.ping()
    except Exception:
        ok = False
        issues.append("redis")

    return {
        "status": "ok" if ok else "degraded",
        "env": ENV,
        "redis": "up" if not issues else "down",
        "issues": issues,
    }


# ======================================================
# SECURE CHAT OPS
# ======================================================
@app.post("/chat")
async def chat(req: ChatRequest, x_gcz_key: str | None = Header(default=None)):

    require_auth(x_gcz_key)

    t = req.message.lower().strip()

    replies = {
        "hello": "Codex online.",
        "status": "Cluster stable.",
        "help": "Commands: audit / risk / memory / normalize dotenv",
    }

    reply = next((v for k, v in replies.items() if k in t), "Message received.")

    log_event("chat", {"msg": t, "reply": reply})
    telegram(f"💬 [{ENV}] Codex Chat:\n{t}")

    return {"reply": reply}


# ======================================================
# AUDIT
# ======================================================
@app.get("/codex/audit")
async def audit(x_gcz_key: str | None = Header(default=None)):

    require_auth(x_gcz_key)

    try:
        pm2 = json.loads(subprocess.check_output(["pm2", "jlist"]))

        res = {
            "pm2_processes": len(pm2),
            "env": ENV,
        }

        log_event("audit", res)
        return {"status": "ok", **res}

    except Exception:
        log_event("audit_error", {"err": traceback.format_exc()})
        raise HTTPException(500, "audit failed")


# ======================================================
# REDIS AI MEMORY
# ======================================================
@app.post("/memory/write")
async def memory_write(req: ChatRequest, x_gcz_key: str | None = Header(default=None)):

    require_auth(x_gcz_key)

    key = f"gcz:memory:{ENV}:{req.user}"
    r.lpush(key, req.message)
    r.ltrim(key, 0, 200)

    log_event("memory_write", {"user": req.user, "msg": req.message})

    return {"stored": True}


@app.get("/memory/read/{user}")
async def memory_read(user: str, x_gcz_key: str | None = Header(default=None)):

    require_auth(x_gcz_key)

    key = f"gcz:memory:{ENV}:{user}"
    data = r.lrange(key, 0, 50)

    return {"events": data}


# ======================================================
# MCP → OPS AI BRIDGE
# ======================================================
@app.post("/mcp/event")
async def mcp_event(ev: MCPEvent, x_gcz_key: str | None = Header(default=None)):

    require_auth(x_gcz_key)

    log_event("mcp_event", ev.dict())

    if ev.tool == "risk":
        score = 0.77
        telegram(f"⚠ RISK ALERT {score}")
        return {"risk": score}

    return {"status": "received"}


# ======================================================
# SANDBOX EXECUTOR
# ======================================================
@app.post("/codex/exec")
async def codex_exec(req: ChatRequest, x_gcz_key: str | None = Header(default=None)):

    require_auth(x_gcz_key)

    cmd = req.message.lower()

    if ENV == "production":
        telegram("⚠ Exec blocked in production")
        return {"status": "blocked"}

    if "normalize" in cmd and "dotenv" in cmd:
        changed: List[str] = []

        for pkg in ROOT.rglob("package.json"):
            service = pkg.parent
            pkg_json = json.loads(pkg.read_text())
            esm = pkg_json.get("type") == "module"

            for js in service.rglob("*.js"):
                txt = js.read_text()
                if "dotenv" in txt:
                    continue

                block = (
                    'import dotenv from "dotenv";\n'
                    'dotenv.config({ path: "/var/www/html/gcz/.env.sandbox" });\n'
                    if esm else
                    'require("dotenv").config({ path: "/var/www/html/gcz/.env.sandbox" });\n'
                )

                js.write_text(block + txt)
                changed.append(str(js))

        log_event("dotenv_normalized", {"files": changed})
        telegram(f"🛠 Updated {len(changed)} files")

        return {"status": "ok", "updated": changed}

    return {"status": "noop"}


# ======================================================
# ROOT
# ======================================================
@app.get("/")
async def root():
    return {"msg": f"GCZ Codex Control API — {ENV} mode"}
