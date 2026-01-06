#!/usr/bin/env python3
import os, json, requests, subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

BOT=os.environ.get("TELEGRAM_BOT_TOKEN_SANDBOX")
ADMIN="6668510825"
URL=f"https://api.telegram.org/bot{BOT}"

def reply(chat,text):
  requests.post(f"{URL}/sendMessage",json={"chat_id":chat,"text":text})

class H(BaseHTTPRequestHandler):
  def do_POST(self):
    l=int(self.headers['content-length'])
    update=json.loads(self.rfile.read(l))

    if "callback_query" in update:
      data=update["callback_query"]["data"]
      chat=update["callback_query"]["message"]["chat"]["id"]
      subprocess.run(["node","/var/www/html/gcz/ai/gcz-sandbox/ai/callback-handler.js",data])
      reply(chat,f"Action received: {data}")
    self.send_response(200); self.end_headers()

HTTPServer(("0.0.0.0",9099),H).serve_forever()
