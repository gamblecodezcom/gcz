// /var/www/html/gcz/bot/services/promos.js

import pool from "../../utils/apiClient.js";   // your HTTP client to backend
import { logger } from "../utils/logger.js";
import { canApprovePromos, canEditPromos } from "../utils/permissions.js";
import { Telegraf } from "telegraf";

let botInstance = null;

/**
 * Initialize bot instance so this service can send messages
 */
export function initPromoBot(bot) {
  botInstance = bot;
}

/**
 * Submit a donated promo (Telegram user → backend)
 */
export async function submitDonatedPromo(ctx, content, type = "generic") {
  try {
    const payload = {
      source: "telegram",
      content,
      clean_text: content,
      affiliate_id: null,
      type
    };

    const res = await pool.post("/api/promos", payload);

    logger.info(`Promo donated via Telegram: #${res.id}`);

    return res.id;
  } catch (err) {
    logger.error("Failed to submit donated promo:", err);
    return null;
  }
}

/**
 * Submit a Discord‑scraped promo
 */
export async function submitDiscordPromo(content, clean, affiliateId, type) {
  try {
    const payload = {
      source: "discord",
      content,
      clean_text: clean,
      affiliate_id: affiliateId,
      type
    };

    const res = await pool.post("/api/promos", payload);

    logger.info(`Promo scraped from Discord: #${res.id}`);

    return res.id;
  } catch (err) {
    logger.error("Discord promo ingest failed:", err);
    return null;
  }
}

/**
 * Admin approves a promo via Telegram
 */
export async function approvePromoViaTelegram(ctx, promoId) {
  const user = ctx.gczUser;

  if (!canApprovePromos(user)) {
    return ctx.reply("❌ You do not have permission to approve promos.");
  }

  try {
    const res = await pool.post(`/api/promos/${promoId}/approve`, {
      admin_id: user.id
    });

    ctx.reply(`✅ Promo #${promoId} approved and distributed.`);
    logger.info(`Promo #${promoId} approved by admin ${user.id}`);

    return res;
  } catch (err) {
    logger.error("Promo approval error:", err);
    return ctx.reply("❌ Failed to approve promo.");
  }
}

/**
 * Admin edits a promo via Telegram
 */
export async function editPromoViaTelegram(ctx, promoId, newContent) {
  const user = ctx.gczUser;

  if (!canEditPromos(user)) {
    return ctx.reply("❌ You do not have permission to edit promos.");
  }

  try {
    const res = await pool.post(`/api/promos/${promoId}/edit`, {
      admin_id: user.id,
      content: newContent,
      clean_text: newContent
    });

    ctx.reply(`✏️ Promo #${promoId} updated.`);
    logger.info(`Promo #${promoId} edited by admin ${user.id}`);

    return res;
  } catch (err) {
    logger.error("Promo edit error:", err);
    return ctx.reply("❌ Failed to edit promo.");
  }
}

/**
 * Distribute an approved promo to Telegram channel
 */
export async function distributePromoToTelegram(promo) {
  if (!botInstance) {
    logger.warn("Telegram bot not initialized for promo distribution");
    return false;
  }

  try {
    const channelId =
      process.env.TELEGRAM_DAILIES_CHANNEL_ID ||
      process.env.TELEGRAM_CHANNEL_ID;

    if (!channelId) {
      logger.error("No Telegram channel configured for promo distribution");
      return false;
    }

    let message = promo.clean_text || promo.content;

    // Add affiliate link if present
    if (promo.affiliate_id && promo.affiliate_url) {
      const base = process.env.AFFILIATE_BASE_URL || "https://gamblecodez.com";
      const path = process.env.AFFILIATE_DEFAULT_REDIRECT || "/redirect";
      const link = `${base}${path}/${promo.affiliate_name || promo.affiliate_id}`;

      message += `\n\n🔗 Not signed up yet? ${link}`;
    }

    await botInstance.telegram.sendMessage(channelId, message, {
      parse_mode: "HTML",
      disable_web_page_preview: false
    });

    logger.info(`Promo #${promo.id} distributed to Telegram channel ${channelId}`);
    return true;
  } catch (err) {
    logger.error("Failed to distribute promo:", err);
    return false;
  }
}

/**
 * Auto‑handler for backend → bot promo approval events
 */
export function setupPromoAutoHandler() {
  global.promoApprovedHandler = async (promo) => {
    await distributePromoToTelegram(promo);
  };
}
