#!/usr/bin/env python3

import csv
import asyncio
import re
import time
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse

from backend.logging_config import (
    RequestContextMiddleware,
    configure_logging,
    get_request_id,
)

CSV_PATH = "/var/www/html/gcz/master_affiliates.csv"
REFRESH_SECONDS = 60

logger = configure_logging("gcz-redirect")

app = FastAPI(title="GambleCodez Redirect Engine")
app.state.started_at = time.time()
app.add_middleware(RequestContextMiddleware, logger=logger)

REDIRECT_MAP: Dict[str, Dict[str, Any]] = {}


def normalize(name: str | None) -> str:
    if not name:
        return ""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def load_redirects_sync():
    """Load CSV into in-memory redirect map (sync, safe)."""
    new_map = {}

    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                if not row.get("name") or not row.get("affiliate_url"):
                    logger.warning("redirects.invalid_row", extra={"row": row})
                    continue

                key = normalize(row["name"])

                icon = row.get("icon_url") or (
                    f"https://www.google.com/s2/favicons?sz=256&domain={row.get('resolved_domain')}"
                    if row.get("resolved_domain")
                    else None
                )

                new_map[key] = {
                    "url": row.get("affiliate_url"),
                    "icon": icon,
                    "level": row.get("level"),
                }

        logger.info("redirects.loaded", extra={"entries": len(new_map)})
        return new_map

    except Exception:
        logger.exception("redirects.load_failed")
        return {}


async def refresh_loop():
    """Async background refresher."""
    global REDIRECT_MAP

    while True:
        REDIRECT_MAP = await asyncio.to_thread(load_redirects_sync)
        await asyncio.sleep(REFRESH_SECONDS)


@app.on_event("startup")
async def startup_event():
    """Load once and start async refresher."""
    global REDIRECT_MAP

    REDIRECT_MAP = await asyncio.to_thread(load_redirects_sync)
    asyncio.create_task(refresh_loop())


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


# ------------------------------------------------------------
# HEALTH ENDPOINT
# ------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "gcz-redirect",
        "entries": len(REDIRECT_MAP),
        "uptime_s": int(time.time() - app.state.started_at),
    }


@app.get("/api/health")
def health_api():
    return {
        "status": "ok",
        "service": "gcz-redirect",
        "entries": len(REDIRECT_MAP),
        "uptime_s": int(time.time() - app.state.started_at),
    }


# ------------------------------------------------------------
# REDIRECT ENDPOINTS
# ------------------------------------------------------------

@app.get("/redirect/{sitename}")
@app.get("/affiliates/redirect/{sitename}")
def do_redirect(sitename: str):
    key = normalize(sitename)
    if key in REDIRECT_MAP:
        return RedirectResponse(REDIRECT_MAP[key]["url"])
    raise HTTPException(status_code=404, detail="Affiliate not found")


# ------------------------------------------------------------
# META ENDPOINTS
# ------------------------------------------------------------

@app.get("/meta/{sitename}")
@app.get("/affiliates/meta/{sitename}")
def get_meta(sitename: str):
    key = normalize(sitename)
    if key in REDIRECT_MAP:
        return JSONResponse(content=REDIRECT_MAP[key])
    raise HTTPException(status_code=404, detail="Not found")


# ------------------------------------------------------------
# RUN SERVER
# ------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.redirect:app", host="0.0.0.0", port=8000)
