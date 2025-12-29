import express from "express";
import auth from "../middleware/auth.js";
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

const router = express.Router();

// All admin routes require authentication
router.use(auth);

// Mount admin sub-routes
router.use("/users", adminUsers);
router.use("/raffles", adminRaffles);
router.use("/affiliates", adminAffiliates);
router.use("/sites", adminAffiliates); // Alias for semantic clarity
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

// Warmup endpoint (moved from redirects sub-router)
router.post("/warmup", async (req, res) => {
  try {
    const pkg = await import("pg");
    const { Pool } = pkg;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const redirectsResult = await pool.query("SELECT slug FROM redirects ORDER BY weight DESC");
    
    // TODO: Implement actual warmup logic
    res.json({
      success: true,
      message: "Warmup triggered",
      redirects_count: redirectsResult.rows.length
    });
  } catch (error) {
    console.error("Error triggering warmup:", error);
    res.status(500).json({ error: "Failed to trigger warmup" });
  }
});

export default router;
