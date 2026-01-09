import os
import json
import datetime
import traceback
import subprocess
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests

ROOT = Path("/var/www/html/gcz")
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ai.config.loader import build_settings
from ai.tools.ai_clients import AIClient
from ai.sandbox.codex_ext import risk_engine, self_heal
import promo_intel_scan

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

AI_CLIENT: AIClient | None = None


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
    try:
        return int(risk_engine.score(text))
    except Exception:
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


@app.on_event("startup")
async def startup() -> None:
    global AI_CLIENT
    AI_CLIENT = AIClient(build_settings(ROOT))


@app.on_event("shutdown")
async def shutdown() -> None:
    global AI_CLIENT
    if AI_CLIENT:
        await AI_CLIENT.close()


class ChatRequest(BaseModel):
    message: str
    user: str | None = "anonymous"


class RiskRequest(BaseModel):
    text: str


class PromptRequest(BaseModel):
    prompt: str


@app.get("/health")
async def health():
    return {"status": "ok", "env": ENV, "mode": "god"}


@app.post("/codex/risk")
async def codex_risk(req: RiskRequest):
    score = risk_score(req.text)
    log_event("risk", {"text": req.text[:200], "score": score})
    return {"risk": score}


@app.post("/codex/self-heal")
async def codex_self_heal():
    try:
        self_heal.heal()
        log_event("self_heal", {"status": "ok"})
        return {"status": "ok"}
    except Exception as exc:
        log_event("self_heal_error", {"error": str(exc)})
        raise HTTPException(500, "self-heal failed")


@app.post("/promo/scan")
async def promo_scan():
    try:
        summary = await promo_intel_scan.run_scan()
        log_event("promo_scan", summary)
        return {"status": "ok", "summary": summary}
    except Exception as exc:
        log_event("promo_scan_error", {"error": str(exc)})
        raise HTTPException(500, "promo scan failed")


@app.post("/prompt")
async def prompt_experiment(req: PromptRequest):
    if not AI_CLIENT:
        raise HTTPException(503, "AI client unavailable")
    response = await AI_CLIENT.generate(req.prompt)
    log_event("prompt", {"provider": response.provider, "mode": response.mode})
    return {"provider": response.provider, "mode": response.mode, "text": response.text}


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
