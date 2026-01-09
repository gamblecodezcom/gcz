import { TelegramRoles } from "../services/telegramRoles.js";
import { requireRole } from "../utils/permissions.js";
import {
  startReplySetup,
  handleSetupAction,
  handleButtonInput,
  AutoResponseService
} from "../services/autoresponses.js";

export default function autoresponseCommands(bot) {
  // Start autoresponse setup
  bot.command("ar", async (ctx) => {
    const hasPerm = await requireRole(ctx, TelegramRoles.LEVELS.ADMIN);
    if (!hasPerm) {
      return ctx.reply("❌ You do not have permission.");
    }

    const keyword = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!keyword) {
      return ctx.reply("Usage:\n`/ar keyword`", { parse_mode: "Markdown" });
    }

    startReplySetup(ctx, keyword);
  });

  // Handle inline button actions
  bot.action(/ar_/, async (ctx) => {
    await handleSetupAction(bot, ctx);
  });

  // Capture message for autoresponse content
  bot.on("message", async (ctx) => {
    const text = ctx.message.text;

    // If user is in autoresponse setup flow
    if (text && !text.startsWith("/")) {
      await handleButtonInput(ctx);
    }
  });

  // List autoresponses
  bot.command("arlist", async (ctx) => {
    const all = await AutoResponseService.getAll(true);

    if (!all.length) {
      return ctx.reply("No autoresponses found.");
    }

    let msg = "📚 *Autoresponses*\n\n";
    for (const r of all) {
      msg += `• *${r.trigger}*\n`;
    }

    ctx.reply(msg, { parse_mode: "Markdown" });
  });

  // Delete autoresponse
  bot.command("ardel", async (ctx) => {
    const hasPerm = await requireRole(ctx, TelegramRoles.LEVELS.ADMIN);
    if (!hasPerm) {
      return ctx.reply("❌ You do not have permission.");
    }

    const trigger = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!trigger) {
      return ctx.reply("Usage:\n`/ardel keyword`", { parse_mode: "Markdown" });
    }

    await AutoResponseService.delete(trigger);
    ctx.reply(`🗑 Deleted autoresponse for *${trigger}*`, {
      parse_mode: "Markdown"
    });
  });
}