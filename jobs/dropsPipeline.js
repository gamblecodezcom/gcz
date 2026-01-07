import { Telegraf } from "telegraf";
import { acquireNamedLock, releaseNamedLock } from "./lock.js";
import { initializeTelegramBot } from "../services/promoTelegram.js";
import { processApprovedPromos } from "../services/dropsPipeline.js";
import logger from "../utils/logger.js";

const LOCK_NAME = "gcz_drops_pipeline";

async function runOnce() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn("drops-pipeline", "TELEGRAM_BOT_TOKEN missing; skipping run");
    return;
  }

  const dryRun =
    process.argv.includes("--dry-run") ||
    process.env.DROPS_PIPELINE_DRY_RUN === "true";
  const limit = Number.parseInt(process.env.DROPS_PIPELINE_LIMIT || "25", 10);

  const bot = new Telegraf(token);
  initializeTelegramBot(bot);

  await processApprovedPromos({ limit, dryRun });
}

async function main() {
  if (!acquireNamedLock(LOCK_NAME)) {
    logger.info("drops-pipeline", "Lock active; skipping run");
    return;
  }

  try {
    await runOnce();
  } catch (err) {
    logger.error("drops-pipeline", "Pipeline run failed", err);
  } finally {
    releaseNamedLock(LOCK_NAME);
  }
}

main();
