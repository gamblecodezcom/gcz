import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

// Singleton bot instance
let botInstance = null;

/**
 * Get or create Telegraf bot instance (lazy-loaded)
 */
async function getBotInstance() {
  if (!botInstance) {
    const { Telegraf } = await import("telegraf");
    botInstance = new Telegraf(config.TELEGRAM_BOT_TOKEN);
  }
  return botInstance;
}

/**
 * Safe Telegram send with retry for rate limits
 */
async function safeTelegramSend(bot, telegramId, message, options = {}, attempt = 1) {
  try {
    await bot.telegram.sendMessage(telegramId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      ...options
    });
    return true;
  } catch (err) {
    // Retry on rate limit
    if (err?.response?.error_code === 429 && attempt <= 3) {
      const wait = err.response.parameters.retry_after * 1000 || 1500;
      log("telegram", `Rate limit hit. Retrying in ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
      return safeTelegramSend(bot, telegramId, message, options, attempt + 1);
    }

    log("telegram", `Failed to send message to ${telegramId}`, err);
    return false;
  }
}

/**
 * Send Telegram notification
 */
export async function sendTelegramNotification(telegramId, message, options = {}) {
  try {
    const bot = await getBotInstance();
    return await safeTelegramSend(bot, telegramId, message, options);
  } catch (error) {
    log("telegram", `Error sending notification to ${telegramId}`, error);
    return false;
  }
}

/**
 * Fetch Telegram notification profile from backend
 */
async function getUserNotificationProfile(userId) {
  try {
    const res = await fetch(
      `https://gamblecodez.com/api/notifications/profile/${userId}`,
      { headers: { "Accept": "application/json" } }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.json();
  } catch (err) {
    log("notifications", `Failed to fetch notification profile for ${userId}`, err);
    return null;
  }
}

/**
 * Notify wheel spin result
 */
export async function notifyWheelSpin(userId, spinResult) {
  try {
    const profile = await getUserNotificationProfile(userId);
    if (!profile?.telegramId) return false;
    if (profile.telegram_raffle_alerts === false) return false;

    let message = `🎰 *Wheel Spin Result*\n\n`;

    if (spinResult.jackpot) {
      message += `🎉 *JACKPOT!* 🎉\n\n`;
      message += `You hit the JACKPOT! 🏆\n`;
      message += `Check your dashboard for reward details.\n\n`;
    } else {
      message += `🎁 *Reward:* ${spinResult.reward}\n\n`;
      if (spinResult.entriesAdded) {
        message += `➕ Added *${spinResult.entriesAdded}* raffle entries!\n\n`;
      }
    }

    message += `🎰 Redeem today, flex tomorrow`;

    return await sendTelegramNotification(profile.telegramId, message);
  } catch (error) {
    log("notifications", "Error notifying wheel spin", error);
    return false;
  }
}

/**
 * Notify giveaway win
 */
export async function notifyGiveawayWin(userId, giveaway) {
  try {
    const profile = await getUserNotificationProfile(userId);
    if (!profile?.telegramId) return false;
    if (profile.telegram_giveaway_alerts === false) return false;

    const message =
      `🎉 *You Won a Giveaway!*\n\n` +
      `🏆 *${giveaway.title}*\n` +
      `💰 Prize: *${giveaway.prize_value}*\n\n` +
      `Check your dashboard for details.\n\n` +
      `🎰 Redeem today, flex tomorrow`;

    return await sendTelegramNotification(profile.telegramId, message);
  } catch (error) {
    log("notifications", "Error notifying giveaway win", error);
    return false;
  }
}

/**
 * Notify new raffle
 */
export async function notifyNewRaffle(userId, raffle) {
  try {
    const profile = await getUserNotificationProfile(userId);
    if (!profile?.telegramId) return false;
    if (profile.telegram_raffle_alerts === false) return false;

    const message =
      `🎁 *New Raffle Available!*\n\n` +
      `🎟️ *${raffle.title}*\n\n` +
      `${raffle.description || "Enter now for a chance to win!"}\n\n` +
      `Use /raffles to view all active raffles.`;

    return await sendTelegramNotification(profile.telegramId, message);
  } catch (error) {
    log("notifications", "Error notifying new raffle", error);
    return false;
  }
}

/**
 * Notify secret code hint
 */
export async function notifySecretCodeHint(userId, hint) {
  try {
    const profile = await getUserNotificationProfile(userId);
    if (!profile?.telegramId) return false;
    if (profile.telegram_secret_code_hints !== true) return false;

    const message =
      `🔐 *Secret Code Hint*\n\n` +
      `${hint}\n\n` +
      `Submit using: /code <code>`;

    return await sendTelegramNotification(profile.telegramId, message);
  } catch (error) {
    log("notifications", "Error notifying secret code hint", error);
    return false;
  }
}