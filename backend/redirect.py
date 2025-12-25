
from fastapi import APIRouter
import os, sys

CSV_PATH = "master_affiliates.csv"
if not os.path.exists(CSV_PATH):
    print("[FATAL] master_affiliates.csv missing")
    sys.exit(1)

router = APIRouter()

@router.get("/affiliates/redirect/{name}")
def redirect(name: str):
    return {"url": "https://example.com", "icon": None}
