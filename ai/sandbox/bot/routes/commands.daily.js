import { getDailySummary } from "../services/daily.js";
import { bold } from "../utils/formatters.js";

export default function dailyCommands(bot) {
  bot.command("daily", async (ctx) => {
    const telegramId = ctx.from.id;
    const daily = await getDailySummary(telegramId);

    if (!daily) {
      return ctx.reply("❌ Unable to load daily picks. Try again later.");
    }

    let msg = "📅 *GCZ Daily*\n\n";

    if (daily.top_sites?.length) {
      msg += `${bold("Top Sites Today")}:\n`;
      daily.top_sites.forEach((s, i) => {
        msg += `${i + 1}. ${s.name} — ${s.tagline || ""}\n`;
      });
      msg += "\n";
    }

    if (daily.hot_raffles?.length) {
      msg += `${bold("Hot Raffles")}:\n`;
      daily.hot_raffles.forEach((r) => {
        msg += `• ${r.title} (${r.entries || 0} entries)\n`;
      });
      msg += "\n";
    }

    if (daily.promos?.length) {
      msg += `${bold("Promos")}:\n`;
      daily.promos.forEach((p) => {
        msg += `• ${p.title}\n`;
      });
      msg += "\n";
    }

    msg += "Use /raffles, /drops, /promos to explore.";

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}