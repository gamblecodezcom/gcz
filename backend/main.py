import os
import sys
import time
import json
import asyncio
import subprocess

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse

# Ensure backend root is on PYTHONPATH
BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BACKEND_ROOT)

# ============================
# CONFIG + LOGGER
# ============================
from config import get_settings, load_env
from backend.logger import get_logger
from middleware.rate_limit import rate_limiter

settings = get_settings()
load_env(settings.ENV_FILE)

logger = get_logger("gcz-main")

# ============================
# FASTAPI APP
# ============================
app = FastAPI(
    title="GambleCodez API",
    version="2.0.0",
    description="GambleCodez Backend + AI Control Surface",
)

# ============================
# CORS
# ============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# RATE LIMIT MIDDLEWARE
# ============================
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    return await rate_limiter(request, call_next)

# ============================
# ROUTERS
# ============================
from routes import (
    ai_router,
    promos_router,
    giveaway_router,
    affiliates_router,
    casinos_router,
    redeem_router,
    admin_router,
    profile_router,
    dashboard_router,
    sc_router,
    auth_roles_router,
)

# ============================
# BASE HEALTH
# ============================
@app.get("/api/health")
async def api_health():
    return {"status": "ok"}

# ============================
# AI PATHS
# ============================
AI_ROOT = "/var/www/html/gcz/ai"
AI_HEALTH = os.path.join(AI_ROOT, "health_index.json")
AI_PROJECT_MEMORY = "/var/www/html/gcz/agent-data/project_memory.md"
AI_LOG_DIR = "/var/www/html/gcz/logs"
AI_DASHBOARD = os.path.join(AI_ROOT, "dashboard")

# ============================
# /ai/health
# ============================
@app.get("/ai/health")
async def ai_health():
    try:
        with open(AI_HEALTH, "r") as f:
            data = json.load(f)
        return JSONResponse(data)
    except FileNotFoundError:
        logger.warning("AI health file not found")
        return JSONResponse(
            {"status": "unknown", "error": "health_index.json not found"},
            status_code=404,
        )
    except json.JSONDecodeError as e:
        logger.error(f"AI health JSON decode error: {e}")
        return JSONResponse(
            {"status": "unknown", "error": "invalid JSON in health_index.json"},
            status_code=500,
        )
    except Exception as e:
        logger.error(f"AI health error: {e}")
        return JSONResponse(
            {"status": "unknown", "error": str(e)},
            status_code=500,
        )

# ============================
# /ai/memory
# ============================
@app.get("/ai/memory")
async def ai_memory():
    try:
        with open(AI_PROJECT_MEMORY, "r") as f:
            return PlainTextResponse(f.read())
    except FileNotFoundError:
        return PlainTextResponse("No memory log found", status_code=404)
    except Exception as e:
        logger.error(f"AI memory read error: {e}")
        return PlainTextResponse("Error reading memory log", status_code=500)

# ============================
# /ai/memory/update
# ============================
@app.post("/ai/memory/update")
async def ai_memory_update(request: Request):
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON payload"}, status_code=400)

    message = data.get("entry")
    if not message:
        return JSONResponse({"error": "entry is required"}, status_code=400)

    os.makedirs(os.path.dirname(AI_PROJECT_MEMORY), exist_ok=True)

    try:
        with open(AI_PROJECT_MEMORY, "a") as f:
            f.write(f"\n[{time.ctime()}] {message}\n")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"AI memory update error: {e}")
        return JSONResponse({"error": "Failed to update memory"}, status_code=500)

# ============================
# /ai/logs
# ============================
@app.get("/ai/logs")
async def ai_logs():
    try:
        if not os.path.isdir(AI_LOG_DIR):
            return PlainTextResponse("No logs available", status_code=404)

        files = sorted(
            [os.path.join(AI_LOG_DIR, f) for f in os.listdir(AI_LOG_DIR)],
            key=os.path.getmtime,
            reverse=True,
        )

        if not files:
            return PlainTextResponse("No logs available", status_code=404)

        latest = files[0]
        with open(latest, "r") as f:
            return PlainTextResponse(f.read())

    except Exception as e:
        logger.error(f"AI logs error: {e}")
        return PlainTextResponse("Error reading logs", status_code=500)

# ============================
# /ai/events (SSE)
# ============================
@app.get("/ai/events")
async def ai_events():
    async def event_stream():
        last = ""
        while True:
            try:
                with open(AI_HEALTH, "r") as f:
                    data = f.read()

                if data != last:
                    last = data
                    yield f"data: {data}\n\n"
            except FileNotFoundError:
                yield 'data: {"status":"unknown","error":"health_index.json not found"}\n\n'
            except Exception as e:
                logger.error(f"AI events error: {e}")
                yield 'data: {"status":"unknown","error":"read error"}\n\n'

            await asyncio.sleep(2)

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# ============================
# /ai/controls/status
# ============================
@app.get("/ai/controls/status")
async def pm2_status():
    try:
        result = subprocess.check_output("pm2 jlist", shell=True)
        return JSONResponse(json.loads(result))
    except subprocess.CalledProcessError as e:
        logger.error(f"PM2 status error: {e}")
        return JSONResponse({"error": "Failed to get pm2 status"}, status_code=500)
    except Exception as e:
        logger.error(f"PM2 status unexpected error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

# ============================
# /ai/controls/restart
# ============================
@app.post("/ai/controls/restart")
async def restart_service(request: Request):
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON payload"}, status_code=400)

    name = data.get("service")
    if not name:
        return JSONResponse({"error": "service is required"}, status_code=400)

    try:
        subprocess.check_output(f"pm2 restart {name}", shell=True)
        logger.info(f"Restarted pm2 service: {name}")
        return {"status": "restarted", "service": name}
    except subprocess.CalledProcessError as e:
        logger.error(f"PM2 restart error: {e}")
        return JSONResponse({"error": f"Failed to restart {name}"}, status_code=500)
    except Exception as e:
        logger.error(f"PM2 restart unexpected error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

# ============================
# STATIC AI DASHBOARD
# ============================
if os.path.isdir(AI_DASHBOARD):
    app.mount(
        "/ai/dashboard",
        StaticFiles(directory=AI_DASHBOARD, html=True),
        name="ai-dashboard",
    )

# ============================
# ROUTER REGISTRATION
# ============================
app.include_router(ai_router)
app.include_router(promos_router)
app.include_router(giveaway_router)
app.include_router(affiliates_router)
app.include_router(casinos_router)
app.include_router(redeem_router)
app.include_router(admin_router)
app.include_router(profile_router)
app.include_router(dashboard_router)
app.include_router(sc_router)
app.include_router(auth_roles_router)