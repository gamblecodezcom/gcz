import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.promos import router as promos_router

from backend.logging_config import (
    RequestContextMiddleware,
    configure_logging,
    get_request_id,
)

logger = configure_logging("gcz-api")

app = FastAPI(
    title="GambleCodez API",
    version="1.0.0",
    description="FastAPI backend for GambleCodez",
)
app.state.started_at = time.time()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Observability
app.add_middleware(RequestContextMiddleware, logger=logger)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "unhandled.exception",
        extra={"method": request.method, "path": request.url.path},
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "request_id": get_request_id()},
    )


# Health check
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "gcz-api",
        "uptime_s": int(time.time() - app.state.started_at),
    }


@app.get("/health")
async def health_root():
    return {
        "status": "ok",
        "service": "gcz-api",
        "uptime_s": int(time.time() - app.state.started_at),
    }


# Routers
app.include_router(promos_router, prefix="/api/promos")
