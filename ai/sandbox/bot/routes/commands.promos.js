import { getLivePromos } from "../services/promos.js";
import { bold } from "../utils/formatters.js";

export default function promosCommands(bot) {
  bot.command("promos", async (ctx) => {
    const promos = await getLivePromos();

    if (!promos || promos.length === 0) {
      return ctx.reply("🎁 No active promos right now.");
    }

    let msg = "🎁 *Active Promos*\n\n";

    promos.forEach((p) => {
      msg += `• ${bold(p.title)} — ${p.description || ""}\n`;
    });

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}