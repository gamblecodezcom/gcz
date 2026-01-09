import dotenv from "dotenv";
import { log } from "./utils/logger.js";

dotenv.config();

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  API_BASE: "https://gamblecodez.com/api",
  SYSTEM_NAME: "GambleCodez Bot",
  ENV: process.env.NODE_ENV || "production"
};

if (!config.TELEGRAM_BOT_TOKEN) {
  log("config", "❌ TELEGRAM_BOT_TOKEN missing in .env");
  process.exit(1);
}

log("config", `Loaded config for ${config.SYSTEM_NAME}`);
