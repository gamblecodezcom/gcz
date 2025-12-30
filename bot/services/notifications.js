import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import pool from '../../utils/db.js';

// Singleton bot instance
let botInstance = null;

/**
 * Get or create bot instance
 * @returns {Promise<Telegraf>}
 */
async function getBotInstance() {
  if (!botInstance) {
    const { Telegraf } = await import('telegraf');
    botInstance = new Telegraf(config.TELEGRAM_BOT_TOKEN);
  }
  return botInstance;
}

/**
 * Send notification to user via Telegram
 * @param {string} telegramId - Telegram user ID
 * @param {string} message - Message to send
 * @param {Object} options - Additional options (parse_mode, etc.)
 * @returns {Promise<boolean>}
 */
export async function sendTelegramNotification(telegramId, message, options = {}) {
  try {
    const bot = await getBotInstance();
    await bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
      ...options,
    });
    return true;
  } catch (error) {
    logger.error(`Error sending Telegram notification to ${telegramId}:`, error);
    return false;
  }
}

/**
 * Notify user about wheel spin result
 * @param {string} userId - User ID
 * @param {Object} spinResult - Spin result from wheel
 * @returns {Promise<boolean>}
 */
export async function notifyWheelSpin(userId, spinResult) {
  try {
    // Get user's Telegram ID
    const userResult = await pool.query(
      `SELECT telegram_id FROM users WHERE user_id = $1 OR telegram_id = $1 LIMIT 1`,
      [userId]
    );

    const telegramId = userResult.rows[0]?.telegram_id;
    if (!telegramId) {
      return false;
    }

    // Check notification settings
    const settingsResult = await pool.query(
      `SELECT telegram_raffle_alerts FROM user_notification_settings WHERE user_id = $1`,
      [userId]
    );

    const notificationsEnabled = settingsResult.rows.length === 0 || 
      settingsResult.rows[0]?.telegram_raffle_alerts !== false;

    if (!notificationsEnabled) {
      return false;
    }

    let message = `🎰 *Wheel Spin Result*\n\n`;

    if (spinResult.jackpot) {
      message += `🎉 *JACKPOT!* 🎉\n\n`;
      message += `Congratulations! You won the JACKPOT! 🏆\n`;
      message += `Check your dashboard for reward details.\n\n`;
    } else {
      message += `🎁 *Reward: ${spinResult.reward}*\n\n`;
      if (spinResult.entriesAdded) {
        message += `✅ Added ${spinResult.entriesAdded} raffle entries!\n\n`;
      }
    }

    message += `🎰 Redeem today, flex tomorrow!`;

    return await sendTelegramNotification(telegramId, message);
  } catch (error) {
    logger.error('Error notifying wheel spin:', error);
    return false;
  }
}

/**
 * Notify user about giveaway win
 * @param {string} userId - User ID
 * @param {Object} giveaway - Giveaway details
 * @returns {Promise<boolean>}
 */
export async function notifyGiveawayWin(userId, giveaway) {
  try {
    const userResult = await pool.query(
      `SELECT telegram_id FROM users WHERE user_id = $1 OR telegram_id = $1 LIMIT 1`,
      [userId]
    );

    const telegramId = userResult.rows[0]?.telegram_id;
    if (!telegramId) {
      return false;
    }

    const settingsResult = await pool.query(
      `SELECT telegram_giveaway_alerts FROM user_notification_settings WHERE user_id = $1`,
      [userId]
    );

    const notificationsEnabled = settingsResult.rows.length === 0 || 
      settingsResult.rows[0]?.telegram_giveaway_alerts !== false;

    if (!notificationsEnabled) {
      return false;
    }

    const message = `🎉 *You Won a Giveaway!*\n\n` +
      `*${giveaway.title}*\n\n` +
      `Prize: ${giveaway.prize_value}\n` +
      `Check your dashboard for reward details.\n\n` +
      `🎰 Redeem today, flex tomorrow!`;

    return await sendTelegramNotification(telegramId, message);
  } catch (error) {
    logger.error('Error notifying giveaway win:', error);
    return false;
  }
}

/**
 * Notify user about new raffle
 * @param {string} userId - User ID
 * @param {Object} raffle - Raffle details
 * @returns {Promise<boolean>}
 */
export async function notifyNewRaffle(userId, raffle) {
  try {
    const userResult = await pool.query(
      `SELECT telegram_id FROM users WHERE user_id = $1 OR telegram_id = $1 LIMIT 1`,
      [userId]
    );

    const telegramId = userResult.rows[0]?.telegram_id;
    if (!telegramId) {
      return false;
    }

    const settingsResult = await pool.query(
      `SELECT telegram_raffle_alerts FROM user_notification_settings WHERE user_id = $1`,
      [userId]
    );

    const notificationsEnabled = settingsResult.rows.length === 0 || 
      settingsResult.rows[0]?.telegram_raffle_alerts !== false;

    if (!notificationsEnabled) {
      return false;
    }

    const message = `🎁 *New Raffle Available!*\n\n` +
      `*${raffle.title}*\n\n` +
      `${raffle.description || 'Enter now for a chance to win!'}\n\n` +
      `Use /raffles to see all active raffles.`;

    return await sendTelegramNotification(telegramId, message);
  } catch (error) {
    logger.error('Error notifying new raffle:', error);
    return false;
  }
}

/**
 * Notify user about secret code hint
 * @param {string} userId - User ID
 * @param {string} hint - Secret code hint
 * @returns {Promise<boolean>}
 */
export async function notifySecretCodeHint(userId, hint) {
  try {
    const userResult = await pool.query(
      `SELECT telegram_id FROM users WHERE user_id = $1 OR telegram_id = $1 LIMIT 1`,
      [userId]
    );

    const telegramId = userResult.rows[0]?.telegram_id;
    if (!telegramId) {
      return false;
    }

    const settingsResult = await pool.query(
      `SELECT telegram_secret_code_hints FROM user_notification_settings WHERE user_id = $1`,
      [userId]
    );

    const notificationsEnabled = settingsResult.rows.length > 0 && 
      settingsResult.rows[0]?.telegram_secret_code_hints === true;

    if (!notificationsEnabled) {
      return false;
    }

    const message = `🔐 *Secret Code Hint*\n\n` +
      `${hint}\n\n` +
      `Use /code <code> to submit the secret code!`;

    return await sendTelegramNotification(telegramId, message);
  } catch (error) {
    logger.error('Error notifying secret code hint:', error);
    return false;
  }
}
