import os
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import fetchall, execute
from memory_store import add_memory
from health_engine import run_health_scan
from memory_monitor import start_monitor
from ai_logger import get_logger

logger = get_logger("gcz-ai.server")

PORT = int(os.getenv("AI_PORT", "8010"))

app = FastAPI(title="GCZ AI Engine", version="1.0.0")

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------
# INIT: DB TABLES
# ------------------------------------------------------------
def _init_tables():
    logger.info("Initializing AI DB tables...")

    execute(
        """
        CREATE TABLE IF NOT EXISTS ai_memory (
            id SERIAL PRIMARY KEY,
            category TEXT,
            message TEXT,
            source TEXT,
            meta JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """
    )

    execute(
        """
        CREATE TABLE IF NOT EXISTS service_health (
            id SERIAL PRIMARY KEY,
            service TEXT,
            status TEXT,
            details JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """
    )

    execute(
        """
        CREATE TABLE IF NOT EXISTS anomalies (
            id SERIAL PRIMARY KEY,
            type TEXT,
            message TEXT,
            meta JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """
    )

    logger.info("AI DB tables ready.")


@app.on_event("startup")
def on_startup():
    _init_tables()
    start_monitor()  # background health monitor
    logger.info(f"GCZ AI Engine startup complete on port {PORT}")


# ------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------
@app.post("/memory")
def store_memory(payload: Dict[str, Any]):
    try:
        add_memory(
            payload.get("category"),
            payload.get("message"),
            payload.get("source", "cli"),
            payload.get("meta") or {},
        )
        return {"ok": True}
    except Exception as e:
        logger.error(f"/memory error: {e}")
        return {"error": "failed"}


@app.get("/memory")
def list_memory(limit: int = 200):
    try:
        rows = fetchall(
            "SELECT * FROM ai_memory ORDER BY created_at DESC LIMIT %s",
            [limit],
        )
        return rows
    except Exception as e:
        logger.error(f"/memory query error: {e}")
        return {"error": "failed"}


@app.get("/health")
def list_health(limit: int = 200):
    try:
        rows = fetchall(
            "SELECT * FROM service_health ORDER BY created_at DESC LIMIT %s",
            [limit],
        )
        return rows
    except Exception as e:
        logger.error(f"/health query error: {e}")
        return {"error": "failed"}


@app.get("/anomalies")
def list_anomalies(limit: int = 200):
    try:
        rows = fetchall(
            "SELECT * FROM anomalies ORDER BY created_at DESC LIMIT %s",
            [limit],
        )
        return rows
    except Exception as e:
        logger.error(f"/anomalies query error: {e}")
        return {"error": "failed"}


@app.post("/scan")
def scan():
    try:
        result = run_health_scan()
        return {"ok": True, "result": result}
    except Exception as e:
        logger.error(f"/scan error: {e}")
        return {"error": "failed"}


@app.get("/status")
def status():
    return {
        "ok": True,
        "service": "gcz-ai",
        "port": PORT,
    }