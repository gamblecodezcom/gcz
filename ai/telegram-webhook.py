from fastapi import FastAPI, Request
import os
import httpx

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ADMIN = os.environ.get("TELEGRAM_ADMIN_ID","")

API = f"https://api.telegram.org/bot{TOKEN}"

app = FastAPI()

@app.get("/health")
async def health():
    return {"status":"ok","env":"production","webhook":True}

@app.post("/telegram/bot")
async def webhook(request: Request):
    update = await request.json()

    async with httpx.AsyncClient() as client:
        await client.post(f"{API}/sendMessage", json={
            "chat_id": ADMIN,
            "text": f"📥 Incoming webhook:\n\n{update}"
        })

    return {"ok":True}
