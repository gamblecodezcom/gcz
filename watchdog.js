import http from "http";
import { execSync } from "child_process";

function checkHealth(url, label) {
  const req = http.get(url, { timeout: 5000 }, (res) => {
    if (res.statusCode !== 200) {
      console.error(`[${new Date().toISOString()}] [${label}] Unhealthy (${res.statusCode}), restarting...`);
      try {
        execSync(`pm2 restart ${label}`, { stdio: 'inherit' });
      } catch (err) {
        console.error(`[${label}] Failed to restart:`, err.message);
      }
    } else {
      console.log(`[${new Date().toISOString()}] [${label}] OK`);
    }
  });
  
  req.on("error", (err) => {
    console.error(`[${new Date().toISOString()}] [${label}] DOWN: ${err.message}`);
    try {
      execSync(`pm2 restart ${label}`, { stdio: 'inherit' });
    } catch (restartErr) {
      console.error(`[${label}] Failed to restart:`, restartErr.message);
    }
  });
  
  req.on("timeout", () => {
    console.error(`[${new Date().toISOString()}] [${label}] Timeout, restarting...`);
    req.destroy();
    try {
      execSync(`pm2 restart ${label}`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`[${label}] Failed to restart:`, err.message);
    }
  });
}

checkHealth("http://localhost:3000/api/health", "gcz-api");

