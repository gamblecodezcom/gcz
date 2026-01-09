import { redeemCode } from "../services/codes.js";
import { completeMission } from "../services/missions.js";

export default function codesCommands(bot) {
  bot.command("code", async (ctx) => {
    const parts = ctx.message.text.trim().split(" ").slice(1);
    const code = parts.join(" ");

    if (!code) {
      return ctx.reply("Usage:\n`/code YOURCODEHERE`", {
        parse_mode: "Markdown"
      });
    }

    const telegramId = ctx.from.id;
    const result = await redeemCode(telegramId, code);

    await completeMission(telegramId, "code").catch(() => null);

    if (!result?.success) {
      return ctx.reply(`❌ ${result?.message || "Invalid or expired code."}`);
    }

    ctx.reply(`🔐 Code redeemed!\n${result.message || "Reward has been added to your account."}`);
  });
}