import { getTelegramUserById } from "../services/telegramRoles.js";

export function setupCommandList(bot) {
  bot.command("commands", async (ctx) => {
    const telegramId = ctx.from.id;

    const role = await getTelegramUserById(telegramId);
    const level = role?.level || 1; // default: member

    const userCommands = [
      "• /start – Welcome menu",
      "• /profile – View your profile",
      "• /setcwallet <id> – Save Cwallet ID",
      "• /setrunewager <username> – Save Runewager username",
      "• /donate – Send promo link/code",
      "• /commands – Show available commands"
    ];

    const modCommands = [
      "• /whois – Inspect a user",
      "• /postpromo – Post promo manually"
    ];

    const adminCommands = [
      "• /approve <id> – Approve promo",
      "• /editpromo <id> <text> – Edit promo",
      "• /broadcast – Broadcast message",
      "• /giveaway start|cancel|status – Manage giveaways",
      "• /join – Join giveaway (if allowed)"
    ];

    const superAdminCommands = [
      "• /admin @user – Promote to admin",
      "• /mod @user – Promote to moderator",
      "• /demote @user – Demote to member"
    ];

    let message = `📜 *Your Available Commands*\n\n`;

    // Everyone gets user commands
    message += `👤 *User Commands:*\n${userCommands.join("\n")}\n\n`;

    if (level >= 3) {
      message += `🛡️ *Moderator Commands:*\n${modCommands.join("\n")}\n\n`;
    }

    if (level >= 4) {
      message += `🔧 *Admin Commands:*\n${adminCommands.join("\n")}\n\n`;
    }

    if (level === 5) {
      message += `👑 *Super Admin Commands:*\n${superAdminCommands.join("\n")}\n\n`;
    }

    await ctx.reply(message, { parse_mode: "Markdown" });
  });
}
