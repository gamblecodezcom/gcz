import { log } from "./logger";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    log(`❌ Missing required env: ${name}`);
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}