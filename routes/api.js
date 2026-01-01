import express from "express";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";

// Child routers
import dropsRouter from "./drops.js";
import raffleRouter from "./raffle.js";      // if exists
import adminRouter from "./admin.js";        // if exists
import socialsRouter from "./socials.js";    // if exists
import authRouter from "./auth.js";          // if exists

const router = express.Router();

/**
 * ============================================
 * HEALTH CHECK
 * GET /api/health
 * ============================================
 */
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "API online" });
});

/**
 * ============================================
 * LEGACY GOOSE-FINISHER ENDPOINT
 * GET /api/drops (legacy)
 * ============================================
 * This preserves your old drop_promos table endpoint.
 */
router.get("/drops", async (req, res) => {
  try {
    const drops = await pool.query(
      "SELECT * FROM drop_promos ORDER BY created_at DESC LIMIT 50"
    );
    return res.json(drops.rows);
  } catch (err) {
    logger.error("api.js legacy /drops failed:", err);
    return res.status(500).json({ error: "Failed to load drops" });
  }
});

/**
 * ============================================
 * MODERN ROUTERS
 * Mounted AFTER legacy endpoints to avoid conflicts.
 * ============================================
 */
router.use("/drops", dropsRouter);     // AI-powered drop engine routes
router.use("/raffle", raffleRouter);   // if exists
router.use("/admin", adminRouter);     // if exists
router.use("/socials", socialsRouter); // if exists
router.use("/auth", authRouter);       // if exists

export default router;
