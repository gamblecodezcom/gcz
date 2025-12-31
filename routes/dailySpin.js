import express from "express";
import { handleDailySpin, checkEligibility } from "../controllers/dailySpinController.js";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";
import { awardXP, updateStreak } from "./gamification.js";
import { broadcastToUser } from "./realtime.js";
import { notifyWheelSpin } from "../bot/services/notifications.js";
import { addRaffleEntries, addEntriesToActiveRaffles, getPrimaryEndlessRaffle } from "../utils/raffleEntries.js";

const router = express.Router();

/**
 * @typedef {Object} WheelEligibility
 * @property {boolean} eligible
 * @property {string} [nextSpin] - ISO timestamp
 * @property {number} [hoursUntilNext]
 */

/**
 * GET /api/daily-spin/eligibility
 * Check wheel spin eligibility
 * 
 * @route GET /api/daily-spin/eligibility
 * @returns {Promise<WheelEligibility>} 200 - Success response with eligibility status
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/eligibility", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.user_id || req.query.user_id || req.headers["x-user-id"] || "guest";
    
    const check = await pool.query(
      `SELECT created_at FROM spin_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (check.rows.length === 0) {
      return res.status(200).json({ eligible: true });
    }

    const last = new Date(check.rows[0].created_at);
    const now = new Date();
    const diff = now - last;
    const hoursUntilNext = 24 - (diff / (1000 * 60 * 60));
    
    if (diff < 24 * 60 * 60 * 1000) {
      const nextSpin = new Date(last.getTime() + 24 * 60 * 60 * 1000);
      return res.status(200).json({ 
        eligible: false, 
        nextSpin: nextSpin.toISOString(),
        hoursUntilNext: Math.max(0, hoursUntilNext)
      });
    }

    return res.status(200).json({ eligible: true });
  } catch (error) {
    console.error("Eligibility check error:", error);
    return res.status(500).json({ 
      error: "Server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * @typedef {Object} WheelSpinResult
 * @property {number|string} reward
 * @property {boolean} jackpot
 * @property {number} [entriesAdded]
 */

/**
 * POST /api/daily-spin/spin
 * Spin the wheel
 * 
 * @route POST /api/daily-spin/spin
 * @returns {Promise<WheelSpinResult>} 200 - Success response with spin result
 * @returns {Promise<{error: string}>} 429 - Daily spin already used
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/spin", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.user_id || req.body.user_id || req.headers["x-user-id"] || "guest";
    const ip = req.headers["x-forwarded-for"] || req.ip;
    const ua = req.headers["user-agent"] || "unknown";

    const check = await pool.query(
      `SELECT created_at FROM spin_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (check.rows.length > 0) {
      const last = new Date(check.rows[0].created_at);
      const now = new Date();
      const diff = now - last;
      if (diff < 24 * 60 * 60 * 1000) {
        return res.status(429).json({ error: "Daily spin already used" });
      }
    }

    // Weighted rewards: [value, chance out of 10,000]
    const rewards = [
      { value: 5, weight: 5000 },
      { value: 10, weight: 2500 },
      { value: 25, weight: 1500 },
      { value: 50, weight: 700 },
      { value: 100, weight: 299 },
      { value: "JACKPOT", weight: 1 }
    ];

    function weightedRandom() {
      const total = rewards.reduce((sum, r) => sum + r.weight, 0);
      let rand = Math.floor(Math.random() * total);
      for (const r of rewards) {
        if (rand < r.weight) return r.value;
        rand -= r.weight;
      }
    }

    const reward = weightedRandom();
    const jackpot = reward === "JACKPOT";
    
    // Log spin
    await pool.query(
      "INSERT INTO spin_logs (user_id, reward, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)",
      [userId, reward.toString(), ip, ua]
    );
    
    // Log activity
    if (user) {
      await pool.query(
        `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
         VALUES ($1, 'wheel_spin', 'Wheel Spin', 'Spun the wheel and won ' || $2, CURRENT_TIMESTAMP)`,
        [userId, reward.toString()]
      );

      // Award XP and update streak
      const xpAmount = jackpot ? 100 : typeof reward === "number" ? reward * 2 : 25;
      await awardXP(userId, xpAmount, 'wheel_spin', null, `Wheel spin: ${reward}`);
      await updateStreak(userId);

      // Update user_xp stats
      await pool.query(
        `UPDATE user_xp SET total_spins = COALESCE(total_spins, 0) + 1 WHERE user_id = $1`,
        [userId]
      );
    }
    
    // Add raffle entries for wheel spin
    let entriesAdded = 0;
    if (user) {
      try {
        // First try to get target raffle from wheel_config
        const wheelConfig = await pool.query(
          "SELECT target_raffle_id FROM wheel_config WHERE id = 1"
        );
        
        let targetRaffle = null;
        if (wheelConfig.rows.length > 0 && wheelConfig.rows[0].target_raffle_id) {
          const raffleResult = await pool.query(
            "SELECT * FROM raffles WHERE id = $1",
            [wheelConfig.rows[0].target_raffle_id]
          );
          if (raffleResult.rows.length > 0) {
            targetRaffle = raffleResult.rows[0];
          }
        } else {
          // Fallback to primary endless raffle
          targetRaffle = await getPrimaryEndlessRaffle(pool);
        }
        
        if (targetRaffle) {
          // Use 'wheel' as the source (not 'wheel_spin')
          await addRaffleEntries(pool, targetRaffle, userId, 'wheel');
          // Calculate entries added by checking multiplier
          let entriesPerSource = targetRaffle.entries_per_source;
          if (typeof entriesPerSource === 'string') {
            try {
              entriesPerSource = JSON.parse(entriesPerSource || '{}');
            } catch (e) {
              entriesPerSource = {};
            }
          }
          entriesAdded = entriesPerSource['wheel'] || 0;
        } else {
          // If no specific raffle, add to all active raffles that accept wheel
          await addEntriesToActiveRaffles(pool, userId, 'wheel');
          // Count total entries added
          const countResult = await pool.query(
            `SELECT COUNT(*) as count FROM raffle_entries 
             WHERE user_id = $1 AND source = 'wheel' 
             AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute'`,
            [userId]
          );
          entriesAdded = parseInt(countResult.rows[0]?.count || 0, 10);
        }
      } catch (error) {
        console.error("Error adding raffle entries from wheel:", error);
        // Non-critical, continue
      }
    }

    // Broadcast real-time update
    const io = req.app.get('io');
    if (io && user) {
      broadcastToUser(io, userId, 'wheel:spin', {
        reward,
        jackpot,
        entriesAdded: entriesAdded > 0 ? entriesAdded : undefined,
        timestamp: new Date().toISOString(),
      });
    }

    // Send Telegram notification
    if (user) {
      notifyWheelSpin(userId, { reward, jackpot, entriesAdded }).catch(err => {
        console.error('Telegram notification error:', err);
      });
    }

    return res.status(200).json({ 
      reward, 
      jackpot,
      entriesAdded: entriesAdded > 0 ? entriesAdded : undefined
    });
  } catch (error) {
    console.error("Spin error:", error);
    return res.status(500).json({ 
      error: "Server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/daily-spin
 * Alias for /api/daily-spin/spin
 * 
 * @route POST /api/daily-spin
 */
router.post("/", async (req, res) => {
  // Redirect to /spin endpoint
  req.url = "/spin";
  router.handle(req, res);
});

export default router;