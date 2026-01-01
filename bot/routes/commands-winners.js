// /var/www/html/gcz/bot/routes/commands.winners.js

import { logger } from "../utils/logger.js";
import { getUserProfile } from "../utils/storage.js";
import { getTelegramUserById } from "../services/telegramRoles.js";
import pool from "../utils/apiClient.js";

const SUPER_ADMIN_TELEGRAM_ID = 6668510825;

/**
 * Format a single winner entry
 */
function formatWinnerEntry(profile) {
  const tgName =
    profile.username
      ? `@${profile.username}`
      : `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown";

  return (
    `👤 *${tgName}*\n` +
    `🆔 Telegram ID: \`${profile.id}\`\n` +
    `💸 Cwallet ID: ${profile.cwalletId || "❌ Not set"}\n` +
    `🎰 Runewager: ${profile.runewager || "❌ Not set"}\n` +
    `🏆 Winna: ${profile.winna || "❌ Not set"}\n` +
    `📅 Joined: ${new Date(profile.created_at).toLocaleString()}\n`
  );
}

/**
 * Setup winners report command
 */
export function setupWinnersReport(bot) {
  bot.command("winners", async (ctx) => {
    try {
      const adminId = ctx.from.id;

      // Only super admin or admin-level roles
      const role = await getTelegramUserById(adminId);
      if (!role || role.level < 4) {
        return ctx.reply("❌ Admin access required.");
      }

      // Fetch winners from backend
      const result = await pool.get("/api/giveaways/winners");
      const winners = result?.winners || [];

      if (winners.length === 0) {
        return ctx.reply("📭 No winners recorded yet.");
      }

      let message = `🏆 *Giveaway Winners Report*\n\n`;

      for (const w of winners) {
        const profile = getUserProfile(w.telegram_id);
        if (!profile) {
          message += `⚠️ Missing profile for Telegram ID: ${w.telegram_id}\n\n`;
          continue;
        }

        message += formatWinnerEntry(profile) + "\n";
      }

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (err) {
      logger.error("Winners report error:", err);
      ctx.reply("❌ Failed to load winners report.");
    }
  });
}