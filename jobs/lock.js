
import fs from "fs";

const LOCK_FILE = "/tmp/gcz_daily.lock";

export function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) return false;
  fs.writeFileSync(LOCK_FILE, process.pid.toString());
  return true;
}

export function releaseLock() {
  if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
}
