#!/usr/bin/env python3

import re
import csv
import time
import threading
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse

CSV_PATH = "/var/www/html/gcz/master_affiliates.csv"
REFRESH_SECONDS = 60

app = FastAPI(title="GambleCodez Redirect Engine")

REDIRECT_MAP: Dict[str, Dict[str, Any]] = {}

def normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())

def load_redirects():
    """Load CSV into in-memory redirect map."""
    global REDIRECT_MAP
    new_map = {}

    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = normalize(row["name"])
                icon = row["icon_url"] or (
                    f"https://www.google.com/s2/favicons?sz=256&domain={row['resolved_domain']}"
                    if row.get("resolved_domain")
                    else None
                )
                new_map[key] = {
                    "url": row["affiliate_url"],
                    "icon": icon,
                    "level": row["level"],
                }

        REDIRECT_MAP = new_map
        print(f"[redirect] Map refreshed: {len(REDIRECT_MAP)} entries")

    except Exception as e:
        print(f"[redirect] ERROR loading CSV: {e}")

# ------------------------------------------------------------
# HEALTH ENDPOINT (Master Ops uses this)
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

# ------------------------------------------------------------
# BACKGROUND REFRESHER
# ------------------------------------------------------------

def refresher():
    while True:
        load_redirects()
        time.sleep(REFRESH_SECONDS)

# Load once before serving
load_redirects()

# Start background refresh thread
threading.Thread(target=refresher, daemon=True).start()

# ------------------------------------------------------------
# RUN SERVER
# ------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.redirect:app", host="0.0.0.0", port=8000)
