#!/usr/bin/env python3
import os, json, requests, subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

# ========= Environment =========
ENV = os.environ.get("GCZ_ENV", "sandbox").strip().lower()

if ENV not in ("sandbox", "production"):
    raise RuntimeError(f"Invalid GCZ_ENV: {ENV}")

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")

if not TOKEN:
    raise RuntimeError("Missing TELEGRAM_BOT_TOKEN")

BOT_API = f"https://api.telegram.org/bot{TOKEN}"

# ========= Routing =========
CALLBACK_HANDLER = (
    "/var/www/html/gcz/ai/gcz-prod/ai/callback-handler.js"
    if ENV == "production"
    else "/var/www/html/gcz/ai/sandbox/ai/callback-handler.js"
)

PORT = 9098 if ENV == "production" else 9099


def reply(chat, text):
    try:
        requests.post(
            f"{BOT_API}/sendMessage",
            json={"chat_id": chat, "text": text},
            timeout=5
        )
    except Exception as e:
        print(f"[{ENV}] Reply failed:", e)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers["content-length"])
            update = json.loads(self.rfile.read(length))

            if "callback_query" in update:
                data = update["callback_query"]["data"]
                chat = update["callback_query"]["message"]["chat"]["id"]

                subprocess.run(
                    ["node", CALLBACK_HANDLER, data],
                    check=False
                )

                reply(chat, f"[{ENV.upper()}] Action received: {data}")

            self.send_response(200)
            self.end_headers()

        except Exception as e:
            print(f"[{ENV}] ERROR:", e)
            self.send_response(500)
            self.end_headers()


print(f"[GCZ TELEGRAM WEBHOOK] ENV={ENV} PORT={PORT}")
HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
