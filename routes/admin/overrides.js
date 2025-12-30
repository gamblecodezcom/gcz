import express from "express";
import pool from "../../utils/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// Helper to log admin override actions
/**
 * @typedef {Object} AdminOverrideLog
 * @property {string} admin_user
 * @property {string} action
 * @property {string} resource_type
 * @property {string} resource_id
 * @property {Object} details
 * @property {string} ip_address
 * @property {string} user_agent
 */
async function logAdminOverride(req, action, resourceType, resourceId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_user, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.headers["x-admin-user"] || "unknown",
        `OVERRIDE_${action}`,
        resourceType,
        resourceId,
        JSON.stringify({ ...details, override: true }),
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || ""
      ]
    );
  } catch (error) {
    console.error("Failed to log admin override:", error);
  }
}

/**
 * POST /api/admin/overrides/user-spin
 * Admin override: Force a user to spin the wheel (bypass 24h cooldown)
 * 
 * @route POST /api/admin/overrides/user-spin
 * @param {Object} req.body
 * @param {string} req.body.user_id - User ID to override
 * @param {number} [req.body.entries] - Optional entries to add
 * @returns {Promise<{success: boolean, message: string, spinResult?: Object}>} 200 - Success
 * @returns {Promise<{error: string}>} 400 - Missing user_id
 * @returns {Promise<{error: string}>} 404 - User not found
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/user-spin", auth, async (req, res) => {
  try {
    const { user_id, entries } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }
    
    // Verify user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get wheel config
    const wheelConfig = await pool.query(
      "SELECT * FROM wheel_config WHERE id = 1"
    );
    
    const config = wheelConfig.rows[0] || { prize_slots: [] };
    const prizeSlots = Array.isArray(config.prize_slots) ? config.prize_slots : [];
    
    // Select random prize (simplified - would use actual wheel logic)
    const randomPrize = prizeSlots.length > 0 
      ? prizeSlots[Math.floor(Math.random() * prizeSlots.length)]
      : { label: "5 Entries", entry_multiplier: 5 };
    
    const entriesToAdd = entries || (randomPrize.entry_multiplier || 5);
    const isJackpot = randomPrize.label?.toLowerCase().includes("jackpot") || false;
    
    // Log the spin
    await pool.query(
      `INSERT INTO spin_logs (user_id, reward, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [
        user_id,
        randomPrize.label || `${entriesToAdd} Entries`,
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || ""
      ]
    );
    
    // Add entries to active raffles if target_raffle_id is set
    if (config.target_raffle_id) {
      const activeRaffles = await pool.query(
        `SELECT id FROM raffles 
         WHERE active = true 
         AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP)
         AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)`
      );
      
      for (const raffle of activeRaffles.rows) {
        await pool.query(
          `INSERT INTO raffle_entries (raffle_id, user_id, entry_time, entry_source)
           VALUES ($1, $2, CURRENT_TIMESTAMP, 'manual')
           ON CONFLICT (raffle_id, user_id) DO NOTHING`,
          [raffle.id, user_id]
        );
      }
    }
    
    // Log activity
    await pool.query(
      `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
       VALUES ($1, 'wheel_spin', 'Wheel Spin (Admin Override)', 'Admin granted wheel spin', CURRENT_TIMESTAMP)`,
      [user_id]
    );
    
    await logAdminOverride(req, "USER_SPIN", "user", user_id, { entries: entriesToAdd, isJackpot });
    
    res.status(200).json({
      success: true,
      message: "Wheel spin granted via admin override",
      spinResult: {
        reward: randomPrize.label || `${entriesToAdd} Entries`,
        jackpot: isJackpot,
        entriesAdded: entriesToAdd
      }
    });
  } catch (error) {
    console.error("Error in admin override user-spin:", error);
    res.status(500).json({
      error: "Failed to grant wheel spin",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/overrides/user-entries
 * Admin override: Add raffle entries to a user
 * 
 * @route POST /api/admin/overrides/user-entries
 * @param {Object} req.body
 * @param {string} req.body.user_id - User ID
 * @param {number} req.body.entries - Number of entries to add
 * @param {number} [req.body.raffle_id] - Specific raffle ID (optional, adds to all active if not provided)
 * @returns {Promise<{success: boolean, message: string, entriesAdded: number}>} 200 - Success
 * @returns {Promise<{error: string}>} 400 - Missing required fields
 * @returns {Promise<{error: string}>} 404 - User or raffle not found
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/user-entries", auth, async (req, res) => {
  try {
    const { user_id, entries, raffle_id } = req.body;
    
    if (!user_id || !entries || entries <= 0) {
      return res.status(400).json({ error: "user_id and positive entries count required" });
    }
    
    // Verify user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    let rafflesToUpdate = [];
    
    if (raffle_id) {
      // Specific raffle
      const raffleResult = await pool.query(
        "SELECT * FROM raffles WHERE id = $1",
        [raffle_id]
      );
      
      if (raffleResult.rows.length === 0) {
        return res.status(404).json({ error: "Raffle not found" });
      }
      
      rafflesToUpdate = [raffleResult.rows[0]];
    } else {
      // All active raffles
      const activeRaffles = await pool.query(
        `SELECT * FROM raffles 
         WHERE active = true 
         AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP)
         AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)`
      );
      
      rafflesToUpdate = activeRaffles.rows;
    }
    
    let totalEntriesAdded = 0;
    
    for (const raffle of rafflesToUpdate) {
      // Add entries (multiple entries per user allowed if allow_repeat_winners is true)
      for (let i = 0; i < entries; i++) {
        await pool.query(
          `INSERT INTO raffle_entries (raffle_id, user_id, entry_time, entry_source)
           VALUES ($1, $2, CURRENT_TIMESTAMP, 'manual')
           ON CONFLICT (raffle_id, user_id) DO UPDATE SET entry_time = CURRENT_TIMESTAMP`,
          [raffle.id, user_id]
        );
        totalEntriesAdded++;
      }
    }
    
    // Log activity
    await pool.query(
      `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
       VALUES ($1, 'raffle_entry', 'Raffle Entries Added (Admin Override)', 
               'Admin added ${entries} entries to ${rafflesToUpdate.length} raffle(s)', CURRENT_TIMESTAMP)`,
      [user_id]
    );
    
    await logAdminOverride(req, "USER_ENTRIES", "user", user_id, { 
      entries, 
      raffle_id: raffle_id || "all_active",
      totalEntriesAdded 
    });
    
    res.status(200).json({
      success: true,
      message: `Added ${totalEntriesAdded} entries to ${rafflesToUpdate.length} raffle(s)`,
      entriesAdded: totalEntriesAdded
    });
  } catch (error) {
    console.error("Error in admin override user-entries:", error);
    res.status(500).json({
      error: "Failed to add entries",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/overrides/unlock-user
 * Admin override: Unlock a locked user account
 * 
 * @route POST /api/admin/overrides/unlock-user
 * @param {Object} req.body
 * @param {string} req.body.user_id - User ID to unlock
 * @returns {Promise<{success: boolean, message: string, user: Object}>} 200 - Success
 * @returns {Promise<{error: string}>} 400 - Missing user_id
 * @returns {Promise<{error: string}>} 404 - User not found
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/unlock-user", auth, async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }
    
    const result = await pool.query(
      "UPDATE users SET locked = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *",
      [user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    await logAdminOverride(req, "UNLOCK_USER", "user", user_id);
    
    res.status(200).json({
      success: true,
      message: "User unlocked successfully",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Error in admin override unlock-user:", error);
    res.status(500).json({
      error: "Failed to unlock user",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/overrides/reset-pin
 * Admin override: Reset user PIN (bypass PIN verification)
 * 
 * @route POST /api/admin/overrides/reset-pin
 * @param {Object} req.body
 * @param {string} req.body.user_id - User ID
 * @param {string} [req.body.new_pin] - Optional new PIN to set
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success
 * @returns {Promise<{error: string}>} 400 - Missing user_id
 * @returns {Promise<{error: string}>} 404 - User not found
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/reset-pin", auth, async (req, res) => {
  try {
    const { user_id, new_pin } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }
    
    let pinHash = null;
    if (new_pin) {
      const crypto = await import("crypto");
      pinHash = crypto.createHash("sha256").update(new_pin).digest("hex");
    }
    
    const result = await pool.query(
      "UPDATE users SET pin_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *",
      [pinHash, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    await logAdminOverride(req, "RESET_PIN", "user", user_id, { 
      action: new_pin ? "set_new_pin" : "clear_pin" 
    });
    
    res.status(200).json({
      success: true,
      message: new_pin ? "PIN reset and new PIN set" : "PIN cleared successfully"
    });
  } catch (error) {
    console.error("Error in admin override reset-pin:", error);
    res.status(500).json({
      error: "Failed to reset PIN",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/overrides/remove-blacklist
 * Admin override: Remove user from blacklist
 * 
 * @route POST /api/admin/overrides/remove-blacklist
 * @param {Object} req.body
 * @param {string} req.body.user_id - User ID to remove from blacklist
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success
 * @returns {Promise<{error: string}>} 400 - Missing user_id
 * @returns {Promise<{error: string}>} 404 - User not in blacklist
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/remove-blacklist", auth, async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }
    
    const result = await pool.query(
      "DELETE FROM blacklist WHERE user_id = $1 RETURNING *",
      [user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found in blacklist" });
    }
    
    await logAdminOverride(req, "REMOVE_BLACKLIST", "blacklist", user_id);
    
    res.status(200).json({
      success: true,
      message: "User removed from blacklist successfully"
    });
  } catch (error) {
    console.error("Error in admin override remove-blacklist:", error);
    res.status(500).json({
      error: "Failed to remove from blacklist",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/overrides/force-winner
 * Admin override: Manually select a raffle winner
 * 
 * @route POST /api/admin/overrides/force-winner
 * @param {Object} req.body
 * @param {number} req.body.raffle_id - Raffle ID
 * @param {string} req.body.user_id - User ID to select as winner
 * @param {string} [req.body.prize] - Optional prize description
 * @returns {Promise<{success: boolean, message: string, winner: Object}>} 200 - Success
 * @returns {Promise<{error: string}>} 400 - Missing required fields
 * @returns {Promise<{error: string}>} 404 - Raffle or user not found
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/force-winner", auth, async (req, res) => {
  try {
    const { raffle_id, user_id, prize } = req.body;
    
    if (!raffle_id || !user_id) {
      return res.status(400).json({ error: "raffle_id and user_id are required" });
    }
    
    // Verify raffle exists
    const raffleResult = await pool.query(
      "SELECT * FROM raffles WHERE id = $1",
      [raffle_id]
    );
    
    if (raffleResult.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }
    
    // Verify user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if already a winner
    const existingWinner = await pool.query(
      "SELECT * FROM raffle_winners WHERE raffle_id = $1 AND winner = $2",
      [raffle_id, user_id]
    );
    
    if (existingWinner.rows.length > 0) {
      return res.status(409).json({ error: "User is already a winner for this raffle" });
    }
    
    // Add winner
    const winnerResult = await pool.query(
      `INSERT INTO raffle_winners (raffle_id, winner, prize, won_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [raffle_id, user_id, prize || raffleResult.rows[0].prize_value]
    );
    
    // Log activity
    await pool.query(
      `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
       VALUES ($1, 'reward_logged', 'Raffle Winner (Admin Override)', 
               'Selected as winner for raffle: ${raffleResult.rows[0].title}', CURRENT_TIMESTAMP)`,
      [user_id]
    );
    
    await logAdminOverride(req, "FORCE_WINNER", "raffle", raffle_id.toString(), { 
      user_id, 
      prize: prize || raffleResult.rows[0].prize_value 
    });
    
    res.status(200).json({
      success: true,
      message: "Winner selected successfully",
      winner: winnerResult.rows[0]
    });
  } catch (error) {
    console.error("Error in admin override force-winner:", error);
    res.status(500).json({
      error: "Failed to select winner",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
