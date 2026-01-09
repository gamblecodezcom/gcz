import fs from "fs";
import { acquireLock, releaseLock } from "./lock.js";
import { execSync } from "child_process";

if (!acquireLock()) {
  console.log("[daily] already running");
  process.exit(0);
}

try {
  execSync("node jobs/reconcile.js", { stdio: "inherit" });
  execSync("node jobs/warmup.js", { stdio: "inherit" });
  if ((process.env.GCZ_ENV || "production").toLowerCase() === "sandbox") {
    execSync("node jobs/promoIntel.js", { stdio: "inherit" });
  }

  fs.mkdirSync("logs", { recursive: true });
  fs.writeFileSync("logs/last_daily.txt", new Date().toISOString());

  console.log("[daily] complete");
} catch (err) {
  console.error("[daily] failed", err);
} finally {
  releaseLock();
}
