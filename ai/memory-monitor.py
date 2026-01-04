import os from "os";
import { execSync } from "child_process";
import { addMemory, logHealth, logAnomaly } from "./memory-store.js";

const SERVICES = [
  "gcz-api",
  "gcz-redirect",
  "gcz-drops",
  "gcz-bot",
  "gcz-discord",
  "gcz-watchdog"
];

export function runHealthScan() {
  SERVICES.forEach(service => {
    try {
      const output = execSync(`pm2 show ${service}`).toString();

      const cpu = parseFloat(output.match(/CPU\s+(\d+\.?\d*)/)?.[1] || 0);
      const mem = parseFloat(output.match(/memory\s+(\d+)/i)?.[1] || 0);

      logHealth(service, "online", cpu, mem);

      if (cpu > 50) {
        logAnomaly("High CPU", `${service} CPU ${cpu}%`, { level: "high" });
      }

    } catch (err) {
      logHealth(service, "offline", 0, 0);
      logAnomaly("Service Down", `${service} unreachable`, { level: "critical" });
    }
  });

  addMemory("system", "Health scan completed", "health-engine");
}
