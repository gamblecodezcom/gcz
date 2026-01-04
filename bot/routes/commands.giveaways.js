import { getActiveGiveaways, enterGiveaway } from "../services/giveaways.js";
import { incrementProgress } from "../services/progress.js";
import { bold, code } from "../utils/formatters.js";

export default function giveawaysCommands(bot) {
  bot.command("giveaways", async (ctx) => {
    const list = await getActiveGiveaways();

    if (!list || list.length === 0) {
      return ctx.reply("🎉 No active giveaways right now.");
    }

    let msg = "🎉 *Active Giveaways*\n\n";
    list.forEach((g) => {
      msg += `• ${bold(g.title)} — ${g.prize_value}\n`;
    });

    msg += `\nUse ${code("/join_giveaway <id>")} to enter.`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  });

  bot.command("join_giveaway", async (ctx) => {
    const parts = ctx.message.text.trim().split(" ").slice(1);
    const id = parts[0];
    if (!id) {
      return ctx.reply("Usage:\n`/join_giveaway GIVEAWAY_ID`", {
        parse_mode: "Markdown"
      });
    }

    const telegramId = ctx.from.id;
    const result = await enterGiveaway(telegramId, id);

    if (!result?.success) {
      return ctx.reply(`❌ ${result?.message || "Unable to enter giveaway."}`);
    }

    await incrementProgress(telegramId, { giveawayEntries: 1 }).catch(() => null);

    ctx.reply("✅ You have been entered into the giveaway.");
  });
}