import os
import json
import datetime
import traceback
import subprocess
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests

# ================================
# CONSTANTS
# ================================
ENV = os.getenv("GCZ_ENV", "sandbox")

LOG_FILE = "/var/log/gcz/codex_sandbox_log.jsonl"
APP_TITLE = "GCZ Codex — Sandbox GOD MODE"

# Telegram Support
TG_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN_SANDBOX")
TG_ADMIN = os.getenv("TELEGRAM_ADMIN_ID")
TG_API = f"https://api.telegram.org/bot{TG_TOKEN}" if TG_TOKEN else None

FREEZE = False


# ================================
# HELPERS
# ================================
def now():
    return datetime.datetime.utcnow().isoformat()


def log_event(event_type, payload):
    entry = {
        "ts": now(),
        "env": ENV,
        "type": event_type,
        "payload": payload,
    }
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


def tg_notify(txt):
    if not TG_API or not TG_ADMIN:
        return
    try:
        requests.post(
            f"{TG_API}/sendMessage",
            json={"chat_id": TG_ADMIN, "text": txt},
            timeout=5,
        )
    except:
        pass


def safe_shell(cmd):
    return subprocess.check_output(cmd, shell=True).decode()


def risk_score(text):
    t = text.lower()
    score = 0
    if "restart" in t:
        score += 2
    if "deploy" in t:
        score += 3
    if "database" in t:
        score += 5
    return score


# ================================
# FASTAPI
# ================================
app = FastAPI(title=APP_TITLE)


class ChatRequest(BaseModel):
    message: str
    user: str | None = "anonymous"


@app.get("/health")
async def health():
    return {"status": "ok", "env": ENV, "mode": "god"}


# ================================
# HUMAN CHAT MODE
# ================================
@app.post("/chat")
async def chat(req: ChatRequest):

    text = req.message.lower().strip()
    log_event("chat_in", req.dict())

    if "hello" in text:
        reply = "Yo — Codex here. Sandbox AI Guardian online. 👁"
    elif "who are you" in text:
        reply = "Autonomous AI Ops. I watch. I repair. I secure."
    elif "status" in text:
        reply = "Cluster stable. No active errors."
    else:
        reply = "Command acknowledged. What do you want me to inspect?"

    log_event("chat_out", {"reply": reply})
    return {"reply": reply}


# ================================
# GENERATE OPS PLAN
# ================================
@app.post("/codex/plan")
async def codex_plan(req: ChatRequest):

    score = risk_score(req.message)

    plan = [
        "Verify AI health",
        "Check PM2 services",
        "Verify Telegram webhook",
        "Check DB connectivity",
        "Inspect service restarts",
        "Confirm open ports",
        "Summarize report"
    ]

    log_event("plan", {"goal": req.message, "score": score})

    return {
        "goal": req.message,
        "risk": score,
        "env": ENV,
        "plan": plan,
        "mode": "hybrid-human"
    }


# ================================
# AUDIT MODE
# ================================
@app.get("/codex/audit")
async def audit_cluster():

    try:
        result = {
            "pm2": json.loads(safe_shell("pm2 jlist")),
            "ports": safe_shell("ss -lntp"),
            "telegram": {
                k: v for k, v in os.environ.items()
                if k.startswith("TELEGRAM_")
            },
            "env": ENV
        }

        log_event("audit", result)
        return {"status": "ok", "audit": result}

    except Exception:
        log_event("audit_error", traceback.format_exc())
        raise HTTPException(500, "audit failed")


# ================================
# HYBRID CONTROL MODE
# ================================
@app.post("/codex/exec")
async def codex_exec(req: ChatRequest):

    global FREEZE
    msg = req.message.lower()

    if FREEZE:
        return {"status": "frozen"}

    score = risk_score(msg)

    log_event("exec_attempt", {"cmd": msg, "risk": score})

    if score >= 5:
        tg_notify(f"⚠️ HUMAN APPROVAL REQUIRED\n\n{msg}")
        return {"status": "pending", "approval": True}

    return {"status": "ok", "executed": False}


# ================================
# ROOT
# ================================
@app.get("/")
async def root():
    return {"msg": APP_TITLE}
