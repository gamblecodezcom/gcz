from fastapi import APIRouter
import subprocess
import json
import os

router = APIRouter()

def run(cmd):
    return subprocess.check_output(
        cmd, shell=True, text=True, stderr=subprocess.STDOUT
    )

@router.post("/exec")
async def codex_exec(payload: dict):
    q = payload.get("input","").lower()

    if "status" in q or "check" == q:
        out = run("pm2 ls")
        return {"ok": True, "reply": f"PM2 STATUS:\n{out}"}

    if "restart" in q and "sandbox" in q and "bot" in q:
        run("pm2 restart gcz-sandbox-bot")
        return {"ok": True, "reply": "Sandbox bot restarted."}

    return {"ok": True, "reply": f"I heard: {q}\n(No handler matched yet)"}
