import { spinWheel } from "../services/wheel.js";
import { notifyWheelSpin } from "../services/notifications.js";
import { bold } from "../utils/formatters.js";

export default function wheelCommands(bot) {
  bot.command("wheel", async (ctx) => {
    const userId = ctx.from.id;

    // UX: acknowledge immediately
    await ctx.reply("🎰 Spinning the wheel...");

    let result;
    try {
      result = await spinWheel(userId);
    } catch (err) {
      return ctx.reply("❌ Error spinning the wheel. Try again shortly.");
    }

    if (!result?.success) {
      return ctx.reply("❌ Wheel spin failed. Try again later.");
    }

    let msg = `🎰 *Wheel Result*\n\n`;

    if (result.jackpot) {
      msg += `🏆 *JACKPOT!* You won big!\n\n`;
    } else {
      msg += `${bold("Reward")}: ${result.reward}\n`;
    }

    if (result.entriesAdded) {
      msg += `➕ Added *${result.entriesAdded}* raffle entries.\n`;
    }

    msg += `\n🎰 Redeem today, flex tomorrow`;

    await ctx.reply(msg, { parse_mode: "Markdown" });

    // Optional: async notification (non-blocking)
    try {
      await notifyWheelSpin(userId, result);
    } catch (err) {
      // Silent fail — notifications should never break the command
    }
  });
}