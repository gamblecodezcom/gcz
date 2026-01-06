import os, json, requests, subprocess, logging, sys, time

LOG="/var/www/html/gcz/logs/ai_healthcheck.log"
logging.basicConfig(filename=LOG, level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

ok=True
env=os.getenv("GCZ_ENV","production")


############################################
# HTTP HEALTH
############################################
urls=[]
try:
    urls=json.load(open("/var/www/html/gcz/auto-dev.health.json")).get("urls",[])
except Exception:
    pass

for u in urls:
    try:
        r=requests.get(u,timeout=4)
        if r.status_code!=200:
            ok=False
    except Exception:
        ok=False


############################################
# PM2 CHECK
############################################
pm2=subprocess.getoutput("pm2 jlist")
critical=["gcz-api","gcz-redirect","gcz-drops","gcz-ai"]
if env!="production":
    critical=[c.replace("gcz-","gcz-sandbox-") for c in critical]

for c in critical:
    if c not in pm2:
        ok=False


############################################
# TELEGRAM BOT CHECK
############################################
def telegram_ok():
    token=os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        return True
    try:
        r=requests.get(f"https://api.telegram.org/bot{token}/getMe",timeout=5)
        return r.status_code==200 and r.json().get("ok") is True
    except Exception:
        return False

if not telegram_ok():
    ok=False


############################################
# DISCORD — READ ONLY CHECK
############################################
# RULES:
# - verify bot identity only
# - verify server membership only
# - verify channel exists only
# - NEVER send messages

def discord_ok():
    token=os.getenv("DISCORD_BOT_TOKEN")
    guild=os.getenv("DISCORD_SERVER_ID")
    chan=os.getenv("DISCORD_SC_LINKS_CHANNEL_ID")

    if not token:
        return True

    headers={"Authorization":f"Bot {token}"}

    # 1) validate bot identity
    try:
        me=requests.get("https://discord.com/api/v10/users/@me",headers=headers,timeout=5)
        if me.status_code!=200:
            return False
    except Exception:
        return False

    # no guild? stop here
    if not guild:
        return True

    # 2) verify guild membership
    try:
        guild_resp=requests.get(f"https://discord.com/api/v10/guilds/{guild}",headers=headers,timeout=5)
        if guild_resp.status_code not in (200,204):
            return False
    except Exception:
        return False

    # 3) verify channel exists (read-only)
    if chan:
        try:
            ch=requests.get(f"https://discord.com/api/v10/channels/{chan}",headers=headers,timeout=5)
            if ch.status_code not in (200,204):
                return False
        except Exception:
            return False

    return True


if not discord_ok():
    ok=False


logging.info(f"Health status: {ok} env={env}")
sys.exit(0 if ok else 1)
