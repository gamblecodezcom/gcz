import { Telegraf } from "telegraf";
import { config } from "./config.js";
import { log } from "./utils/logger.js";
import loadRoutes from "./routes/index.js";
import { startHealthServer } from "./health.js";

// -------------------------------------
// BOT INITIALIZATION
// -------------------------------------
log("bot", "Starting GambleCodez Telegram Bot...");

export const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN, {
  handlerTimeout: 15_000
});

// -------------------------------------
// GLOBAL MIDDLEWARE
// -------------------------------------
bot.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    log("bot", "Unhandled error in middleware", err);
  }
});

// -------------------------------------
// LOAD COMMAND ROUTES
// -------------------------------------
await loadRoutes(bot);

// -------------------------------------
// ERROR HANDLER
// -------------------------------------
bot.catch((err, ctx) => {
  log("bot", `Bot error for update ${ctx.updateType}`, err);
});

// -------------------------------------
// START BOT
// -------------------------------------
bot.launch()
  .then(() => log("bot", "Bot launched successfully"))
  .catch((err) => log("bot", "Bot launch failed", err));

// -------------------------------------
// HEALTH SERVER (required for watchdog)
// -------------------------------------
startHealthServer(3000);

// -------------------------------------
// GRACEFUL SHUTDOWN
// -------------------------------------
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));