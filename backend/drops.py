#!/usr/bin/env python3

import csv
import asyncio
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from logger import get_logger

CSV_PATH = "/var/www/html/gcz/master_affiliates.csv"
REFRESH_SECONDS = 60

app = FastAPI(title="GambleCodez Drops Engine")
logger = get_logger("gcz-drops")

DROPS: List[Dict[str, Any]] = []
DROPS_BY_CATEGORY: Dict[str, List[Dict[str, Any]]] = {}


def normalize(s: str | None) -> str:
    if not s:
        return "unknown"
    return s.lower().strip().replace(" ", "")


def load_drops_sync():
    """Load drops from the master affiliates CSV (sync, safe)."""
    new_list = []
    new_categories = {}

    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                # Validate required fields
                if not row.get("name") or not row.get("affiliate_url"):
                    logger.warning(f"[drops] Skipping invalid row: {row}")
                    continue

                entry = {
                    "name": row.get("name"),
                    "url": row.get("affiliate_url"),
                    "category": row.get("category"),
                    "level": row.get("level"),
                    "icon": row.get("icon_url"),
                    "bonus_code": row.get("bonus_code"),
                    "bonus_description": row.get("bonus_description"),
                }

                new_list.append(entry)

                cat = normalize(row.get("category"))
                new_categories.setdefault(cat, []).append(entry)

        logger.info(
            f"[drops] Loaded {len(new_list)} drops across {len(new_categories)} categories"
        )

        return new_list, new_categories

    except Exception as e:
        logger.error(f"[drops] ERROR loading CSV: {e}")
        return [], {}


async def refresh_loop():
    """Async background refresher."""
    global DROPS, DROPS_BY_CATEGORY

    while True:
        drops, categories = await asyncio.to_thread(load_drops_sync)
        DROPS = drops
        DROPS_BY_CATEGORY = categories
        await asyncio.sleep(REFRESH_SECONDS)


@app.on_event("startup")
async def startup_event():
    """Load once and start async refresher."""
    global DROPS, DROPS_BY_CATEGORY

    drops, categories = await asyncio.to_thread(load_drops_sync)
    DROPS = drops
    DROPS_BY_CATEGORY = categories

    asyncio.create_task(refresh_loop())


# ------------------------------------------------------------
# HEALTH ENDPOINT
# ------------------------------------------------------------

@app.get("/api/drops/health")
def drops_health():
    return {"status": "ok", "count": len(DROPS)}


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
    import random
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
    top = [d for d in DROPS if d.get("level", "").lower() == "top"]
    return JSONResponse(content=top)
