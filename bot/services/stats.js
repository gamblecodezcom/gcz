import pool from '../../utils/db.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import fetch from 'node-fetch';

/**
 * @typedef {Object} UserStats
 * @property {number} raffleEntries
 * @property {number} wheelSpins
 * @property {number} giveawaysEntered
 * @property {number} linkedCasinos
 * @property {number} totalRewards
 */

/**
 * Get comprehensive user stats
 * @param {string} userId - User ID (telegram_id or user_id)
 * @returns {Promise<UserStats>}
 */
export async function getUserStats(userId) {
  try {
    // Get user from database
    const userResult = await pool.query(
      `SELECT user_id FROM users WHERE telegram_id = $1 OR user_id = $1 LIMIT 1`,
      [userId]
    );

    const dbUserId = userResult.rows[0]?.user_id || userId;

    // Get stats from API
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/profile/dashboard-stats`, {
        headers: {
          'x-user-id': dbUserId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          raffleEntries: data.raffleEntries || 0,
          wheelSpins: data.wheelSpinsRemaining || 0,
          giveawaysEntered: data.giveawaysReceived || 0,
          linkedCasinos: data.linkedCasinos || 0,
          totalRewards: 0, // Calculate separately
        };
      }
    } catch (apiError) {
      logger.warn('API stats fetch failed, using DB fallback:', apiError);
    }

    // Fallback to direct DB queries
    const [raffleEntries, wheelSpins, giveaways, linkedSites] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as count FROM raffle_entries WHERE user_id = $1`,
        [dbUserId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM spin_logs WHERE user_id = $1`,
        [dbUserId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM giveaway_entries WHERE user_id = $1`,
        [dbUserId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM user_linked_sites WHERE user_id = $1`,
        [dbUserId]
      ),
    ]);

    return {
      raffleEntries: parseInt(raffleEntries.rows[0]?.count || 0),
      wheelSpins: parseInt(wheelSpins.rows[0]?.count || 0),
      giveawaysEntered: parseInt(giveaways.rows[0]?.count || 0),
      linkedCasinos: parseInt(linkedSites.rows[0]?.count || 0),
      totalRewards: 0,
    };
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    return {
      raffleEntries: 0,
      wheelSpins: 0,
      giveawaysEntered: 0,
      linkedCasinos: 0,
      totalRewards: 0,
    };
  }
}

/**
 * Get user's recent activity
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to return
 * @returns {Promise<Array>}
 */
export async function getUserActivity(userId, limit = 10) {
  try {
    const userResult = await pool.query(
      `SELECT user_id FROM users WHERE telegram_id = $1 OR user_id = $1 LIMIT 1`,
      [userId]
    );

    const dbUserId = userResult.rows[0]?.user_id || userId;

    const result = await pool.query(
      `SELECT activity_type, title, description, created_at
       FROM activity_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [dbUserId, limit]
    );

    return result.rows.map(row => ({
      type: row.activity_type,
      title: row.title,
      description: row.description,
      timestamp: row.created_at.toISOString(),
    }));
  } catch (error) {
    logger.error('Error fetching user activity:', error);
    return [];
  }
}
