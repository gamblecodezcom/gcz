import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const env = (process.env.GCZ_ENV || "production").toLowerCase();

if (env !== "sandbox") {
  console.log("[promo-intel] skip (env not sandbox)");
  process.exit(0);
}

const stampPath = path.resolve("ai/sandbox/logs/promo_intel_last_run.txt");
const now = Date.now();
const monthMs = 30 * 24 * 60 * 60 * 1000;

let shouldRun = true;
if (fs.existsSync(stampPath)) {
  const last = fs.statSync(stampPath).mtimeMs;
  shouldRun = now - last >= monthMs;
}

if (!shouldRun) {
  console.log("[promo-intel] already ran this month");
  process.exit(0);
}

try {
  execSync("python3 ai/sandbox/promo_intel_scan.py", { stdio: "inherit" });
  fs.mkdirSync(path.dirname(stampPath), { recursive: true });
  fs.writeFileSync(stampPath, new Date().toISOString());
  console.log("[promo-intel] complete");
} catch (err) {
  console.error("[promo-intel] failed", err);
  process.exit(1);
}
