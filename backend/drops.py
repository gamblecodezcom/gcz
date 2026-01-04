#!/usr/bin/env python3

import csv
import random
import time
import threading
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from backend.logging_config import (
    RequestContextMiddleware,
    configure_logging,
    get_request_id,
)

CSV_PATH = "/var/www/html/gcz/master_affiliates.csv"
REFRESH_SECONDS = 60

logger = configure_logging("gcz-drops")

app = FastAPI(title="GambleCodez Drops Engine")
app.state.started_at = time.time()
app.add_middleware(RequestContextMiddleware, logger=logger)

DROPS: List[Dict[str, Any]] = []
DROPS_BY_CATEGORY: Dict[str, List[Dict[str, Any]]] = {}


def normalize(s: str) -> str:
    return s.lower().strip().replace(" ", "")


def load_drops():
    """Load drops from the master affiliates CSV."""
    global DROPS, DROPS_BY_CATEGORY

    new_list = []
    new_categories = {}

    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                entry = {
                    "name": row["name"],
                    "url": row["affiliate_url"],
                    "category": row["category"],
                    "level": row["level"],
                    "icon": row["icon_url"],
                    "bonus_code": row["bonus_code"],
                    "bonus_description": row["bonus_description"],
                }

                new_list.append(entry)

                cat = normalize(row["category"])
                if cat not in new_categories:
                    new_categories[cat] = []
                new_categories[cat].append(entry)

        DROPS = new_list
        DROPS_BY_CATEGORY = new_categories

        logger.info(
            "drops.loaded",
            extra={"drops": len(DROPS), "categories": len(DROPS_BY_CATEGORY)},
        )

    except Exception:
        logger.exception("drops.load_failed")


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
# HEALTH ENDPOINT (Master Ops uses this)
# ------------------------------------------------------------

@app.get("/api/drops/health")
def drops_health():
    return {
        "status": "ok",
        "service": "gcz-drops",
        "count": len(DROPS),
        "uptime_s": int(time.time() - app.state.started_at),
    }


@app.get("/health")
def drops_health_root():
    return {
        "status": "ok",
        "service": "gcz-drops",
        "count": len(DROPS),
        "uptime_s": int(time.time() - app.state.started_at),
    }


# ------------------------------------------------------------
# LIST ALL DROPS
# ------------------------------------------------------------

@app.get("/api/drops/list")
def drops_list():
    return JSONResponse(content=DROPS)


# ------------------------------------------------------------
# RANDOM DROP
# ------------------------------------------------------------

@app.get("/api/drops/random")
def drops_random():
    if not DROPS:
        raise HTTPException(status_code=404, detail="No drops available")
    return JSONResponse(content=random.choice(DROPS))


# ------------------------------------------------------------
# CATEGORY FILTER
# ------------------------------------------------------------

@app.get("/api/drops/category/{category}")
def drops_by_category(category: str):
    key = normalize(category)
    if key not in DROPS_BY_CATEGORY:
        raise HTTPException(status_code=404, detail="Category not found")
    return JSONResponse(content=DROPS_BY_CATEGORY[key])


# ------------------------------------------------------------
# TOP PICKS (level-based)
# ------------------------------------------------------------

@app.get("/api/drops/top")
def drops_top():
    top = [d for d in DROPS if d["level"] and d["level"].lower() == "top"]
    return JSONResponse(content=top)


# ------------------------------------------------------------
# BACKGROUND REFRESHER
# ------------------------------------------------------------


def refresher():
    while True:
        load_drops()
        time.sleep(REFRESH_SECONDS)


# Load once before serving
load_drops()

# Start background refresh thread
threading.Thread(target=refresher, daemon=True).start()

# ------------------------------------------------------------
# RUN SERVER
# ------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.drops:app", host="0.0.0.0", port=8002)
