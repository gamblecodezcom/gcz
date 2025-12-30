import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * @typedef {Object} UserXP
 * @property {number} total_xp
 * @property {number} current_level
 * @property {number} xp_to_next_level
 * @property {number} total_spins
 * @property {number} total_raffle_entries
 * @property {number} total_giveaways_entered
 * @property {number} total_sites_linked
 * @property {number} current_streak
 * @property {number} longest_streak
 */

/**
 * GET /api/gamification/xp
 * Get user XP and level data
 * 
 * @route GET /api/gamification/xp
 * @returns {Promise<UserXP>} 200 - Success response
 */
router.get("/xp", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.user_id || req.headers["x-user-id"] || "guest";

    const result = await pool.query(
      `SELECT * FROM user_xp WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Initialize user XP
      await pool.query(
        `INSERT INTO user_xp (user_id, total_xp, current_level, xp_to_next_level)
         VALUES ($1, 0, 1, 100)`,
        [userId]
      );

      return res.status(200).json({
        total_xp: 0,
        current_level: 1,
        xp_to_next_level: 100,
        total_spins: 0,
        total_raffle_entries: 0,
        total_giveaways_entered: 0,
        total_sites_linked: 0,
        current_streak: 0,
        longest_streak: 0,
      });
    }

    const xp = result.rows[0];
    res.status(200).json({
      total_xp: xp.total_xp,
      current_level: xp.current_level,
      xp_to_next_level: xp.xp_to_next_level,
      total_spins: xp.total_spins || 0,
      total_raffle_entries: xp.total_raffle_entries || 0,
      total_giveaways_entered: xp.total_giveaways_entered || 0,
      total_sites_linked: xp.total_sites_linked || 0,
      current_streak: xp.current_streak || 0,
      longest_streak: xp.longest_streak || 0,
    });
  } catch (error) {
    console.error("Error fetching XP:", error);
    res.status(500).json({
      error: "Failed to fetch XP data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Award XP to a user
 * @param {string} userId - User ID
 * @param {number} xpAmount - Amount of XP to award
 * @param {string} source - Source of XP
 * @param {string} sourceId - Optional source ID
 * @param {string} description - Optional description
 * @returns {Promise<{leveledUp: boolean, newLevel?: number}>}
 */
export async function awardXP(userId, xpAmount, source, sourceId = null, description = null) {
  try {
    // Get or create user XP record
    let xpResult = await pool.query(
      `SELECT * FROM user_xp WHERE user_id = $1`,
      [userId]
    );

    if (xpResult.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_xp (user_id, total_xp, current_level, xp_to_next_level)
         VALUES ($1, 0, 1, 100)`,
        [userId]
      );
      xpResult = await pool.query(
        `SELECT * FROM user_xp WHERE user_id = $1`,
        [userId]
      );
    }

    const userXP = xpResult.rows[0];
    const newTotalXP = userXP.total_xp + xpAmount;
    let newLevel = userXP.current_level;
    let leveledUp = false;

    // Calculate level (100 XP per level, exponential scaling after level 10)
    const calculateLevel = (totalXP) => {
      if (totalXP < 1000) {
        return Math.floor(totalXP / 100) + 1;
      }
      // Exponential scaling: level 10 = 1000 XP, level 20 = 5000 XP, level 30 = 15000 XP
      let level = 10;
      let xpForLevel = 1000;
      while (xpForLevel < totalXP) {
        level++;
        xpForLevel += Math.floor(100 * Math.pow(1.2, level - 10));
      }
      return level;
    };

    const calculatedLevel = calculateLevel(newTotalXP);
    if (calculatedLevel > newLevel) {
      leveledUp = true;
      newLevel = calculatedLevel;
    }

    // Calculate XP needed for next level
    const xpForCurrentLevel = newLevel === 1 ? 0 : 
      newLevel <= 10 ? (newLevel - 1) * 100 :
      (() => {
        let xp = 1000;
        for (let l = 11; l < newLevel; l++) {
          xp += Math.floor(100 * Math.pow(1.2, l - 10));
        }
        return xp;
      })();
    
    const xpForNextLevel = newLevel <= 10 ? newLevel * 100 :
      (() => {
        let xp = 1000;
        for (let l = 11; l <= newLevel; l++) {
          xp += Math.floor(100 * Math.pow(1.2, l - 10));
        }
        return xp;
      })();
    
    const xpToNextLevel = xpForNextLevel - newTotalXP;

    // Update user XP
    await pool.query(
      `UPDATE user_xp 
       SET total_xp = $1, current_level = $2, xp_to_next_level = $3, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [newTotalXP, newLevel, xpToNextLevel, userId]
    );

    // Log XP transaction
    await pool.query(
      `INSERT INTO xp_transactions (user_id, xp_amount, source, source_id, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, xpAmount, source, sourceId, description]
    );

    // Check and award achievements
    await checkAchievements(userId, source, sourceId);

    // Update mission progress
    await updateMissionProgress(userId, source, sourceId);

    return { leveledUp, newLevel: leveledUp ? newLevel : undefined };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return { leveledUp: false };
  }
}

/**
 * Check and award achievements
 */
async function checkAchievements(userId, source, sourceId) {
  try {
    // Get user stats
    const xpResult = await pool.query(
      `SELECT * FROM user_xp WHERE user_id = $1`,
      [userId]
    );

    if (xpResult.rows.length === 0) return;

    const stats = xpResult.rows[0];

    // Get relevant achievements
    const achievements = await pool.query(
      `SELECT * FROM achievements WHERE active = true AND (
        (requirement_type = 'total_spins' AND $1 >= requirement_value) OR
        (requirement_type = 'total_raffle_entries' AND $2 >= requirement_value) OR
        (requirement_type = 'total_giveaways' AND $3 >= requirement_value) OR
        (requirement_type = 'total_sites_linked' AND $4 >= requirement_value) OR
        (requirement_type = 'streak_days' AND $5 >= requirement_value) OR
        (requirement_type = 'level_reached' AND $6 >= requirement_value)
      )`,
      [
        stats.total_spins || 0,
        stats.total_raffle_entries || 0,
        stats.total_giveaways_entered || 0,
        stats.total_sites_linked || 0,
        stats.current_streak || 0,
        stats.current_level || 1,
      ]
    );

    // Award achievements
    for (const achievement of achievements.rows) {
      const existing = await pool.query(
        `SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2`,
        [userId, achievement.id]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_id, progress, completed, completed_at)
           VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)`,
          [userId, achievement.id, achievement.requirement_value]
        );

        // Award XP for achievement
        if (achievement.xp_reward > 0) {
          await awardXP(userId, achievement.xp_reward, 'achievement', achievement.id.toString(), `Achievement: ${achievement.title}`);
        }
      }
    }
  } catch (error) {
    console.error("Error checking achievements:", error);
  }
}

/**
 * Update mission progress
 */
async function updateMissionProgress(userId, source, sourceId) {
  try {
    // Get active missions for user
    const missions = await pool.query(
      `SELECT m.*, um.progress, um.completed, um.expires_at
       FROM missions m
       LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = $1
       WHERE m.active = true
       AND (m.start_date IS NULL OR m.start_date <= CURRENT_DATE)
       AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
       AND (um.completed IS NULL OR um.completed = false)
       AND (um.expires_at IS NULL OR um.expires_at > CURRENT_TIMESTAMP)`,
      [userId]
    );

    for (const mission of missions.rows) {
      // Check if mission requirement matches source
      if (mission.requirement_type === source || 
          (source === 'wheel_spin' && mission.requirement_type === 'spin_wheel') ||
          (source === 'raffle_entry' && mission.requirement_type === 'enter_raffle') ||
          (source === 'giveaway_entry' && mission.requirement_type === 'enter_giveaway') ||
          (source === 'account_linked' && mission.requirement_type === 'link_site')) {
        
        const currentProgress = mission.progress || 0;
        const newProgress = currentProgress + 1;
        let userMissionId = mission.id; // Use mission.id as fallback

        if (mission.user_mission_id) {
          // Update existing
          userMissionId = mission.user_mission_id;
          await pool.query(
            `UPDATE user_missions SET progress = $1 WHERE id = $2`,
            [newProgress, userMissionId]
          );
        } else {
          // Create new
          const expiresAt = mission.mission_type === 'daily' 
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : mission.mission_type === 'weekly'
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : null;

          const insertResult = await pool.query(
            `INSERT INTO user_missions (user_id, mission_id, progress, expires_at)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [userId, mission.id, newProgress, expiresAt]
          );
          userMissionId = insertResult.rows[0].id;
        }

        // Check if completed
        if (newProgress >= mission.requirement_value) {
          await pool.query(
            `UPDATE user_missions SET completed = true, completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [userMissionId]
          );

          // Award XP
          const totalXP = mission.xp_reward + (mission.bonus_xp || 0);
          await awardXP(userId, totalXP, 'mission_complete', mission.id.toString(), `Mission: ${mission.title}`);
        }
      }
    }
  } catch (error) {
    console.error("Error updating mission progress:", error);
  }
}

/**
 * GET /api/gamification/achievements
 * Get user achievements
 */
router.get("/achievements", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.user_id || req.headers["x-user-id"] || "guest";

    const result = await pool.query(
      `SELECT a.*, ua.progress, ua.completed, ua.completed_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       WHERE a.active = true
       ORDER BY a.rarity DESC, a.id ASC`,
      [userId]
    );

    res.status(200).json(
      result.rows.map(row => ({
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        icon: row.icon,
        xp_reward: row.xp_reward,
        category: row.category,
        rarity: row.rarity,
        progress: row.progress || 0,
        completed: row.completed || false,
        completed_at: row.completed_at ? row.completed_at.toISOString() : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({
      error: "Failed to fetch achievements",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/gamification/missions
 * Get user missions
 */
router.get("/missions", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.user_id || req.headers["x-user-id"] || "guest";

    const result = await pool.query(
      `SELECT m.*, um.id as user_mission_id, um.progress, um.completed, um.completed_at, um.expires_at
       FROM missions m
       LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = $1
       WHERE m.active = true
       AND (m.start_date IS NULL OR m.start_date <= CURRENT_DATE)
       AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
       AND (um.id IS NULL OR um.expires_at IS NULL OR um.expires_at > CURRENT_TIMESTAMP)
       ORDER BY m.mission_type, m.id ASC`,
      [userId]
    );

    res.status(200).json(
      result.rows.map(row => ({
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        mission_type: row.mission_type,
        requirement_type: row.requirement_type,
        requirement_value: row.requirement_value,
        xp_reward: row.xp_reward,
        bonus_xp: row.bonus_xp,
        progress: row.progress || 0,
        completed: row.completed || false,
        completed_at: row.completed_at ? row.completed_at.toISOString() : null,
        expires_at: row.expires_at ? row.expires_at.toISOString() : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching missions:", error);
    res.status(500).json({
      error: "Failed to fetch missions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Update user streak
 */
export async function updateStreak(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const streakResult = await pool.query(
      `SELECT * FROM user_streaks WHERE user_id = $1`,
      [userId]
    );

    if (streakResult.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
         VALUES ($1, 1, 1, $2)`,
        [userId, today]
      );
      return { current_streak: 1, streak_bonus: 0 };
    }

    const streak = streakResult.rows[0];
    const lastActivity = streak.last_activity_date 
      ? new Date(streak.last_activity_date).toISOString().split('T')[0]
      : null;

    let newStreak = streak.current_streak || 0;
    let streakBonus = 0;

    if (lastActivity === today) {
      // Already counted today
      return { current_streak: newStreak, streak_bonus: 0 };
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (lastActivity === yesterday) {
      // Continue streak
      newStreak = (streak.current_streak || 0) + 1;
    } else {
      // Reset streak
      newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, streak.longest_streak || 0);

    // Calculate streak bonus (10% per day, max 100%)
    streakBonus = Math.min(newStreak * 10, 100);

    await pool.query(
      `UPDATE user_streaks 
       SET current_streak = $1, longest_streak = $2, last_activity_date = $3, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [newStreak, longestStreak, today, userId]
    );

    // Update user_xp table
    await pool.query(
      `UPDATE user_xp SET current_streak = $1, longest_streak = $2, last_activity_date = $3 WHERE user_id = $4`,
      [newStreak, longestStreak, today, userId]
    );

    return { current_streak: newStreak, streak_bonus: streakBonus };
  } catch (error) {
    console.error("Error updating streak:", error);
    return { current_streak: 0, streak_bonus: 0 };
  }
}

export default router;
