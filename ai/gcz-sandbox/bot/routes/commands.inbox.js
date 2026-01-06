import { getInbox } from "../services/inbox.js";
import { bold } from "../utils/formatters.js";

export default function inboxCommands(bot) {
  bot.command("inbox", async (ctx) => {
    const telegramId = ctx.from.id;
    const items = await getInbox(telegramId, 10);

    if (!items || items.length === 0) {
      return ctx.reply("📭 Your inbox is empty.");
    }

    let msg = "📬 *Your Inbox* (latest 10)\n\n";

    for (const item of items) {
      const status = item.is_read ? "✅" : "🆕";
      msg += `${status} ${bold(item.type)} — ${item.title || "Notification"}\n`;
    }

    msg += `\nDetails are visible on your GCZ dashboard.`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}