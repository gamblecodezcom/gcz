
import fetch from "node-fetch";
import { exec } from "child_process";

setInterval(async () => {
  try {
    const r = await fetch("http://127.0.0.1:3000/health");
    if (!r.ok) throw new Error("node down");
  } catch {
    exec("pm2 restart gcz-api");
  }
  try {
    const r = await fetch("http://127.0.0.1:8000/health");
    if (!r.ok) throw new Error("redirect down");
  } catch {
    exec("pm2 restart gcz-redirect");
  }
}, 300000);
