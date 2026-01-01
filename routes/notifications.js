import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * @typedef {Object} NotificationSettings
 * @property {boolean} emailNewsletter
 * @property {boolean} telegramRaffleAlerts
 * @property {boolean} telegramGiveawayAlerts
 * @property {boolean} telegramSecretCodeHints
 * @property {boolean} [telegramDropsAlerts]
 * @property {boolean} [emailDropsAlerts]
 * @property {boolean} [pushDropsAlerts]
 */

/**
 * GET /api/profile/notifications
 * Get notification settings for the authenticated user.
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
      // Defaults if no settings exist yet
      return res.status(200).json({
        emailNewsletter: false,
        telegramRaffleAlerts: true,
        telegramGiveawayAlerts: true,
        telegramSecretCodeHints: false,
        telegramDropsAlerts: true,
        emailDropsAlerts: false,
        pushDropsAlerts: true,
      });
    }

    const settings = result.rows[0];

    res.status(200).json({
      emailNewsletter: settings.email_newsletter || false,
      telegramRaffleAlerts: settings.telegram_raffle_alerts !== false,
      telegramGiveawayAlerts: settings.telegram_giveaway_alerts !== false,
      telegramSecretCodeHints: settings.telegram_secret_code_hints || false,
      telegramDropsAlerts: settings.telegram_drops_alerts !== false,
      emailDropsAlerts: settings.email_drops_alerts || false,
      pushDropsAlerts: settings.push_drops_alerts !== false,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({
      error: "Failed to fetch notification settings",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/notifications
 * Update notification settings for the authenticated user.
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
      `INSERT INTO user_notification_settings (
         user_id,
         email_newsletter,
         telegram_raffle_alerts,
         telegram_giveaway_alerts,
         telegram_secret_code_hints,
         telegram_drops_alerts,
         email_drops_alerts,
         push_drops_alerts,
         updated_at
       )
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
        telegramDropsAlerts !== false, // default true
        emailDropsAlerts || false,
        pushDropsAlerts !== false, // default true
      ]
    );

    res.status(200).json({
      success: true,
      message: "Notification settings updated",
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({
      error: "Failed to update notification settings",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
