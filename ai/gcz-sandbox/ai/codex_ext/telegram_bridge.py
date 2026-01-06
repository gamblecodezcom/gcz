import os
import requests
from fastapi import Request
from . import state

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN_SANDBOX")
ADMIN = os.getenv("TELEGRAM_ADMIN_ID")

API = f"https://api.telegram.org/bot{TOKEN}"

def send(msg):
    if not TOKEN or not ADMIN:
        return
    requests.post(f"{API}/sendMessage",
                  json={"chat_id": ADMIN, "text": msg})

async def handle_update(req: Request):
    data = await req.json()

    msg = data.get("message", {})
    text = msg.get("text", "")
    uid = msg.get("from", {}).get("id")

    if not text or str(uid) != str(ADMIN):
        return {"ok": True}

    text_l = text.lower().strip()

    if "status" in text_l:
        reply = "GCZ Sandbox Codex: All systems nominal."
    elif "ping" in text_l:
        reply = "pong"
    else:
        reply = f"Command registered: {text}"

    send(reply)
    state.log("telegram_chat", {"text": text, "reply": reply})

    return {"ok": True}
