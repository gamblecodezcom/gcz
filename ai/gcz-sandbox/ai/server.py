# ==================  GCZ CODEX — GOD MODE v4.0  ==================
from __future__ import annotations
import os
import json
import datetime
import subprocess
import sqlite3
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI
from pydantic import BaseModel
import requests


# =========================================================
# CONFIG
# =========================================================
ENV = os.getenv("GCZ_ENV", "sandbox")

ROOT = Path("/var/www/html/gcz")
LOG_FILE = "/var/log/gcz/codex_sandbox_log.jsonl"
DB = "/var/www/html/gcz/ai/gcz-sandbox/codex_memory.db"

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN_SANDBOX") or os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_ADMIN = os.getenv("TELEGRAM_ADMIN_ID")
TG = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

CANARY_STAGES = [10, 50, 100]
FREEZE = False
APPROVAL_QUEUE: Dict[str, dict] = {}

# =========================================================
# FASTAPI
# =========================================================
app = FastAPI(title="GCZ Codex — GOD MODE", version="4.0")


# =========================================================
# LOGGING
# =========================================================
def log_event(event_type: str, payload: Dict[str, Any]):
    entry = {
        "ts": datetime.datetime.utcnow().isoformat(),
        "env": ENV,
        "type": event_type,
        "payload": payload
    }
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


# =========================================================
# MEMORY DB
# =========================================================
def db():
    return sqlite3.connect(DB)


def init_db():
    c = db()
    c.execute("""
    CREATE TABLE IF NOT EXISTS memory (
        k TEXT PRIMARY KEY,
        v TEXT,
        ts TEXT
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT,
        event TEXT,
        details TEXT
    )
    """)
    c.commit()
    c.close()


init_db()


def memory_set(k, v):
    c = db()
    c.execute("REPLACE INTO memory VALUES (?, ?, ?)",
              (k, v, datetime.datetime.utcnow().isoformat()))
    c.commit()
    c.close()


def memory_get(k):
    c = db()
    q = c.execute("SELECT v FROM memory WHERE k=?", (k,))
    r = q.fetchone()
    c.close()
    return r[0] if r else None


# =========================================================
# TELEGRAM
# =========================================================
def tg(msg: str):
    if not TELEGRAM_TOKEN or not TELEGRAM_ADMIN:
        return
    try:
        requests.post(f"{TG}/sendMessage",
            json={"chat_id": TELEGRAM_ADMIN,
                  "text": msg,
                  "parse_mode": "Markdown"},
            timeout=5)
    except:
        pass


def tg_buttons(text, buttons):
    requests.post(f"{TG}/sendMessage",
        json={
            "chat_id": TELEGRAM_ADMIN,
            "text": text,
            "reply_markup": {
                "inline_keyboard": buttons
            }
        },
        timeout=5
    )


# =========================================================
# RISK ENGINE
# =========================================================
def risk_score(goal: str):
    score = 0
    g = goal.lower()

    if "restart" in g:
        score += 40
    if "deploy" in g:
        score += 35
    if "db" in g:
        score += 30
    if "webhook" in g:
        score += 15

    return min(score, 100)


# =========================================================
# HEALTH
# =========================================================
@app.get("/health")
async def health():
    return {"status": "ok", "env": ENV}


# =========================================================
# CHAT
# =========================================================
class ChatRequest(BaseModel):
    message: str
    user: str | None = "anonymous"


@app.post("/chat")
async def chat(req: ChatRequest):

    txt = req.message.lower()
    log_event("chat_in", req.dict())

    if "hello" in txt:
        reply = "Codex online. GOD-MODE engaged 😎"

    elif "status" in txt:
        reply = "Heartbeat stable. Ops green."

    elif "risk" in txt:
        goal = txt.replace("risk", "").strip()
        reply = f"Risk={risk_score(goal)} for goal `{goal}`"

    elif "help" in txt:
        reply = (
            "Commands:\n"
            "- audit system\n"
            "- risk <goal>\n"
            "- normalize dotenv\n"
            "- deploy <service>\n"
            "- freeze deploys\n"
            "- approve deploy\n"
        )

    else:
        reply = "Acknowledged. Standing by."

    log_event("chat_reply", {"reply": reply})
    tg(f"💬 Chat:\n{txt}")

    return {"reply": reply}


# =========================================================
# PLAN
# =========================================================
@app.post("/codex/plan")
async def codex_plan(req: ChatRequest):

    goal = req.message
    score = risk_score(goal)

    plan = [
        "Check AI health",
        "Inspect PM2",
        "Validate webhook",
        "Verify DB",
        "Detect crash loops",
        "Confirm listening ports",
        "Log timeline"
    ]

    log_event("plan", {"goal": goal, "risk": score})
    tg(f"📋 Plan Generated\nRisk={score}\nGoal={goal}")

    return {"goal": goal, "plan": plan, "risk": score}


# =========================================================
# AUDIT
# =========================================================
@app.get("/codex/audit")
async def audit_cluster():

    pm2_json = subprocess.check_output(["pm2", "jlist"]).decode()

    result = {
        "pm2": json.loads(pm2_json),
        "ports": subprocess.check_output(["ss", "-lntp"]).decode(),
    }

    log_event("audit", result)

    return {"status": "ok", "env": ENV, "audit": result}


# =========================================================
# HUMAN-APPROVAL PIPELINE
# =========================================================
def queue_action(action, risk):
    aid = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
    APPROVAL_QUEUE[aid] = {"action": action, "risk": risk}

    tg_buttons(
        f"⚠️ DEPLOY ACTION REQUIRES APPROVAL\nRisk={risk}\n{action}",
        [[
            {"text": "✅ Approve", "callback_data": f"approve:{aid}"},
            {"text": "❌ Reject", "callback_data": f"reject:{aid}"}
        ]]
    )

    return aid


# =========================================================
# WRITE-MODE EXEC ENGINE
# =========================================================
@app.post("/codex/exec")
async def codex_exec(req: ChatRequest):

    cmd = req.message.lower()
    log_event("exec", {"cmd": cmd})

    # Ping
    if "ping" in cmd:
        return {"status": "ok"}

    # Dotenv Normalization
    if "dotenv" in cmd and "normalize" in cmd:

        changed: List[str] = []

        for pkg in ROOT.rglob("package.json"):

            pkg_json = json.loads(pkg.read_text())
            esm = pkg_json.get("type") == "module"
            service = pkg.parent

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
        tg(f"🛠 Dotenv normalized across {len(changed)} files")

        return {"status": "ok", "updated": changed}

    # Deploy Protection
    if "deploy" in cmd or "restart" in cmd:
        score = risk_score(cmd)
        aid = queue_action(cmd, score)
        return {"status": "pending_approval", "action_id": aid}

    return {"status": "noop"}


# =========================================================
# ROOT
# =========================================================
@app.get("/")
async def root():
    return {"msg": "GCZ Codex — GOD MODE v4.0"}
