import http from "http";
import { execSync } from "child_process";

const SERVICES = [
  {
    label: "gcz-api",
    url: "http://localhost:3000/api/health",
  },
  {
    label: "gcz-redirect",
    url: "http://localhost:8000/health",
  },
  {
    label: "gcz-drops",
    url: "http://localhost:8002/api/drops/health",
  },
  {
    label: "gcz-bot",
    url: "http://localhost:3000/api/health", // bot has no health route, piggyback API
  },
  {
    label: "gcz-discord",
    url: "http://localhost:3000/api/health", // same here
  },
];

function checkHealth(url, label) {
  const req = http.get(url, { timeout: 5000 }, (res) => {
    if (res.statusCode !== 200) {
      console.error(`[${new Date().toISOString()}] [${label}] Unhealthy (${res.statusCode}), restarting...`);
      restart(label);
    } else {
      console.log(`[${new Date().toISOString()}] [${label}] OK`);
    }
  });

  req.on("error", (err) => {
    console.error(`[${new Date().toISOString()}] [${label}] DOWN: ${err.message}`);
    restart(label);
  });

  req.on("timeout", () => {
    console.error(`[${new Date().toISOString()}] [${label}] TIMEOUT, restarting...`);
    req.destroy();
    restart(label);
  });
}

function restart(label) {
  try {
    execSync(`pm2 restart ${label}`, { stdio: "inherit" });
  } catch (err) {
    console.error(`[${label}] Failed to restart: ${err.message}`);
  }
}

function runChecks() {
  for (const svc of SERVICES) {
    checkHealth(svc.url, svc.label);
  }
}

// Run every 30 seconds
setInterval(runChecks, 30000);

// Run immediately on start
runChecks();
