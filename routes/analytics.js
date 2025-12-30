import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * @typedef {Object} PlayerInsight
 * @property {string} userId
 * @property {number} engagementScore
 * @property {string} segment - 'high_value' | 'active' | 'casual' | 'at_risk'
 * @property {Array} recommendations
 * @property {Object} behaviorPatterns
 */

/**
 * GET /api/analytics/player-insights
 * Get AI-powered player insights
 * 
 * @route GET /api/analytics/player-insights
 * @param {string} [req.query.userId] - Specific user ID (admin only)
 * @returns {Promise<PlayerInsight[]>} 200 - Success response
 */
router.get("/player-insights", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = req.query.userId || user?.user_id;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    // Get comprehensive user data
    const [xpData, activityData, spinData, raffleData, giveawayData] = await Promise.all([
      pool.query(`SELECT * FROM user_xp WHERE user_id = $1`, [userId]),
      pool.query(
        `SELECT activity_type, COUNT(*) as count, MAX(created_at) as last_activity
         FROM activity_log WHERE user_id = $1
         GROUP BY activity_type`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*) as total, MAX(created_at) as last_spin
         FROM spin_logs WHERE user_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*) as total
         FROM raffle_entries WHERE user_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*) as total
         FROM giveaway_entries WHERE user_id = $1`,
        [userId]
      ),
    ]);

    const xp = xpData.rows[0] || {};
    const activities = activityData.rows;
    const spins = spinData.rows[0] || {};
    const raffles = raffleData.rows[0] || {};
    const giveaways = giveawayData.rows[0] || {};

    // Calculate engagement score (0-100)
    const daysSinceLastActivity = xp.last_activity_date 
      ? Math.floor((Date.now() - new Date(xp.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const activityScore = Math.min(activities.length * 5, 30);
    const spinScore = Math.min((spins.total || 0) * 2, 20);
    const raffleScore = Math.min((raffles.total || 0) * 3, 20);
    const giveawayScore = Math.min((giveaways.total || 0) * 5, 15);
    const streakScore = Math.min((xp.current_streak || 0) * 2, 15);
    const recencyPenalty = Math.max(0, daysSinceLastActivity * -2);

    const engagementScore = Math.max(0, Math.min(100, 
      activityScore + spinScore + raffleScore + giveawayScore + streakScore + recencyPenalty
    ));

    // Determine segment
    let segment = 'casual';
    if (engagementScore >= 80) segment = 'high_value';
    else if (engagementScore >= 50) segment = 'active';
    else if (engagementScore < 20 || daysSinceLastActivity > 30) segment = 'at_risk';

    // Generate recommendations
    const recommendations = [];
    if (spins.total === 0) {
      recommendations.push('Spin the wheel to earn your first raffle entries!');
    }
    if (raffles.total < 5) {
      recommendations.push('Enter more raffles to increase your chances of winning.');
    }
    if (xp.current_streak < 7) {
      recommendations.push('Maintain a daily streak to unlock bonus rewards.');
    }
    if (daysSinceLastActivity > 7) {
      recommendations.push('Come back daily to maintain your streak and earn rewards.');
    }
    if (giveaways.total === 0) {
      recommendations.push('Enter giveaways for exclusive prizes!');
    }

    // Behavior patterns
    const behaviorPatterns = {
      mostActiveDay: activities.length > 0 ? activities[0].last_activity : null,
      favoriteActivity: activities.length > 0 
        ? activities.reduce((a, b) => (a.count > b.count ? a : b)).activity_type
        : null,
      spinFrequency: spins.total > 0 
        ? Math.floor((Date.now() - new Date(spins.last_spin).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    };

    res.status(200).json({
      userId,
      engagementScore,
      segment,
      recommendations,
      behaviorPatterns,
      stats: {
        totalXP: xp.total_xp || 0,
        level: xp.current_level || 1,
        totalSpins: spins.total || 0,
        totalRaffles: raffles.total || 0,
        totalGiveaways: giveaways.total || 0,
        currentStreak: xp.current_streak || 0,
        daysSinceLastActivity,
      },
    });
  } catch (error) {
    console.error("Error generating player insights:", error);
    res.status(500).json({
      error: "Failed to generate player insights",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/analytics/admin/overview
 * Get admin analytics overview
 * 
 * @route GET /api/analytics/admin/overview
 */
router.get("/admin/overview", async (req, res) => {
  try {
    const [userStats, spinStats, raffleStats, giveawayStats, segmentStats] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
        FROM users
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total_spins,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as spins_24h,
          COUNT(CASE WHEN reward = 'JACKPOT' THEN 1 END) as jackpots
        FROM spin_logs
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(DISTINCT user_id) as unique_participants,
          COUNT(CASE WHEN entry_time > NOW() - INTERVAL '24 hours' THEN 1 END) as entries_24h
        FROM raffle_entries
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(DISTINCT user_id) as unique_participants,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as entries_24h
        FROM giveaway_entries
      `),
      pool.query(`
        SELECT 
          CASE 
            WHEN total_xp >= 5000 THEN 'high_value'
            WHEN total_xp >= 1000 THEN 'active'
            WHEN total_xp >= 100 THEN 'casual'
            ELSE 'at_risk'
          END as segment,
          COUNT(*) as count
        FROM user_xp
        GROUP BY segment
      `),
    ]);

    res.status(200).json({
      users: {
        total: parseInt(userStats.rows[0]?.total_users || 0),
        new7d: parseInt(userStats.rows[0]?.new_users_7d || 0),
        new30d: parseInt(userStats.rows[0]?.new_users_30d || 0),
      },
      spins: {
        total: parseInt(spinStats.rows[0]?.total_spins || 0),
        last24h: parseInt(spinStats.rows[0]?.spins_24h || 0),
        jackpots: parseInt(spinStats.rows[0]?.jackpots || 0),
      },
      raffles: {
        totalEntries: parseInt(raffleStats.rows[0]?.total_entries || 0),
        uniqueParticipants: parseInt(raffleStats.rows[0]?.unique_participants || 0),
        entries24h: parseInt(raffleStats.rows[0]?.entries_24h || 0),
      },
      giveaways: {
        totalEntries: parseInt(giveawayStats.rows[0]?.total_entries || 0),
        uniqueParticipants: parseInt(giveawayStats.rows[0]?.unique_participants || 0),
        entries24h: parseInt(giveawayStats.rows[0]?.entries_24h || 0),
      },
      segments: segmentStats.rows.map(row => ({
        segment: row.segment,
        count: parseInt(row.count || 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching admin overview:", error);
    res.status(500).json({
      error: "Failed to fetch admin overview",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/analytics/admin/anomalies
 * Detect anomalies in player behavior
 * 
 * @route GET /api/analytics/admin/anomalies
 */
router.get("/admin/anomalies", async (req, res) => {
  try {
    // Detect suspicious patterns
    const anomalies = [];

    // Check for users with excessive spins (potential abuse)
    const excessiveSpins = await pool.query(`
      SELECT user_id, COUNT(*) as spin_count
      FROM spin_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY user_id
      HAVING COUNT(*) > 10
      ORDER BY spin_count DESC
      LIMIT 10
    `);

    excessiveSpins.rows.forEach(row => {
      anomalies.push({
        type: 'excessive_spins',
        userId: row.user_id,
        severity: 'medium',
        description: `User has ${row.spin_count} spins in the last 24 hours`,
        timestamp: new Date().toISOString(),
      });
    });

    // Check for users with multiple accounts (same IP)
    const duplicateIPs = await pool.query(`
      SELECT ip_address, COUNT(DISTINCT user_id) as user_count
      FROM spin_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY ip_address
      HAVING COUNT(DISTINCT user_id) > 3
      ORDER BY user_count DESC
      LIMIT 10
    `);

    duplicateIPs.rows.forEach(row => {
      anomalies.push({
        type: 'potential_multi_account',
        ipAddress: row.ip_address,
        severity: 'high',
        description: `${row.user_count} different users from same IP`,
        timestamp: new Date().toISOString(),
      });
    });

    res.status(200).json({ anomalies });
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    res.status(500).json({
      error: "Failed to detect anomalies",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
