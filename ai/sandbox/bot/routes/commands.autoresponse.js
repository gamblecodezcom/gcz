import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import {
  startReplySetup,
  handleSetupAction,
  handleButtonInput,
  handleAutoResponse
} from "../services/autoresponses.js";
import { setCwalletId, setRunewagerUsername, touchUser } from "../utils/storage.js";

const ADMIN_ID = config.TELEGRAM_ADMIN_ID?.toString();

export function setupAutoResponseCommands(bot) {
  // /start
  bot.start((ctx) => {
    touchUser(ctx.from);
    ctx.reply(
      "👋 Welcome to GambleCodez.\n\n" +
      "You can set up:\n" +
      "- Cwallet ID: /setcwallet <id>\n" +
      "- Runewager username: /setrunewager <username>"
    );
  });

  // /setcwallet
  bot.command("setcwallet", (ctx) => {
    const id = ctx.message.text.split(" ")[1];
    if (!id) return ctx.reply("Usage: /setcwallet <id>");

    setCwalletId(ctx.from.id.toString(), id, ctx.from);
    ctx.reply(`✅ Cwallet ID saved: ${id}`);
  });

  // /setrunewager
  bot.command("setrunewager", (ctx) => {
    const username = ctx.message.text.split(" ")[1];
    if (!username) return ctx.reply("Usage: /setrunewager <username>");

    setRunewagerUsername(ctx.from.id.toString(), username, ctx.from);
    ctx.reply(`✅ Runewager username saved: ${username}`);
  });

  // /reply <keyword>
  bot.command("reply", (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) {
      return ctx.reply("❌ Admin only.");
    }

    const keyword = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!keyword) return ctx.reply("Usage: reply to a message with /reply <keyword>");

    try {
      startReplySetup(ctx, keyword);
    } catch (err) {
      logger.error("Failed to start auto-response setup:", err);
      ctx.reply("❌ Failed to start auto-response setup.");
    }
  });

  // Callback queries
  bot.on("callback_query", async (ctx, next) => {
    const data = ctx.callbackQuery?.data || "";
    if (!data.startsWith("ar_")) return next();

    try {
      await handleSetupAction(bot, ctx);
    } catch (err) {
      logger.error("Auto-response setup callback error:", err);
      ctx.answerCbQuery("Error handling action.");
    }
  });

  // Text messages
  bot.on("text", async (ctx, next) => {
    try {
      await handleButtonInput(ctx);
    } catch (err) {
      logger.error("Button input handling error:", err);
    }

    try {
      await handleAutoResponse(bot, ctx);
    } catch (err) {
      logger.error("Auto-response execution error:", err);
    }

    return next();
  });
}