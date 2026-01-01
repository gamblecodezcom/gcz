import express from "express";
import crypto from "crypto";
import pool from "../utils/db.js";
import {
  getUserFromRequest,
  requireUser,
  requirePin,
} from "../middleware/userAuth.js";

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
 * @property {number} [admin_level]
 */

/**
 * @typedef {Object} ProfileResponse
 * @property {User} user
 * @property {boolean} rafflePinSet
 */

/**
 * GET /api/profile
 * Get user profile
 */
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check blacklist
    const blacklistCheck = await pool.query(
      "SELECT 1 FROM blacklist WHERE user_id = $1",
      [user.user_id]
    );
    if (blacklistCheck.rows.length > 0) {
      return res.status(403).json({
        error: "Access denied",
        message: "Your account has been blacklisted",
      });
    }

    // Linked sites count
    const linkedSitesResult = await pool.query(
      "SELECT COUNT(*) as count FROM user_linked_sites WHERE user_id = $1",
      [user.user_id]
    );

    // Raffle entries count
    const raffleEntriesResult = await pool.query(
      "SELECT COUNT(*) as count FROM raffle_entries WHERE user_id = $1",
      [user.user_id]
    );

    // Newsletter subscription
    const newsletterResult = await pool.query(
      "SELECT 1 FROM newsletter_subscribers WHERE user_id = $1 AND unsubscribed = false",
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
        admin_level: user.admin_level ?? 0,
        linkedSites: parseInt(linkedSitesResult.rows[0]?.count || 0),
      },
      rafflePinSet: !!user.pin_hash,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      error: "Failed to fetch profile",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/update
 * Update user profile
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

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);

    // Activity log
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/pin
 * Set raffle PIN
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/verify-pin
 * Verify PIN
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/change-pin
 * Change existing PIN
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

    const oldPinHash = crypto.createHash("sha256").update(oldPin).digest("hex");
    const isValid = crypto.timingSafeEqual(
      Buffer.from(oldPinHash),
      Buffer.from(user.pin_hash)
    );
    if (!isValid) {
      return res.status(401).json({ error: "Invalid current PIN" });
    }

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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/logout-all
 * Logout all sessions (placeholder)
 */
router.post("/logout-all", requireUser, async (_req, res) => {
  try {
    // Placeholder: token/session invalidation would go here
    res.status(200).json({ success: true, message: "All sessions logged out" });
  } catch (error) {
    console.error("Error logging out sessions:", error);
    res.status(500).json({
      error: "Failed to logout sessions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/delete-account
 * Delete account (PIN required)
 */
router.post("/delete-account", requirePin, async (req, res) => {
  try {
    const userId = req.user.user_id;
    await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);

    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      error: "Failed to delete account",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/rewards
 * Get all rewards aggregated
 */
router.get("/rewards", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [runewagerResult, cryptoResult, lootboxResult, telegramResult] =
      await Promise.allSettled([
        pool.query(
          `SELECT id, 'runewager_sc' as type, 'logged' as status, created_at
           FROM runewager_tips
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [userId]
        ),
        pool.query(
          `SELECT id, 'crypto' as type, status, created_at
           FROM crypto_tips
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [userId]
        ),
        pool.query(
          `SELECT id, 'lootbox' as type, status, created_at
           FROM lootbox_rewards
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [userId]
        ),
        pool.query(
          `SELECT id, 'telegram' as type, 'completed' as status, sent_at as created_at
           FROM telegram_notifications
           WHERE user_id = $1
           ORDER BY sent_at DESC`,
          [userId]
        ),
      ]);

    const rewards = [];

    if (runewagerResult.status === "fulfilled") {
      rewards.push(
        ...runewagerResult.value.rows.map((row) => ({
          id: row.id.toString(),
          type: row.type,
          status: row.status,
          createdAt: row.created_at.toISOString(),
        }))
      );
    }

    if (cryptoResult.status === "fulfilled") {
      rewards.push(
        ...cryptoResult.value.rows.map((row) => ({
          id: row.id.toString(),
          type: row.type,
          status: row.status,
          createdAt: row.created_at.toISOString(),
        }))
      );
    }

    if (lootboxResult.status === "fulfilled") {
      rewards.push(
        ...lootboxResult.value.rows.map((row) => ({
          id: row.id.toString(),
          type: row.type,
          status: row.status,
          createdAt: row.created_at.toISOString(),
        }))
      );
    }

    if (telegramResult.status === "fulfilled") {
      rewards.push(
        ...telegramResult.value.rows.map((row) => ({
          id: row.id.toString(),
          type: row.type,
          status: row.status,
          createdAt: row.created_at.toISOString(),
        }))
      );
    }

    rewards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(rewards);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({
      error: "Failed to fetch rewards",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/rewards/runewager
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
      result.rows.map((row) => ({
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/rewards/crypto
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
      result.rows.map((row) => ({
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/rewards/lootbox
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
      result.rows.map((row) => ({
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/rewards/telegram
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
      result.rows.map((row) => ({
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/crypto-addresses
 * PIN required
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
        usdt_address: null,
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching crypto addresses:", error);
    res.status(500).json({
      error: "Failed to fetch crypto addresses",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/crypto-addresses
 * Update crypto addresses (PIN required)
 */
router.post("/crypto-addresses", requirePin, async (req, res) => {
  try {
    const { btc, eth, sol, usdt } = req.body;
    const userId = req.user.user_id;

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
      [userId, btc || null, eth || null, sol || null, usdt || null]
    );

    await pool.query(
      `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
       VALUES ($1, 'crypto_addresses_updated', 'Crypto Addresses Updated', 'Updated crypto wallet addresses', CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Crypto addresses updated successfully",
    });
  } catch (error) {
    console.error("Error updating crypto addresses:", error);
    res.status(500).json({
      error: "Failed to update crypto addresses",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/dashboard-stats
 */
router.get("/dashboard-stats", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const raffleEntriesResult = await pool.query(
      "SELECT COUNT(*) as count FROM raffle_entries WHERE user_id = $1",
      [userId]
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const raffleEntriesTodayResult = await pool.query(
      "SELECT COUNT(*) as count FROM raffle_entries WHERE user_id = $1 AND created_at >= $2",
      [userId, todayStart]
    );

    const lastSpinResult = await pool.query(
      `SELECT created_at FROM spin_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    let wheelSpinsRemaining = 1;
    if (lastSpinResult.rows.length > 0) {
      const lastSpin = new Date(lastSpinResult.rows[0].created_at);
      const now = new Date();
      const diff = now.getTime() - lastSpin.getTime();
      const hoursSinceLastSpin = diff / (1000 * 60 * 60);
      if (hoursSinceLastSpin < 24) {
        wheelSpinsRemaining = 0;
      }
    }

    const linkedCasinosResult = await pool.query(
      "SELECT COUNT(*) as count FROM user_linked_sites WHERE user_id = $1",
      [userId]
    );

    const giveawaysReceived = 0;

   res.status(200).json({
      raffleEntries: parseInt(raffleEntriesResult.rows[0]?.count || 0),
      raffleEntriesToday: parseInt(raffleEntriesTodayResult.rows[0]?.count || 0),
      wheelSpinsRemaining,
      giveawaysReceived,
      linkedCasinos: parseInt(linkedCasinosResult.rows[0]?.count || 0),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard stats",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/profile/sites-linked
 */
router.get("/sites-linked", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(
      `SELECT
        uls.id,
        uls.site_id as "siteId",
        am.name as "siteName",
        am.slug as "siteSlug",
        uls.identifier_type as "identifierType",
        uls.identifier_value as "identifierValue",
        uls.created_at as "linkedAt",
        uls.updated_at as "updatedAt"
       FROM user_linked_sites uls
       JOIN affiliates_master am ON uls.site_id = am.id::text
       WHERE uls.user_id = $1
       ORDER BY uls.created_at DESC`,
      [userId]
    );

    res.status(200).json(
      result.rows.map(row => ({
        id: row.id.toString(),
        siteId: row.siteId,
        siteName: row.siteName,
        siteSlug: row.siteSlug,
        identifierType: row.identifierType,
        identifierValue: row.identifierValue,
        linkedAt: row.linkedAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching linked sites:", error);
    res.status(500).json({
      error: "Failed to fetch linked sites",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/site-link
 */
router.post("/site-link", requireUser, async (req, res) => {
  try {
    const user = req.user;
    const { siteId, identifierType, identifierValue } = req.body;

    if (!siteId || !identifierType || !identifierValue) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["username", "email", "player_id"].includes(identifierType)) {
      return res.status(400).json({ error: "Invalid identifier type" });
    }

    const siteCheck = await pool.query(
      "SELECT id, name, slug FROM affiliates_master WHERE id = $1",
      [siteId]
    );
    if (siteCheck.rows.length === 0) {
      return res.status(404).json({ error: "Site not found" });
    }

    const result = await pool.query(
      `INSERT INTO user_linked_sites (user_id, site_id, identifier_type, identifier_value, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, site_id)
       DO UPDATE SET
         identifier_type = EXCLUDED.identifier_type,
         identifier_value = EXCLUDED.identifier_value,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user.user_id, siteId, identifierType, identifierValue]
    );

    await pool.query(
      `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
       VALUES ($1, 'account_linked', 'Account Linked', 'Linked account to ' || $2, CURRENT_TIMESTAMP)`,
      [user.user_id, siteCheck.rows[0].name]
    );

    res.status(200).json({
      id: result.rows[0].id.toString(),
      siteId: result.rows[0].site_id,
      siteName: siteCheck.rows[0].name,
      siteSlug: siteCheck.rows[0].slug,
      identifierType: result.rows[0].identifier_type,
      identifierValue: result.rows[0].identifier_value,
      linkedAt: result.rows[0].created_at.toISOString(),
      updatedAt: result.rows[0].updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error linking site:", error);
    res.status(500).json({
      error: "Failed to link site",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * DELETE /api/profile/site-link/:siteId
 */
router.delete("/site-link/:siteId", requireUser, async (req, res) => {
  try {
    const user = req.user;
    const { siteId } = req.params;

    const siteResult = await pool.query(
      "SELECT name FROM affiliates_master WHERE id = $1",
      [siteId]
    );

    await pool.query(
      "DELETE FROM user_linked_sites WHERE user_id = $1 AND site_id = $2",
      [user.user_id, siteId]
    );

    if (siteResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
         VALUES ($1, 'account_unlinked', 'Account Unlinked', 'Unlinked account from ' || $2, CURRENT_TIMESTAMP)`,
        [user.user_id, siteResult.rows[0].name]
      );
    }

    res.status(200).json({ success: true, message: "Site unlinked successfully" });
  } catch (error) {
    console.error("Error unlinking site:", error);
    res.status(500).json({
      error: "Failed to unlink site",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/profile/tip-eligibility
 */
router.get("/tip-eligibility", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const runewagerLink = await pool.query(
      `SELECT uls.identifier_type, uls.identifier_value, am.slug
       FROM user_linked_sites uls
       JOIN affiliates_master am ON uls.site_id = am.id::text
       WHERE uls.user_id = $1
         AND (am.slug ILIKE '%runewager%' OR am.name ILIKE '%runewager%')
       LIMIT 1`,
      [userId]
    );

    const runewagerEligible =
      runewagerLink.rows.length > 0 &&
      (runewagerLink.rows[0].identifier_type === "username" ||
        runewagerLink.rows[0].identifier_type === "email");

    const allLinkedSites = await pool.query(
      `SELECT
        am.id,
        am.name,
        am.slug,
        uls.identifier_type,
        uls.identifier_value,
        am.sc_allowed,
        am.crypto_allowed
       FROM user_linked_sites uls
       JOIN affiliates_master am ON uls.site_id = am.id::text
       WHERE uls.user_id = $1
       ORDER BY am.name`,
      [userId]
    );

    const otherSites = allLinkedSites.rows.map((site) => ({
      siteId: site.id.toString(),
      siteName: site.name,
      siteSlug: site.slug,
      identifierType: site.identifier_type,
      identifierValue: site.identifier_value,
      scEligible: site.sc_allowed || false,
      cryptoEligible: site.crypto_allowed || false,
      tipEligible:
        (site.sc_allowed || site.crypto_allowed) &&
        (site.identifier_type === "username" || site.identifier_type === "email"),
    }));

    res.status(200).json({
      runewager: runewagerEligible,
      runewagerDetails:
        runewagerLink.rows.length > 0
          ? {
              identifierType: runewagerLink.rows[0].identifier_type,
              identifierValue: runewagerLink.rows[0].identifier_value,
            }
          : null,
      otherSites,
    });
  } catch (error) {
    console.error("Error fetching tip eligibility:", error);
    res.status(500).json({
      error: "Failed to fetch tip eligibility",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
