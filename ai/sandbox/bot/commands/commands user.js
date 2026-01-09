import { TelegramRoles } from "../services/telegramRoles.js";
import { bold } from "../utils/formatters.js";

export default function userCommands(bot) {
  // /me — show profile
  bot.command("me", async (ctx) => {
    const user = ctx.from;

    const msg =
      `👤 *Your Profile*\n\n` +
      `${bold("Name")}: ${user.first_name}\n` +
      `${bold("Username")}: @${user.username || "none"}\n` +
      `${bold("Telegram ID")}: ${user.id}\n\n` +
      `Use /stats to view your GCZ stats.`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  });

  // /id — quick ID lookup
  bot.command("id", async (ctx) => {
    ctx.reply(`🆔 Your Telegram ID: *${ctx.from.id}*`, {
      parse_mode: "Markdown"
    });
  });
}