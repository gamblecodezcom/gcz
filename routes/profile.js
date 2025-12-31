import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest, requireUser, requirePin } from "../middleware/userAuth.js";
import crypto from "crypto";

const router = express.Router();

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} [username]
 * @property {string} [cwallet_id]
 * @property {string} [email]
 * @property {string} [telegram_username]
 * @property {string} [telegram_id]
 * @property {'US'|'NON_US'|'GLOBAL'} [jurisdiction]
 * @property {boolean} hasRaffleAccess
 * @property {boolean} newsletterAgreed
 */

/**
 * @typedef {Object} ProfileResponse
 * @property {User} user
 * @property {boolean} rafflePinSet
 */

/**
 * GET /api/profile
 * Get user profile
 * 
 * @route GET /api/profile
 * @returns {Promise<ProfileResponse>} 200 - Success response with user profile
 * @returns {Promise<{error: string, message?: string}>} 401 - Authentication required
 * @returns {Promise<{error: string, message: string}>} 403 - Account blacklisted
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check blacklist
    const blacklistCheck = await pool.query(
      "SELECT * FROM blacklist WHERE user_id = $1",
      [user.user_id]
    );
    
    if (blacklistCheck.rows.length > 0) {
      return res.status(403).json({
        error: "Access denied",
        message: "Your account has been blacklisted"
      });
    }
    
    // Get linked sites count
    const linkedSitesResult = await pool.query(
      "SELECT COUNT(*) as count FROM user_linked_sites WHERE user_id = $1",
      [user.user_id]
    );
    
    // Get raffle entries count
    const raffleEntriesResult = await pool.query(
      "SELECT COUNT(*) as count FROM raffle_entries WHERE user_id = $1",
      [user.user_id]
    );
    
    // Check newsletter subscription
    const newsletterResult = await pool.query(
      "SELECT * FROM newsletter_subscribers WHERE user_id = $1 AND unsubscribed = false",
      [user.user_id]
    );
    
    res.status(200).json({
      user: {
        id: user.user_id,
        username: user.username || null,
        cwallet_id: user.cwallet_id || null,
        email: user.email || null,
        telegram_username: user.telegram_username || null,
        telegram_id: user.telegram_id || null,
        jurisdiction: user.jurisdiction || null,
        hasRaffleAccess: raffleEntriesResult.rows[0]?.count > 0 || false,
        newsletterAgreed: newsletterResult.rows.length > 0,
      },
      rafflePinSet: !!user.pin_hash,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ 
      error: "Failed to fetch profile",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/update
 * Update user profile
 * 
 * @route POST /api/profile/update
 * @param {Object} req.body
 * @param {string} [req.body.username] - New username
 * @param {string} [req.body.cwallet_id] - New Cwallet ID
 * @param {string} [req.body.email] - New email
 * @returns {Promise<{user: User}>} 200 - Success response with updated user
 * @returns {Promise<{error: string}>} 400 - No fields to update
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/update", requireUser, async (req, res) => {
  try {
    const { username, cwallet_id, email } = req.body;
    const userId = req.user.user_id;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    
    if (cwallet_id !== undefined) {
      updates.push(`cwallet_id = $${paramIndex++}`);
      values.push(cwallet_id);
    }
    
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);
    
    const query = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    // Log activity
    if (username !== undefined) {
      await pool.query(
        `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
         VALUES ($1, 'username_changed', 'Username Updated', 'Changed username to ' || $2, CURRENT_TIMESTAMP)`,
        [userId, username]
      );
    }
    
    if (cwallet_id !== undefined) {
      await pool.query(
        `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
         VALUES ($1, 'cwallet_updated', 'Cwallet Updated', 'Updated Cwallet ID', CURRENT_TIMESTAMP)`,
        [userId]
      );
    }
    
    res.status(200).json({
      user: {
        id: result.rows[0].user_id,
        username: result.rows[0].username,
        cwallet_id: result.rows[0].cwallet_id,
        email: result.rows[0].email,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ 
      error: "Failed to update profile",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/pin
 * Set raffle PIN
 * 
 * @route POST /api/profile/pin
 * @param {Object} req.body
 * @param {string} req.body.pin - PIN (4-6 digits)
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success response
 * @returns {Promise<{error: string}>} 400 - Invalid PIN format
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/pin", requireUser, async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.user.user_id;
    
    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be 4-6 digits" });
    }
    
    const pinHash = crypto.createHash("sha256").update(pin).digest("hex");
    
    await pool.query(
      "UPDATE users SET pin_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [pinHash, userId]
    );
    
    res.status(200).json({ success: true, message: "PIN set successfully" });
  } catch (error) {
    console.error("Error setting PIN:", error);
    res.status(500).json({ 
      error: "Failed to set PIN",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/verify-pin
 * Verify PIN
 * 
 * @route POST /api/profile/verify-pin
 * @param {Object} req.body
 * @param {string} req.body.pin - PIN to verify
 * @returns {Promise<{success: boolean, message?: string}>} 200 - Success response
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/verify-pin", requireUser, async (req, res) => {
  try {
    const { pin } = req.body;
    const user = req.user;
    
    if (!user.pin_hash) {
      return res.json({ success: false, message: "PIN not set" });
    }
    
    const hash = crypto.createHash("sha256").update(pin).digest("hex");
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(user.pin_hash)
    );
    
    res.status(200).json({ success: isValid });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    res.status(500).json({ 
      error: "Failed to verify PIN",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/change-pin
 * Change existing PIN
 * 
 * @route POST /api/profile/change-pin
 * @param {Object} req.body
 * @param {string} req.body.oldPin - Current PIN for verification
 * @param {string} req.body.newPin - New PIN (4-6 digits)
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success response
 * @returns {Promise<{error: string}>} 400 - Invalid PIN format
 * @returns {Promise<{error: string}>} 401 - Authentication or PIN required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/change-pin", requireUser, async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    const user = req.user;
    const userId = user.user_id;
    
    if (!user.pin_hash) {
      return res.status(403).json({ error: "PIN not set. Please set your PIN first." });
    }
    
    if (!oldPin) {
      return res.status(400).json({ error: "Current PIN is required" });
    }
    
    if (!newPin || newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      return res.status(400).json({ error: "New PIN must be 4-6 digits" });
    }
    
    // Verify old PIN
    const oldPinHash = crypto.createHash("sha256").update(oldPin).digest("hex");
    const isValid = crypto.timingSafeEqual(
      Buffer.from(oldPinHash),
      Buffer.from(user.pin_hash)
    );
    
    if (!isValid) {
      return res.status(401).json({ error: "Invalid current PIN" });
    }
    
    // Update to new PIN
    const newPinHash = crypto.createHash("sha256").update(newPin).digest("hex");
    
    await pool.query(
      "UPDATE users SET pin_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [newPinHash, userId]
    );
    
    res.status(200).json({ success: true, message: "PIN changed successfully" });
  } catch (error) {
    console.error("Error changing PIN:", error);
    res.status(500).json({ 
      error: "Failed to change PIN",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/logout-all
 * Logout all sessions (placeholder)
 * 
 * @route POST /api/profile/logout-all
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success response
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/logout-all", requireUser, async (req, res) => {
  try {
    // In a real implementation, you would invalidate all session tokens
    // For now, this is a placeholder
    res.status(200).json({ success: true, message: "All sessions logged out" });
  } catch (error) {
    console.error("Error logging out sessions:", error);
    res.status(500).json({ 
      error: "Failed to logout sessions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/delete-account
 * Delete account
 * 
 * @route POST /api/profile/delete-account
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success response
 * @returns {Promise<{error: string}>} 401 - Authentication or PIN required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/delete-account", requirePin, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Delete user data (cascade will handle related records)
    await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);
    
    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ 
      error: "Failed to delete account",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/profile/rewards
 * Get all rewards aggregated from all reward types
 * 
 * @route GET /api/profile/rewards
 * @returns {Promise<Reward[]>} 200 - Success response with rewards array
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/rewards", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Fetch all reward types
    const [runewagerResult, cryptoResult, lootboxResult, telegramResult] = await Promise.allSettled([
      pool.query(
        "SELECT id, 'runewager_sc' as type, 'logged' as status, created_at FROM runewager_tips WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      ),
      pool.query(
        "SELECT id, 'crypto' as type, status, created_at FROM crypto_tips WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      ),
      pool.query(
        "SELECT id, 'lootbox' as type, status, created_at FROM lootbox_rewards WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      ),
      pool.query(
        "SELECT id, 'telegram' as type, 'completed' as status, sent_at as created_at FROM telegram_notifications WHERE user_id = $1 ORDER BY sent_at DESC",
        [userId]
      ),
    ]);
    
    const rewards = [];
    
    if (runewagerResult.status === 'fulfilled') {
      rewards.push(...runewagerResult.value.rows.map(row => ({
        id: row.id.toString(),
        type: row.type,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      })));
    }
    
    if (cryptoResult.status === 'fulfilled') {
      rewards.push(...cryptoResult.value.rows.map(row => ({
        id: row.id.toString(),
        type: row.type,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      })));
    }
    
    if (lootboxResult.status === 'fulfilled') {
      rewards.push(...lootboxResult.value.rows.map(row => ({
        id: row.id.toString(),
        type: row.type,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      })));
    }
    
    if (telegramResult.status === 'fulfilled') {
      rewards.push(...telegramResult.value.rows.map(row => ({
        id: row.id.toString(),
        type: row.type,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      })));
    }
    
    // Sort by created_at descending
    rewards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json(rewards);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ 
      error: "Failed to fetch rewards",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/profile/rewards/runewager
 * Get Runewager SC tips
 * 
 * @route GET /api/profile/rewards/runewager
 * @returns {Promise<RunewagerTip[]>} 200 - Success response with tips array
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/rewards/runewager", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await pool.query(
      `SELECT 
        id,
        username,
        email,
        amount,
        status,
        note,
        admin_name as "adminName",
        created_at as "createdAt"
       FROM runewager_tips 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.status(200).json(
      result.rows.map(row => ({
        id: row.id.toString(),
        username: row.username || null,
        email: row.email || null,
        amount: row.amount.toString(),
        status: row.status,
        note: row.note || null,
        adminName: row.adminName || null,
        createdAt: row.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching Runewager tips:", error);
    res.status(500).json({ 
      error: "Failed to fetch Runewager tips",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/profile/rewards/crypto
 * Get crypto tips
 * 
 * @route GET /api/profile/rewards/crypto
 * @returns {Promise<CryptoTip[]>} 200 - Success response with tips array
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/rewards/crypto", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await pool.query(
      `SELECT 
        id,
        asset,
        amount,
        delivery_method as "deliveryMethod",
        status,
        tx_hash as "txHash",
        note,
        created_at as "createdAt"
       FROM crypto_tips 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.status(200).json(
      result.rows.map(row => ({
        id: row.id.toString(),
        asset: row.asset,
        amount: row.amount.toString(),
        deliveryMethod: row.deliveryMethod,
        status: row.status,
        txHash: row.txHash || null,
        note: row.note || null,
        createdAt: row.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching crypto tips:", error);
    res.status(500).json({ 
      error: "Failed to fetch crypto tips",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/profile/rewards/lootbox
 * Get lootbox rewards
 * 
 * @route GET /api/profile/rewards/lootbox
 * @returns {Promise<LootboxReward[]>} 200 - Success response with rewards array
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/rewards/lootbox", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await pool.query(
      `SELECT 
        id,
        site,
        prize_type as "prizeType",
        claim_url as "claimUrl",
        status,
        expires_at as "expiresAt",
        created_at as "createdAt"
       FROM lootbox_rewards 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.status(200).json(
      result.rows.map(row => ({
        id: row.id.toString(),
        site: row.site,
        prizeType: row.prizeType,
        claimUrl: row.claimUrl,
        status: row.status,
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching lootbox rewards:", error);
    res.status(500).json({ 
      error: "Failed to fetch lootbox rewards",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/profile/rewards/telegram
 * Get Telegram notifications
 * 
 * @route GET /api/profile/rewards/telegram
 * @returns {Promise<TelegramNotification[]>} 200 - Success response with notifications array
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/rewards/telegram", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await pool.query(
      `SELECT 
        id,
        telegram_username as "telegramUsername",
        telegram_id as "telegramId",
        type,
        title,
        body,
        sent_at as "sentAt"
       FROM telegram_notifications 
       WHERE user_id = $1 
       ORDER BY sent_at DESC`,
      [userId]
    );
    
    res.status(200).json(
      result.rows.map(row => ({
        id: row.id.toString(),
        telegramUsername: row.telegramUsername || null,
        telegramId: row.telegramId || null,
        type: row.type,
        title: row.title,
        body: row.body,
        sentAt: row.sentAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching Telegram notifications:", error);
    res.status(500).json({ 
      error: "Failed to fetch Telegram notifications",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/profile/crypto-addresses
 * Get crypto addresses (PIN required - sensitive data)
 * 
 * @route GET /api/profile/crypto-addresses
 * @returns {Promise<{btc_address, eth_address, sol_address, usdt_address}>} 200 - Success response
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 403 - PIN required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/crypto-addresses", requirePin, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await pool.query(
      `SELECT btc_address, eth_address, sol_address, usdt_address 
       FROM crypto_addresses 
       WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(200).json({
        btc_address: null,
        eth_address: null,
        sol_address: null,
        usdt_address: null
      });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching crypto addresses:", error);
    res.status(500).json({ 
      error: "Failed to fetch crypto addresses",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/crypto-addresses
 * Update crypto addresses (BTC, ETH, SOL, USDT) - PIN required
 * 
 * @route POST /api/profile/crypto-addresses
 * @param {Object} req.body
 * @param {string} [req.body.btc] - Bitcoin address
 * @param {string} [req.body.eth] - Ethereum address
 * @param {string} [req.body.sol] - Solana address
 * @param {string} [req.body.usdt] - USDT address
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success response
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 403 - PIN required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/crypto-addresses", requirePin, async (req, res) => {
  try {
    const { btc, eth, sol, usdt } = req.body;
    const userId = req.user.user_id;
    
    // Insert or update crypto addresses
    await pool.query(
      `INSERT INTO crypto_addresses (user_id, btc_address, eth_address, sol_address, usdt_address, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         btc_address = COALESCE(EXCLUDED.btc_address, crypto_addresses.btc_address),
         eth_address = COALESCE(EXCLUDED.eth_address, crypto_addresses.eth_address),
         sol_address = COALESCE(EXCLUDED.sol_address, crypto_addresses.sol_address),
         usdt_address = COALESCE(EXCLUDED.usdt_address, crypto_addresses.usdt_address),
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        btc || null,
        eth || null,
        sol || null,
        usdt || null
      ]
    );
    
    // Log activity
    await pool.query(
      `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
       VALUES ($1, 'crypto_addresses_updated', 'Crypto Addresses Updated', 'Updated crypto wallet addresses', CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [userId]
    );
    
    res.status(200).json({ 
      success: true, 
      message: "Crypto addresses updated successfully" 
    });
  } catch (error) {
    console.error("Error updating crypto addresses:", error);
    res.status(500).json({ 
      error: "Failed to update crypto addresses",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
