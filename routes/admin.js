import express from "express";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";

import adminAuth from "../middleware/adminAuth.js";

import adminUsers from "./admin/users.js";
import adminRaffles from "./admin/raffles.js";
import adminAffiliates from "./admin/affiliates.js";
import adminRedirects from "./admin/redirects.js";
import adminAds from "./admin/ads.js";
import adminBlacklist from "./admin/blacklist.js";
import adminLiveBanner from "./admin/liveBanner.js";
import adminSettings from "./admin/settings.js";
import adminDailyDrops from "./admin/dailyDrops.js";
import adminPush from "./admin/push.js";
import adminWheel from "./admin/wheel.js";
import adminNewsletter from "./admin/newsletter.js";
import adminAdsDashboard from "./admin/adsDashboard.js";
import adminTelegramBot from "./admin/telegramBot.js";
import adminOverrides from "./admin/overrides.js";
import adminGiveaways from "./admin/giveaways.js";
import adminAffiliateAnalytics from "./admin/affiliateAnalytics.js";
import adminAuthRoutes from "./admin/auth.js";
import adminAdminUsers from "./admin/adminUsers.js";
import adminHealth from "./admin/health.js";

const router = express.Router();

/**
 * ============================================
 * AUTH ROUTES (NO AUTH REQUIRED)
 * ============================================
 */
router.use("/auth", adminAuthRoutes);

/**
 * ============================================
 * ALL OTHER ADMIN ROUTES REQUIRE AUTH
 * ============================================
 */
router.use(adminAuth);

/**
 * ============================================
 * ADMIN SUB‑ROUTES
 * ============================================
 */
router.use("/users", adminUsers);
router.use("/raffles", adminRaffles);
router.use("/affiliates", adminAffiliates);
router.use("/sites", adminAffiliates); // alias
router.use("/redirects", adminRedirects);
router.use("/ads", adminAds);
router.use("/blacklist", adminBlacklist);
router.use("/live-banner", adminLiveBanner);
router.use("/settings", adminSettings);
router.use("/daily-drops", adminDailyDrops);
router.use("/push", adminPush);
router.use("/wheel", adminWheel);
router.use("/newsletter", adminNewsletter);
router.use("/ads-dashboard", adminAdsDashboard);
router.use("/telegram-bot", adminTelegramBot);
router.use("/overrides", adminOverrides);
router.use("/giveaways", adminGiveaways);
router.use("/affiliate-analytics", adminAffiliateAnalytics);
router.use("/admin-users", adminAdminUsers);
router.use("/health", adminHealth);

/**
 * ============================================
 * POST /api/admin/warmup
 * Warmup endpoint (moved from redirects router)
 * ============================================
 */
router.post("/warmup", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT slug FROM redirects ORDER BY weight DESC"
    );

    // Placeholder: real warmup logic goes here
    return res.json({
      success: true,
      message: "Warmup triggered",
      redirects_count: result.rows.length,
    });
  } catch (error) {
    logger.error("admin: warmup failed:", error);
    return res.status(500).json({ error: "Failed to trigger warmup" });
  }
});

export default router;
