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
from typing import Dict, Any, List, Optional

import requests
import redis
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

from ai.config.loader import build_settings
from ai.db import DB
from ai.health_engine import run_health_scan
from ai.memory_store import add_memory, log_anomaly
from ai.shared.promo_rules import format_promo, load_rules
from ai.tools.ai_clients import AIClient

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
# AI CLIENT + RULES
# ======================================================
AI_CLIENT: AIClient | None = None
PROMO_RULES = load_rules()


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


def _promo_prompt(payload: dict, rules: dict) -> str:
    templates = rules.get("templates", [])
    cta_phrases = rules.get("cta_phrases", [])
    return (
        "Format the following promo for Telegram/Discord.\n"
        "Rules:\n"
        f"- Preferred templates: {templates}\n"
        f"- CTA phrases: {cta_phrases}\n"
        "- Keep it concise (1-6 lines). Return message only.\n\n"
        f"Promo fields: {json.dumps(payload)}"
    )


# ======================================================
# MODELS
# ======================================================
class ChatRequest(BaseModel):
    message: str
    user: str | None = "console"


class MCPEvent(BaseModel):
    tool: str
    payload: dict


class MemoryRequest(BaseModel):
    category: str
    message: Optional[str] = None
    source: Optional[str] = "mcp"
    meta: Optional[dict] = None
    limit: int = 50


class AnomalyRequest(BaseModel):
    message: str
    meta: Optional[dict] = None


class PromoFormatRequest(BaseModel):
    content: Optional[str] = None
    headline: Optional[str] = None
    description: Optional[str] = None
    bonus_code: Optional[str] = None
    promo_url: Optional[str] = None
    affiliate_link: Optional[str] = None
    affiliate_name: Optional[str] = None
    affiliate_id: Optional[str] = None
    force_fallback: bool = False


# ======================================================
# STARTUP / SHUTDOWN
# ======================================================
@app.on_event("startup")
async def startup() -> None:
    await DB.init()
    global AI_CLIENT, PROMO_RULES
    settings = build_settings(ROOT)
    AI_CLIENT = AIClient(settings)
    PROMO_RULES = load_rules()


@app.on_event("shutdown")
async def shutdown() -> None:
    global AI_CLIENT
    if AI_CLIENT:
        await AI_CLIENT.close()
    await DB.close()


# ======================================================
# INTERNAL HEALTH
# ======================================================
async def _build_health() -> Dict[str, Any]:
    ok = True
    issues: List[str] = []
    redis_ok = True

    try:
        r.ping()
    except Exception:
        ok = False
        redis_ok = False
        issues.append("redis")

    if DB.enabled:
        try:
            await DB.init()
            db_status = await DB.health_check()
            if not db_status.get("ok"):
                ok = False
                issues.append("db")
        except Exception as exc:
            ok = False
            issues.append("db")
            db_status = {"ok": False, "error": str(exc)}
    else:
        db_status = {"ok": False, "disabled": True}

    return {
        "status": "ok" if ok else "degraded",
        "env": ENV,
        "redis": "up" if redis_ok else "down",
        "db": db_status,
        "issues": issues,
    }


# ======================================================
# GLOBAL HEALTH CHECK
# ======================================================
@app.get("/health")
async def health():
    return await _build_health()


@app.get("/status")
async def status(x_gcz_key: str | None = Header(default=None)):
    require_auth(x_gcz_key)
    return await _build_health()


@app.post("/scan")
async def scan(x_gcz_key: str | None = Header(default=None)):
    require_auth(x_gcz_key)
    results = await run_health_scan()
    log_event("scan", results)
    return results


@app.post("/memory")
async def memory(req: MemoryRequest, x_gcz_key: str | None = Header(default=None)):
    require_auth(x_gcz_key)

    if req.message:
        stored = await add_memory(
            req.category,
            req.message,
            req.source or "mcp",
            req.meta or {},
        )
        return {"stored": stored}

    rows = await DB.fetch(
        """
        SELECT id, category, message, source, meta, created_at
        FROM ai_memory
        WHERE category = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        (req.category, req.limit),
    )
    return {"items": rows}


@app.get("/memory")
async def memory_list(
    limit: int = 200,
    category: str | None = None,
    x_gcz_key: str | None = Header(default=None),
):
    require_auth(x_gcz_key)

    if category:
        rows = await DB.fetch(
            """
            SELECT id, category, message, source, meta, created_at
            FROM ai_memory
            WHERE category = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            (category, limit),
        )
    else:
        rows = await DB.fetch(
            """
            SELECT id, category, message, source, meta, created_at
            FROM ai_memory
            ORDER BY created_at DESC
            LIMIT $1
            """,
            (limit,),
        )
    return {"items": rows}


@app.post("/anomaly")
async def anomaly(req: AnomalyRequest, x_gcz_key: str | None = Header(default=None)):
    require_auth(x_gcz_key)
    stored = await log_anomaly("general", req.message, req.meta or {})
    return {"stored": stored}


@app.get("/anomalies")
async def anomalies(
    limit: int = 50,
    x_gcz_key: str | None = Header(default=None),
):
    require_auth(x_gcz_key)
    rows = await DB.fetch(
        """
        SELECT id, type, message, meta, created_at
        FROM anomalies
        ORDER BY created_at DESC
        LIMIT $1
        """,
        (limit,),
    )
    return {"items": rows}


@app.post("/promo/format")
async def promo_format(req: PromoFormatRequest, x_gcz_key: str | None = Header(default=None)):
    require_auth(x_gcz_key)

    payload = {
        "content": req.content or "",
        "headline": req.headline or "",
        "description": req.description or "",
        "bonus_code": req.bonus_code or "",
        "promo_url": req.promo_url or "",
        "affiliate_link": req.affiliate_link or "",
        "affiliate_name": req.affiliate_name or "",
        "affiliate_id": req.affiliate_id or "",
    }

    global PROMO_RULES
    rules = load_rules()
    PROMO_RULES = rules

    if AI_CLIENT and not req.force_fallback:
        prompt = _promo_prompt(payload, rules)
        response = await AI_CLIENT.generate(prompt)
        if response.mode == "ai" and response.text:
            message = response.text.strip()
            affiliate_link = payload.get("affiliate_link")
            if affiliate_link and affiliate_link not in message:
                cta_phrases = rules.get("cta_phrases", [])
                cta_phrase = cta_phrases[0] if cta_phrases else "Claim now"
                cta_template = rules.get("affiliate", {}).get(
                    "cta_template",
                    "🔗 Not yet signed up? {affiliate_link}",
                )
                cta_line = cta_template.format(
                    affiliate_link=affiliate_link,
                    cta=cta_phrase,
                )
                message = f"{message}\n\n{cta_line}"
            return {
                "message": message,
                "mode": "ai",
                "provider": response.provider,
            }

    fallback = format_promo(payload, rules)
    return {
        "message": fallback,
        "mode": "fallback",
        "provider": "fallback",
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
