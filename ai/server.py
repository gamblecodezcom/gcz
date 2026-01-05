from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from ai.ai_logger import get_logger, set_trace_id
from ai.config.loader import build_settings
from ai.db import DB
from ai.health_engine import run_health_scan
from ai.memory_store import add_memory
from ai.memory_monitor import HealthMonitor
from ai.tools.ai_clients import AIClient
from ai.workflows.engine import WorkflowEngine

logger = get_logger("gcz-ai.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    repo_root = Path(__file__).resolve().parents[1]
    settings = build_settings(repo_root)

    app.state.settings = settings
    app.state.ai_client = AIClient(settings)
    app.state.monitor = HealthMonitor(interval=settings.monitor_interval)
    app.state.workflow_engine = WorkflowEngine(app.state.ai_client)

    db_ready = await DB.init()
    if db_ready:
        await app.state.workflow_engine.ensure_tables()
    else:
        logger.error("DB unavailable at startup; continuing without DB tables")
    await app.state.monitor.start()
    await app.state.workflow_engine.start()

    logger.info("GCZ AI Engine startup complete", extra={"port": settings.ai_port})
    try:
        yield
    finally:
        await app.state.workflow_engine.stop()
        await app.state.monitor.stop()
        await app.state.ai_client.close()
        await DB.close()
        logger.info("GCZ AI Engine shutdown complete")


app = FastAPI(title="GCZ AI Engine", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def trace_middleware(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-Id") or str(uuid4())
    set_trace_id(trace_id)
    response = await call_next(request)
    response.headers["X-Trace-Id"] = trace_id
    return response


@app.get("/status")
async def status() -> Dict[str, Any]:
    return {"ok": True, "service": "gcz-ai", "version": app.version}


@app.get("/health")
async def health() -> Dict[str, Any]:
    return await run_health_scan()


@app.post("/memory")
async def store_memory(payload: Dict[str, Any]):
    ok = await add_memory(
        payload.get("category"),
        payload.get("message"),
        payload.get("source", "api"),
        payload.get("meta") or {},
    )
    return {"ok": bool(ok)}


@app.post("/jobs")
async def enqueue_job(payload: Dict[str, Any]):
    job_type = payload.get("job_type")
    job_payload = payload.get("payload", {})
    if not job_type:
        return {"ok": False, "error": "job_type is required"}
    job_id = await app.state.workflow_engine.enqueue_job(job_type, job_payload)
    return {"ok": True, "job_id": job_id}


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = await app.state.workflow_engine.get_job(job_id)
    if not job:
        return {"ok": False, "error": "job not found"}
    return {"ok": True, "job": job}


@app.post("/workflows/ai-generate")
async def workflow_ai_generate(payload: Dict[str, Any]):
    job_id = await app.state.workflow_engine.enqueue_job("ai_generate", payload)
    return {"ok": True, "job_id": job_id}


@app.post("/workflows/health-scan")
async def workflow_health(payload: Dict[str, Any]):
    job_id = await app.state.workflow_engine.enqueue_job("health_scan", payload)
    return {"ok": True, "job_id": job_id}
