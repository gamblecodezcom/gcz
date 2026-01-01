// /var/www/html/gcz/bot/routes/commands.giveaways.js

import { logger } from "../utils/logger.js";
import {
  getActiveGiveaways,
  enterGiveaway,
  getUserGiveawayEntries,
  startGiveaway,
  cancelGiveaway,
  pickWinners
} from "../services/giveawaysBackend.js";

import { getUserProfile } from "../utils/storage.js";
import { getTelegramUserById } from "../services/telegramRoles.js";

const SUPER_ADMIN_TELEGRAM_ID = 6668510825;

/**
 * Validate user profile for giveaway entry
 */
function validateProfileForGiveaway(profile) {
  const missing = [];

  if (!profile.cwalletId) missing.push("• Cwallet ID (`/setcwallet <id>`)");
  if (!profile.runewager) missing.push("• Runewager username (`/setrunewager <name>`)");
  if (!profile.winna) missing.push("• Winna username (set on site)");

  return missing;
}

/**
 * Setup all giveaway commands
 */
export function setupGiveawayCommands(bot) {

  // ============================================================
  // /giveaway start <type> <winners> <value> <minutes>
  // ============================================================
  bot.command("giveaway", async (ctx) => {
    try {
      const userId = ctx.from.id;

      if (userId !== SUPER_ADMIN_TELEGRAM_ID) {
        return ctx.reply("❌ Only Super Admin can manage giveaways.");
      }

      const parts = ctx.message.text.split(" ").filter(Boolean);
      const sub = parts[1]?.toLowerCase();

      // -------------------------
      // START GIVEAWAY
      // -------------------------
      if (sub === "start") {
        if (parts.length < 6) {
          return ctx.reply(
            "❌ Usage:\n" +
            "`/giveaway start <type> <winners> <value> <minutes>`\n\n" +
            "Examples:\n" +
            "`/giveaway start cwallet 3 5 10`\n" +
            "`/giveaway start runewager 5 100 15`\n" +
            "`/giveaway start winna 3 2 20`",
            { parse_mode: "Markdown" }
          );
        }

        const type = parts[2].toLowerCase();
        const winners = parseInt(parts[3]);
        const value = parts[4];
        const minutes = parseInt(parts[5]);

        if (!["cwallet", "runewager", "winna", "crypto"].includes(type)) {
          return ctx.reply("❌ Invalid type. Must be: cwallet, runewager, winna, crypto");
        }

        const result = await startGiveaway({
          type,
          winners,
          value,
          minutes,
          adminId: userId
        });

        if (!result.success) {
          return ctx.reply(`❌ Failed to start giveaway: ${result.message}`);
        }

        return ctx.reply(
          `🎉 *Giveaway Started!*\n\n` +
          `Type: ${type}\n` +
          `Winners: ${winners}\n` +
          `Prize: ${value}\n` +
          `Duration: ${minutes} minutes`,
          { parse_mode: "Markdown" }
        );
      }

      // -------------------------
      // CANCEL GIVEAWAY
      // -------------------------
      if (sub === "cancel") {
        const result = await cancelGiveaway();

        return ctx.reply(
          result.success ? "🛑 Giveaway cancelled." : `❌ ${result.message}`
        );
      }

      // -------------------------
      // PICK WINNERS
      // -------------------------
      if (sub === "pick") {
        const result = await pickWinners();

        if (!result.success) {
          return ctx.reply(`❌ ${result.message}`);
        }

        let msg = "🏆 *Winners Selected!*\n\n";

        result.winners.forEach((w, i) => {
          msg += `${i + 1}. ${w.telegram_username || w.telegram_id}\n`;
        });

        return ctx.reply(msg, { parse_mode: "Markdown" });
      }

      // -------------------------
      // HELP
      // -------------------------
      return ctx.reply(
        "🎁 *Giveaway Commands*\n\n" +
        "`/giveaway start <type> <winners> <value> <minutes>`\n" +
        "`/giveaway cancel`\n" +
        "`/giveaway pick`",
        { parse_mode: "Markdown" }
      );

    } catch (err) {
      logger.error("Giveaway command error:", err);
      ctx.reply("❌ Error processing giveaway command.");
    }
  });

  // ============================================================
  // /giveaways — list active giveaways (EVERYONE)
  // ============================================================
  bot.command("giveaways", async (ctx) => {
    try {
      const giveaways = await getActiveGiveaways();

      if (giveaways.length === 0) {
        return ctx.reply("📭 No active giveaways right now.");
      }

      let msg = "🎁 *Active Giveaways*\n\n";

      giveaways.forEach((g, i) => {
        msg += `${i + 1}. *${g.title}*\n`;
        msg += `   Type: ${g.type}\n`;
        msg += `   Prize: ${g.prize_value}\n`;
        msg += `   Winners: ${g.num_winners}\n`;
        msg += `   Ends: ${new Date(g.end_date).toLocaleString()}\n`;
        msg += `   Enter: /enter_giveaway ${g.id}\n\n`;
      });

      ctx.reply(msg, { parse_mode: "Markdown" });
    } catch (err) {
      logger.error("Giveaways list error:", err);
      ctx.reply("❌ Error loading giveaways.");
    }
  });

  // ============================================================
  // /enter_giveaway <id> — USERS CAN ENTER
  // ============================================================
  bot.command("enter_giveaway", async (ctx) => {
    try {
      const parts = ctx.message.text.split(" ");
      if (parts.length < 2) {
        return ctx.reply(
          "❌ Usage: `/enter_giveaway <id>`",
          { parse_mode: "Markdown" }
        );
      }

      const giveawayId = parseInt(parts[1]);
      if (isNaN(giveawayId)) {
        return ctx.reply("❌ Invalid giveaway ID.");
      }

      const userId = ctx.from.id;
      const profile = getUserProfile(userId);

      if (!profile) {
        return ctx.reply("❌ You must run /start first.");
      }

      // Validate required fields
      const missing = validateProfileForGiveaway(profile);
      if (missing.length > 0) {
        return ctx.reply(
          "⚠️ *You must complete your profile before joining giveaways:*\n\n" +
          missing.join("\n") +
          "\n\nVisit https://gamblecodez.com to sync your account.",
          { parse_mode: "Markdown" }
        );
      }

      const result = await enterGiveaway({
        giveawayId,
        telegramId: userId,
        username: ctx.from.username || ctx.from.first_name,
        cwalletId: profile.cwalletId,
        runewager: profile.runewager,
        winna: profile.winna
      });

      if (!result.success) {
        return ctx.reply(`❌ ${result.message}`);
      }

      return ctx.reply("🎉 You have successfully entered the giveaway!");
    } catch (err) {
      logger.error("Enter giveaway error:", err);
      ctx.reply("❌ Error entering giveaway.");
    }
  });

  // ============================================================
  // /my_giveaways — USERS SEE THEIR ENTRIES
  // ============================================================
  bot.command("my_giveaways", async (ctx) => {
    try {
      const userId = ctx.from.id;
      const entries = await getUserGiveawayEntries(userId);

      if (entries.length === 0) {
        return ctx.reply("📭 You have no giveaway entries yet.");
      }

      let msg = "🎁 *Your Giveaway Entries*\n\n";

      entries.forEach((e, i) => {
        msg += `${i + 1}. *${e.title}*\n`;
        msg += `   Prize: ${e.prize_value}\n`;
        msg += `   Status: ${e.status}\n`;
        msg += `   Entered: ${new Date(e.created_at).toLocaleString()}\n\n`;
      });

      ctx.reply(msg, { parse_mode: "Markdown" });
    } catch (err) {
      logger.error("My giveaways error:", err);
      ctx.reply("❌ Error loading your entries.");
    }
  });
}
