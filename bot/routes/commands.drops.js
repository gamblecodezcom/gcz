import { getLatestDrops } from "../services/drops.js";
import { bold } from "../utils/formatters.js";

export default function dropsCommands(bot) {
  bot.command("drops", async (ctx) => {
    const drops = await getLatestDrops(10);

    if (!drops || drops.length === 0) {
      return ctx.reply("📦 No drops available right now.");
    }

    let msg = "📦 *Latest Drops*\n\n";

    drops.forEach((d) => {
      msg += `• ${bold(d.title)} — ${d.description || ""}\n`;
    });

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}