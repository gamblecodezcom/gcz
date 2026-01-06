import subprocess, logging, time, os, requests, smtplib

LOG="/var/www/html/gcz/logs/ai_watchdog.log"
logging.basicConfig(filename=LOG, level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

ENV=os.getenv("GCZ_ENV","production")
PREFIX="gcz-" if ENV=="production" else "gcz-sandbox-"

TARGETS=[PREFIX+x for x in ["api","redirect","drops","ai","bot","discord"]]
FAIL_LIMIT=3
failures={t:0 for t in TARGETS}
ALERTED=set()

############################################
# SECURITY — BLOCK ROOT/SUDO
############################################
if os.geteuid()==0:
    logging.error("Refusing to run as root")
    raise SystemExit(1)


############################################
# ALERTING
############################################
SLACK=os.getenv("SLACK_WEBHOOK_URL")
MAIL=os.getenv("MAIL_TO_CONTACT")
FROM=os.getenv("MAIL_FROM","noreply@example.com")

def notify(msg):
    logging.warning(msg)

    if SLACK:
        try: requests.post(SLACK,json={"text":msg},timeout=4)
        except: pass

    if MAIL:
        try:
            s=smtplib.SMTP("localhost")
            s.sendmail(FROM,[MAIL],f"Subject:GCZ Alert\n\n{msg}")
            s.quit()
        except: pass


############################################
# MCP TRIGGER (optional)
############################################
def mcp_trigger():
    try:
        requests.post("http://127.0.0.1:9010/reindex",timeout=3)
    except Exception:
        pass


############################################
# HEALTHCHECK CALL
############################################
def healthy():
    return subprocess.call(["python3","/var/www/html/gcz/ai/ai_healthcheck.py"])==0


############################################
# PM2 HELPERS
############################################
def pm2_running(n):
    return n in subprocess.getoutput("pm2 jlist")

def restart(n):
    subprocess.call(["pm2","restart",n])

def restart_pm2():
    subprocess.call(["pm2","kill"])
    subprocess.call(["pm2","start","/var/www/html/gcz/ecosystem.config.cjs"])


############################################
# MAIN
############################################
def watchdog():
    global ALERTED
    recovered=False

    if not healthy():
        notify(f"Health degraded env={ENV}")
        mcp_trigger()

    for t in TARGETS:
        if not pm2_running(t):
            failures[t]+=1
            if failures[t]>=FAIL_LIMIT:
                notify(f"Restarting {t}")
                restart(t)
                failures[t]=0
                recovered=True
        else:
            failures[t]=0
            if t in ALERTED:
                ALERTED.remove(t)

    if recovered:
        notify("Recovery action triggered")

    if sum(failures.values())>len(TARGETS)*2:
        notify("Entering HA failover mode — restarting PM2")
        restart_pm2()

    logging.info("watchdog cycle complete")


if __name__=="__main__":
    watchdog()
