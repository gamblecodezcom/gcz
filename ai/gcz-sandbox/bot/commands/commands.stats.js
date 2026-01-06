import { getUserStats } from "../services/stats.js";
import { bold } from "../utils/formatters.js";

export default function statsCommands(bot) {
  bot.command("stats", async (ctx) => {
    const userId = ctx.from.id;

    let stats;
    try {
      stats = await getUserStats(userId);
    } catch (err) {
      return ctx.reply("❌ Error loading stats. Try again shortly.");
    }

    if (!stats) {
      return ctx.reply("❌ Unable to load stats.");
    }

    const msg =
      `📊 *Your Stats*\n\n` +
      `${bold("Raffle Entries")}: ${stats.entries}\n` +
      `${bold("Wheel Spins")}: ${stats.spins}\n` +
      `${bold("Giveaway Wins")}: ${stats.wins}\n\n` +
      `🎰 Redeem today, flex tomorrow`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}