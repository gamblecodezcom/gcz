#!/usr/bin/env python3
import os, json, time, subprocess, argparse, datetime, requests

parser = argparse.ArgumentParser()
parser.add_argument("--root")
parser.add_argument("--memory")
parser.add_argument("--control")
parser.add_argument("--logs")
args = parser.parse_args()

ROOT = args.root
MEMORY = args.memory
CONTROL = args.control

# FIX: guarantee LOGS is always a valid string path
LOGS = args.logs or "/var/www/html/gcz/logs"
os.makedirs(LOGS, exist_ok=True)

def log(msg):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(f"{LOGS}/ai-devops.log","a") as f:
        f.write(line + "\n")

def load_json(path, default):
    if not path or not os.path.exists(path):
        return default
    try:
        return json.load(open(path))
    except:
        return default

state = load_json(MEMORY,{
    "runs":0,
    "last_status":"boot",
    "service_health":{},
    "sonar_history":[],
    "snyk_history":[],
    "health_fail_count":0
})

# GUARANTEE KEY EXISTS
if "health_fail_count" not in state:
    state["health_fail_count"] = 0

state["runs"] += 1

log("🔍 Loading system control context…")

if CONTROL and os.path.exists(CONTROL):
    control = open(CONTROL).read()
else:
    control = ""

log("🔍 Verifying node deps (non-blocking)…")
subprocess.Popen(["npm","install","--omit=dev"],cwd=ROOT)

def service_exists(name):
    return subprocess.run(
        ["pm2","describe",name],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    ).returncode == 0

expected = [
    "gcz-api",
    "gcz-redirect",
    "gcz-drops",
    "gcz-bot",
    "gcz-discord",
    "gcz-watchdog"
]

for svc in expected:
    if not service_exists(svc):
        log(f"⚠️ Missing service — restarting {svc}")
        subprocess.run(["pm2","restart",svc])

log("🔍 PM2 status sync…")
subprocess.run(["pm2","save"])

# ---- HEALTH CHECK ----
log("🔍 Running health probe…")

urls = [
    "https://gamblecodez.com/health"
]

healthy = True

for url in urls:
    try:
        r = requests.get(url,timeout=5)
        if r.status_code != 200:
            healthy = False
    except:
        healthy = False

if not healthy:
    state["health_fail_count"] += 1
    log("❌ Health degraded")

    if state["health_fail_count"] >= 3:
        log("🛠 Restarting stack (3 consecutive failures)")
        subprocess.run(["pm2","restart","all"])
        state["health_fail_count"] = 0
else:
    log("✅ Health OK")
    state["health_fail_count"] = 0

log("💾 Persisting AI memory…")
json.dump(state,open(MEMORY,"w"),indent=2)

log("✨ AI God Mode Cycle Complete")