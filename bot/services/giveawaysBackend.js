import pool from '../../utils/db.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import fetch from 'node-fetch';

/**
 * @typedef {Object} Giveaway
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {'cwallet'|'runewager'|'crypto'|'lootbox'|'raffle_entries'} type
 * @property {string} prize_value
 * @property {number} num_winners
 * @property {'draft'|'active'|'ended'|'cancelled'} status
 * @property {'telegram'|'web'|'both'} entry_method
 * @property {string} [start_date]
 * @property {string} [end_date]
 */

/**
 * Get active giveaways
 * @returns {Promise<Giveaway[]>}
 */
export async function getActiveGiveaways() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/giveaways?status=active`);
    if (!response.ok) {
      logger.error(`Failed to fetch giveaways: ${response.status}`);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error('Error fetching giveaways:', error);
    return [];
  }
}

/**
 * Get specific giveaway
 * @param {number} giveawayId - Giveaway ID
 * @returns {Promise<Giveaway | null>}
 */
export async function getGiveaway(giveawayId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/giveaways/${giveawayId}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    logger.error('Error fetching giveaway:', error);
    return null;
  }
}

/**
 * Enter a giveaway via Telegram
 * @param {string} userId - User ID
 * @param {string} telegramId - Telegram ID
 * @param {string} telegramUsername - Telegram username
 * @param {number} giveawayId - Giveaway ID
 * @param {Object} entryData - Additional entry data (cwallet_id, runewager_username, etc.)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function enterGiveaway(userId, telegramId, telegramUsername, giveawayId, entryData = {}) {
  try {
    // Get user from database
    const userResult = await pool.query(
      `SELECT user_id, cwallet_id, username FROM users WHERE telegram_id = $1 OR user_id = $1 LIMIT 1`,
      [userId]
    );

    const user = userResult.rows[0];
    const dbUserId = user?.user_id || userId;

    // Get giveaway to check requirements
    const giveaway = await getGiveaway(giveawayId);
    if (!giveaway) {
      return { success: false, message: 'Giveaway not found' };
    }

    if (giveaway.status !== 'active') {
      return { success: false, message: 'Giveaway is not active' };
    }

    if (giveaway.entry_method === 'web') {
      return { success: false, message: 'This giveaway can only be entered via web' };
    }

    // Check if already entered
    const existingEntry = await pool.query(
      `SELECT * FROM giveaway_entries WHERE giveaway_id = $1 AND user_id = $2`,
      [giveawayId, dbUserId]
    );

    if (existingEntry.rows.length > 0) {
      return { success: false, message: 'You have already entered this giveaway' };
    }

    // Validate entry requirements
    if (giveaway.type === 'cwallet' && !entryData.cwallet_id && !user?.cwallet_id) {
      return { success: false, message: 'Cwallet ID required. Use /setcwallet <id> first' };
    }

    if (giveaway.type === 'runewager' && !entryData.runewager_username && !user?.username) {
      return { success: false, message: 'Runewager username required. Use /setrunewager <username> first' };
    }

    // Create entry via API
    const response = await fetch(`${config.API_BASE_URL}/api/giveaways/${giveawayId}/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': dbUserId,
      },
      body: JSON.stringify({
        entry_data: {
          ...entryData,
          cwallet_id: entryData.cwallet_id || user?.cwallet_id,
          runewager_username: entryData.runewager_username || user?.username,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.error || 'Failed to enter giveaway' };
    }

    // Also create entry directly in DB for Telegram tracking
    await pool.query(
      `INSERT INTO giveaway_entries (giveaway_id, user_id, telegram_id, telegram_username, entry_method, entry_data, created_at)
       VALUES ($1, $2, $3, $4, 'telegram', $5, CURRENT_TIMESTAMP)
       ON CONFLICT (giveaway_id, user_id) DO NOTHING`,
      [
        giveawayId,
        dbUserId,
        telegramId,
        telegramUsername,
        JSON.stringify({
          cwallet_id: entryData.cwallet_id || user?.cwallet_id,
          runewager_username: entryData.runewager_username || user?.username,
        }),
      ]
    );

    return { success: true, message: 'Successfully entered giveaway!' };
  } catch (error) {
    logger.error('Error entering giveaway:', error);
    return { success: false, message: 'An error occurred while entering the giveaway' };
  }
}

/**
 * Get user's giveaway entries
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getUserGiveawayEntries(userId) {
  try {
    const userResult = await pool.query(
      `SELECT user_id FROM users WHERE telegram_id = $1 OR user_id = $1 LIMIT 1`,
      [userId]
    );

    const dbUserId = userResult.rows[0]?.user_id || userId;

    const result = await pool.query(
      `SELECT ge.*, g.title, g.type, g.prize_value, g.status
       FROM giveaway_entries ge
       JOIN giveaways g ON ge.giveaway_id = g.id
       WHERE ge.user_id = $1
       ORDER BY ge.created_at DESC
       LIMIT 20`,
      [dbUserId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error fetching user giveaway entries:', error);
    return [];
  }
}
