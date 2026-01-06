import os
import json
import time
import subprocess
import datetime
import traceback
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from threading import Thread, Event

# =========================================================
# CONSTANTS
# =========================================================
ENV = os.getenv("GCZ_ENV", "sandbox")
SELF_HEAL_ENABLED = True
WATCH_INTERVAL = 30

LOG_FILE = "/var/log/gcz/codex_sandbox_log.jsonl"
MEMORY_FILE = "/var/www/html/gcz/ai/gcz-sandbox/data/memory.json"

SANDBOX_SERVICES = [
    "gcz-sandbox-ai",
    "gcz-sandbox-api",
    "gcz-sandbox-bot",
    "gcz-sandbox-redirect",
    "gcz-sandbox-drops",
    "gcz-sandbox-discord",
    "gcz-sandbox-watchdog"
]

# =========================================================
# FASTAPI
# =========================================================
app = FastAPI(title="GCZ Codex — Sandbox GOD MODE (AUTO-HEAL)")


class ChatRequest(BaseModel):
    message: str
    user: str | None = "anonymous"


# =========================================================
# MEMORY
# =========================================================
def memory_get(key):
    if not os.path.exists(MEMORY_FILE):
        return None
    with open(MEMORY_FILE, "r") as f:
        data = json.load(f)
    return data.get(key)


def memory_set(key, value):
    os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
    if os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, "r") as f:
            data = json.load(f)
    else:
        data = {}
    data[key] = value
    with open(MEMORY_FILE, "w") as f:
        json.dump(data, f, indent=2)


# =========================================================
# LOGGING
# =========================================================
def log_event(event, payload):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    entry = {
        "ts": datetime.datetime.utcnow().isoformat(),
        "env": ENV,
        "event": event,
        "payload": payload
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


# =========================================================
# PM2 HELPERS
# =========================================================
def get_pm2():
    out = subprocess.check_output(["pm2", "jlist"]).decode()
    return json.loads(out)


def restart_service(name):
    subprocess.call(["pm2", "restart", name])
    log_event("auto_heal_restart", {"service": name})


# =========================================================
# RISK ENGINE
# =========================================================
def risk_score(service):
    if "bot" in service.lower():
        return 3
    if "api" in service.lower():
        return 5
    return 2


# =========================================================
# SELF HEAL LOOP
# =========================================================
stop_flag = Event()


def self_heal_loop():
    while not stop_flag.is_set():
        try:
            pm2 = get_pm2()

            for proc in pm2:
                name = proc.get("name")
                status = proc.get("pm2_env", {}).get("status")
                restarts = proc.get("pm2_env", {}).get("restart_time", 0)

                if name not in SANDBOX_SERVICES:
                    continue

                if status != "online":
                    restart_service(name)

                if restarts > 20:
                    restart_service(name)

        except Exception as e:
            log_event("heal_error", {"error": str(e)})

        time.sleep(WATCH_INTERVAL)


Thread(target=self_heal_loop, daemon=True).start()


# =========================================================
# ROUTES
# =========================================================
@app.get("/health")
async def health():
    return {"status": "ok", "env": ENV, "healing": SELF_HEAL_ENABLED}


@app.post("/chat")
async def chat(req: ChatRequest):
    txt = req.message.lower()

    if "status" in txt:
        return {"reply": "System healthy. Auto-healing is active."}

    if "who" in txt:
        return {"reply": "I am GCZ Codex — Autonomous Ops AI."}

    return {"reply": "Message received. I am monitoring."}


@app.get("/codex/audit")
async def audit():
    try:
        pm2 = get_pm2()
        ports = subprocess.check_output(["ss", "-lntp"]).decode()

        audit = {
            "pm2": pm2,
            "ports": ports
        }

        log_event("audit", audit)
        return {"status": "ok", "audit": audit}

    except Exception as e:
        log_event("audit_error", {"error": traceback.format_exc()})
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"msg": "GCZ Codex Sandbox AI — GOD MODE AUTO-HEAL"}


@app.on_event("shutdown")
def shutdown():
    stop_flag.set()
