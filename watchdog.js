import http from "http";
import { execSync } from "child_process";

const CHECK_INTERVAL = 30000; // 30s
const FAILURE_THRESHOLD = 3;  // 3 strikes
const COOLDOWN = 120000;      // 2 minutes

const SERVICES = [
  { label: "gcz-api",      url: "http://127.0.0.1:3000/api/health" },
  { label: "gcz-redirect", url: "http://127.0.0.1:8000/health" },
  { label: "gcz-drops",    url: "http://127.0.0.1:8002/api/drops/health" },
  { label: "gcz-bot",      url: "http://127.0.0.1:3001/health" },
  { label: "gcz-discord",  url: "http://127.0.0.1:3002/health" }
];

const state = {};

for (const s of SERVICES) {
  state[s.label] = {
    fails: 0,
    lastRestart: 0,
    lastStatus: "unknown",
  };
}

function log(label, msg) {
  console.log(`[${new Date().toISOString()}] [${label}] ${msg}`);
}

function checkHealth(url, label) {
  const req = http.get(url, { timeout: 8000 }, (res) => {
    if (res.statusCode === 200) {
      if (state[label].lastStatus !== "up") {
        log(label, "HEALTHY again");
      }
      state[label].fails = 0;
      state[label].lastStatus = "up";
    } else {
      registerFailure(label, `HTTP ${res.statusCode}`);
    }
  });

  req.on("error", (err) => {
    registerFailure(label, err.message);
  });

  req.on("timeout", () => {
    req.destroy();
    registerFailure(label, "TIMEOUT");
  });
}

function registerFailure(label, reason) {
  const svc = state[label];
  svc.fails++;
  svc.lastStatus = "down";

  log(label, `failure ${svc.fails}/${FAILURE_THRESHOLD}: ${reason}`);

  if (svc.fails < FAILURE_THRESHOLD) return;

  const now = Date.now();

  if (now - svc.lastRestart < COOLDOWN) {
    log(label, "restart suppressed (cooldown)");
    return;
  }

  restart(label);
  svc.lastRestart = now;
  svc.fails = 0;
}

function restart(label) {
  try {
    log(label, "RESTARTING SERVICE…");
    execSync(`pm2 restart ${label}`, { stdio: "inherit" });
    log(label, "restart complete");
  } catch (err) {
    log(label, `restart failed: ${err.message}`);
  }
}

function runChecks() {
  for (const svc of SERVICES) checkHealth(svc.url, svc.label);
}

setInterval(runChecks, CHECK_INTERVAL);
runChecks();
