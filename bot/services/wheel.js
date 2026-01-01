import pool from '../../utils/db.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import fetch from 'node-fetch';

/**
 * @typedef {Object} WheelEligibility
 * @property {boolean} eligible
 * @property {string} [nextSpin] - ISO timestamp
 * @property {number} [hoursUntilNext]
 */

/**
 * @typedef {Object} WheelSpinResult
 * @property {number|string} reward
 * @property {boolean} jackpot
 * @property {number} [entriesAdded]
 */

/**
 * Check wheel spin eligibility for a user
 * @param {string} userId - User ID (telegram_id or user_id)
 * @returns {Promise<WheelEligibility>}
 */
export async function checkWheelEligibility(userId) {
  try {
    // Try to get user from database
    const userResult = await pool.query(
      `SELECT user_id FROM users WHERE telegram_id = $1 OR user_id = $1 LIMIT 1`,
      [userId]
    );

    const dbUserId = userResult.rows[0]?.user_id || userId;

    const check = await pool.query(
      `SELECT created_at FROM spin_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [dbUserId]
    );

    if (check.rows.length === 0) {
      return { eligible: true };
    }

    const last = new Date(check.rows[0].created_at);
    const now = new Date();
    const diff = now - last;
    const hoursUntilNext = 24 - (diff / (1000 * 60 * 60));
    
    if (diff < 24 * 60 * 60 * 1000) {
      const nextSpin = new Date(last.getTime() + 24 * 60 * 60 * 1000);
      return { 
        eligible: false, 
        nextSpin: nextSpin.toISOString(),
        hoursUntilNext: Math.max(0, hoursUntilNext)
      };
    }

    return { eligible: true };
  } catch (error) {
    logger.error('Error checking wheel eligibility:', error);
    return { eligible: false };
  }
}

/**
 * Spin the wheel for a user via API
 * @param {string} userId - User ID (telegram_id or user_id)
 * @param {string} ip - IP address
 * @param {string} ua - User agent
 * @returns {Promise<WheelSpinResult>}
 */
export async function spinWheel(userId, ip = 'telegram', ua = 'telegram-bot') {
  try {
    // Get user from database
    const userResult = await pool.query(
      `SELECT user_id FROM users WHERE telegram_id = $1 OR user_id = $1 LIMIT 1`,
      [userId]
    );

    const dbUserId = userResult.rows[0]?.user_id || userId;

    // Check eligibility first
    const eligibility = await checkWheelEligibility(userId);
    if (!eligibility.eligible) {
      throw new Error(`Daily spin already used. Next spin available in ${Math.ceil(eligibility.hoursUntilNext || 0)} hours.`);
    }

    // Call backend API
    const response = await fetch(`${config.API_BASE_URL}/api/daily-spin/spin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': dbUserId,
      },
      body: JSON.stringify({
        user_id: dbUserId,
        ip_address: ip,
        user_agent: ua,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error spinning wheel:', error);
    throw error;
  }
}

/**
 * Get wheel history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of recent spins to return
 * @returns {Promise<Array>}
 */
export async function getWheelHistory(userId, limit = 10) {
  try {
    const userResult = await pool.query(
      `SELECT user_id FROM users WHERE telegram_id = $1 OR user_id = $1 LIMIT 1`,
      [userId]
    );

    const dbUserId = userResult.rows[0]?.user_id || userId;

    const result = await pool.query(
      `SELECT reward, created_at 
       FROM spin_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [dbUserId, limit]
    );

    return result.rows.map(row => ({
      reward: row.reward,
      timestamp: row.created_at.toISOString(),
    }));
  } catch (error) {
    logger.error('Error fetching wheel history:', error);
    return [];
  }
}
