import { TelegramRoles } from "../services/telegramRoles.js";
import { bold, code } from "../utils/formatters.js";

export default function roleCommands(bot) {
  bot.command("setrole", async (ctx) => {
    const adminId = ctx.from.id;
    const isAdmin = await TelegramRoles.hasRole(adminId, TelegramRoles.LEVELS.ADMIN);

    if (!isAdmin) {
      return ctx.reply("⛔ You do not have permission to set roles.");
    }

    const parts = ctx.message.text.split(" ").slice(1);
    if (parts.length < 2) {
      return ctx.reply("Usage:\n/setrole <telegram_id> <role>");
    }

    const [telegramId, role] = parts;

    const res = await fetch(`${config.API_BASE}/auth/role/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: telegramId, role })
    });

    const data = await res.json();

    ctx.reply(`✅ Role updated:\n${bold("User")}: ${telegramId}\n${bold("Role")}: ${role}`);
  });

  bot.command("whois", async (ctx) => {
    const parts = ctx.message.text.split(" ").slice(1);
    const id = parts[0] || ctx.from.id;

    const level = await TelegramRoles.getRoleLevel(id);
    const label = TelegramRoles.LABELS[level];

    ctx.reply(`🧾 *User Info*\n${bold("Telegram ID")}: ${id}\n${bold("Role")}: ${label}`, {
      parse_mode: "Markdown"
    });
  });
}