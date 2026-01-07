import { existsSync, readFileSync } from "node:fs";
import { log } from "./logger.js";

export function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    log(`gcz:env missing env file: ${filePath}`);
    return;
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  log(`gcz:env loaded ${filePath}`);
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    log(`❌ Missing required env: ${name}`);
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}
