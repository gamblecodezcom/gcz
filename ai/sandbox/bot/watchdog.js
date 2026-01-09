import fetch from "node-fetch";
import { log } from "./utils/logger.js";
import { exec } from "child_process";

const SERVICES = [
  { name: "gcz-api", url: "http://127.0.0.1:8000/health" },
  { name: "gcz-redirect", url: "http://127.0.0.1:8001/health" },
  { name: "gcz-drops", url: "http://127.0.0.1:8002/api/drops/health" },
  { name: "gcz-bot", url: "http://127.0.0.1:3000/health" },
  { name: "gcz-discord", url: "http://127.0.0.1:3002/health" }
];

function restart(name) {
  exec(`pm2 restart ${name}`, (err) => {
    if (err) log("watchdog", `Failed to restart ${name}`, err);
    else log("watchdog", `Restarted ${name}`);
  });
}

async function checkService(service) {
  try {
    const res = await fetch(service.url, { timeout: 3000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    log("watchdog", `[${service.name}] HEALTHY`);
  } catch (err) {
    log("watchdog", `[${service.name}] DOWN`, err);
    restart(service.name);
  }
}

async function run() {
  for (const svc of SERVICES) {
    await checkService(svc);
  }
}

log("watchdog", "GCZ Watchdog started");
setInterval(run, 30_000);
run();