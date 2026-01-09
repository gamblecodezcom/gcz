import { getActiveRaffles, enterRaffle } from "../services/raffles.js";
import { incrementProgress } from "../services/progress.js";
import { completeMission } from "../services/missions.js";
import { bold, code } from "../utils/formatters.js";

export default function rafflesCommands(bot) {
  bot.command("raffles", async (ctx) => {
    const raffles = await getActiveRaffles();

    if (!raffles || raffles.length === 0) {
      return ctx.reply("🎟️ No active raffles right now.");
    }

    let msg = "🎟️ *Active Raffles*\n\n";
    raffles.forEach((r) => {
      msg += `• ${bold(r.title)} — ${r.prize_value || ""}\n`;
    });
    msg += `\nUse ${code("/join <id>")} once you know which you want.`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  });

  bot.command("join", async (ctx) => {
    const parts = ctx.message.text.trim().split(" ").slice(1);
    const id = parts[0];
    if (!id) {
      return ctx.reply("Usage:\n`/join RAFFLE_ID`", { parse_mode: "Markdown" });
    }

    const telegramId = ctx.from.id;
    const result = await enterRaffle(telegramId, id);

    if (!result?.success) {
      return ctx.reply(`❌ ${result?.message || "Unable to enter raffle."}`);
    }

    await incrementProgress(telegramId, { entries: 1 }).catch(() => null);
    await completeMission(telegramId, "raffle").catch(() => null);

    ctx.reply("✅ You have been entered into the raffle.");
  });
}