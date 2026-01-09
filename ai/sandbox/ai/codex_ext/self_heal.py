import subprocess, json, time
from .telegram_bridge import send
from . import state

WATCH = ["gcz-sandbox-api","gcz-sandbox-bot","gcz-sandbox-ai"]

def pm2():
    data = subprocess.check_output(["pm2","jlist"]).decode()
    return json.loads(data)

def heal():
    for p in pm2():
        name = p["name"]
        status = p["pm2_env"]["status"]

        if name not in WATCH:
            continue

        if status != "online":
            subprocess.call(["pm2","restart",name])

            msg = f"Healed service: {name} (status={status})"
            send(msg)
            state.log("heal", {"service":name,"status":status})

def loop():
    while True:
        try:
            heal()
        except Exception as e:
            state.log("heal_error",{"error":str(e)})
        time.sleep(10)
