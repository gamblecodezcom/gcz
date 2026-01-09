import os, json, datetime

LOG = "/var/log/gcz/codex_sandbox_log.jsonl"

def log(event, payload):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG,"a") as f:
        f.write(json.dumps({
            "ts": datetime.datetime.utcnow().isoformat(),
            "event": event,
            "payload": payload
        })+"\n")
