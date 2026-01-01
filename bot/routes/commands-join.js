// /var/www/html/gcz/bot/routes/commands.join.js

import { logger } from "../utils/logger.js";
import { getUserProfile } from "../utils/storage.js";
import { getTelegramUserById } from "../services/telegramRoles.js";
import { joinGiveaway } from "../services/giveaways.js";

export function setupJoinCommand(bot) {
  bot.command("join", async (ctx) => {
    try {
      const userId = ctx.from.id;
      const profile = getUserProfile(userId);

      if (!profile) {
        return ctx.reply(
          "❌ You must start the bot first.\nRun /start to register."
        );
      }

      // Check if user has required fields
      const missing = [];

      if (!profile.cwalletId) missing.push("• Cwallet ID (`/setcwallet <id>`)");
      if (!profile.runewager) missing.push("• Runewager username (`/setrunewager <name>`)");
      if (!profile.winna) missing.push("• Winna username (set on site)");

      if (missing.length > 0) {
        return ctx.reply(
          "⚠️ *You must complete your profile before joining giveaways:*\n\n" +
            missing.join("\n") +
            "\n\nVisit https://gamblecodez.com to sync your account.",
          { parse_mode: "Markdown" }
        );
      }

      // Attempt to join giveaway
      const result = await joinGiveaway(ctx, bot);

      if (!result.success) {
        return ctx.reply(
          `❌ Could not join giveaway.\nReason: ${result.message || "Unknown error"}`
        );
      }

      return ctx.reply("🎉 You have successfully joined the giveaway!");
    } catch (err) {
      logger.error("Join command error:", err);
      ctx.reply("❌ Error joining giveaway.");
    }
  });
}