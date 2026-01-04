#!/usr/bin/env python3

import csv
import asyncio
import re
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from backend.logger import get_logger

CSV_PATH = "/var/www/html/gcz/master_affiliates.csv"
REFRESH_SECONDS = 60

app = FastAPI(title="GambleCodez Redirect Engine")
logger = get_logger("gcz-redirect")

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
                    logger.warning(f"[redirect] Skipping invalid row: {row}")
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

        logger.info(f"[redirect] Map refreshed: {len(new_map)} entries")
        return new_map

    except Exception as e:
        logger.error(f"[redirect] ERROR loading CSV: {e}")
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


# ------------------------------------------------------------
# HEALTH ENDPOINT
# ------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "entries": len(REDIRECT_MAP)}


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
