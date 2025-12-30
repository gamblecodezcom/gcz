import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * @typedef {Object} LiveNotification
 * @property {string} id
 * @property {string} message
 * @property {'info'|'promo'|'winner'|'new_site'|'system'} type
 * @property {string} [linkUrl]
 * @property {boolean} dismissible
 */

/**
 * GET /api/notifications/live
 * Get live notification banner
 * 
 * @route GET /api/notifications/live
 * @returns {Promise<LiveNotification|null>} 200 - Success response with notification or null
 */
router.get("/live", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, message, link_url, active, priority
       FROM live_banner 
       WHERE active = true 
       ORDER BY priority DESC, created_at DESC 
       LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      return res.status(200).json(null);
    }
    
    const banner = result.rows[0];
    res.status(200).json({
      id: banner.id.toString(),
      message: banner.message,
      type: "info",
      linkUrl: banner.link_url || undefined,
      dismissible: true,
    });
  } catch (error) {
    console.error("Error fetching live notification:", error);
    res.status(200).json(null); // Return null on error (non-critical)
  }
});

/**
 * @typedef {Object} NotificationSettings
 * @property {boolean} emailNewsletter
 * @property {boolean} telegramRaffleAlerts
 * @property {boolean} telegramGiveawayAlerts
 * @property {boolean} telegramSecretCodeHints
 */

/**
 * GET /api/profile/notifications
 * Get notification settings
 * 
 * @route GET /api/profile/notifications
 * @returns {Promise<NotificationSettings>} 200 - Success response with notification settings
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/notifications", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = user.user_id;
    
    const result = await pool.query(
      "SELECT * FROM user_notification_settings WHERE user_id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Return defaults if no settings exist
      return res.status(200).json({
        emailNewsletter: false,
        telegramRaffleAlerts: true,
        telegramGiveawayAlerts: true,
        telegramSecretCodeHints: false,
      });
    }
    
    const settings = result.rows[0];
    res.status(200).json({
      emailNewsletter: settings.email_newsletter || false,
      telegramRaffleAlerts: settings.telegram_raffle_alerts !== false,
      telegramGiveawayAlerts: settings.telegram_giveaway_alerts !== false,
      telegramSecretCodeHints: settings.telegram_secret_code_hints || false,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ 
      error: "Failed to fetch notification settings",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/profile/notifications
 * Update notification settings
 * 
 * @route POST /api/profile/notifications
 * @param {Object} req.body
 * @param {boolean} [req.body.emailNewsletter]
 * @param {boolean} [req.body.telegramRaffleAlerts]
 * @param {boolean} [req.body.telegramGiveawayAlerts]
 * @param {boolean} [req.body.telegramSecretCodeHints]
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success response
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/notifications", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = user.user_id;
    
    const {
      emailNewsletter,
      telegramRaffleAlerts,
      telegramGiveawayAlerts,
      telegramSecretCodeHints,
      telegramDropsAlerts,
      emailDropsAlerts,
      pushDropsAlerts,
    } = req.body;
    
    await pool.query(
      `INSERT INTO user_notification_settings 
       (user_id, email_newsletter, telegram_raffle_alerts, telegram_giveaway_alerts, telegram_secret_code_hints, 
        telegram_drops_alerts, email_drops_alerts, push_drops_alerts, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         email_newsletter = EXCLUDED.email_newsletter,
         telegram_raffle_alerts = EXCLUDED.telegram_raffle_alerts,
         telegram_giveaway_alerts = EXCLUDED.telegram_giveaway_alerts,
         telegram_secret_code_hints = EXCLUDED.telegram_secret_code_hints,
         telegram_drops_alerts = EXCLUDED.telegram_drops_alerts,
         email_drops_alerts = EXCLUDED.email_drops_alerts,
         push_drops_alerts = EXCLUDED.push_drops_alerts,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        emailNewsletter || false,
        telegramRaffleAlerts !== false,
        telegramGiveawayAlerts !== false,
        telegramSecretCodeHints || false,
        telegramDropsAlerts !== false, // Default true
        emailDropsAlerts || false,
        pushDropsAlerts !== false, // Default true
      ]
    );
    
    res.status(200).json({ success: true, message: "Notification settings updated" });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ 
      error: "Failed to update notification settings",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
