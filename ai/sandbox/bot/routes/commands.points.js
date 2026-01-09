import { getPoints } from "../services/points.js";
import { bold } from "../utils/formatters.js";

export default function pointsCommands(bot) {
  bot.command("points", async (ctx) => {
    const telegramId = ctx.from.id;
    const data = await getPoints(telegramId);

    const msg =
      `💎 *GCZ Points*\n\n` +
      `${bold("Balance")}: ${data.balance || 0}\n` +
      `${bold("Lifetime Earned")}: ${data.lifetime_earned || 0}\n` +
      `${bold("Lifetime Spent")}: ${data.lifetime_spent || 0}\n\n` +
      `Earn points from spins, raffles, missions, and codes.`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}