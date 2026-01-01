import express from "express";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * ============================================
 * GET /api/blacklist
 * Check if the current user is blacklisted
 * Used by frontend to block actions/UI
 * ============================================
 */
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);

    // Guests are never blacklisted
    if (!user) {
      return res.json([]);
    }

    const result = await pool.query(
      "SELECT * FROM blacklist WHERE user_id = $1 LIMIT 1",
      [user.user_id]
    );

    if (result.rows.length > 0) {
      const entry = result.rows[0];

      return res.status(403).json({
        error: "Access denied",
        message: "Your account has been blacklisted",
        reason: entry.reason || "No reason provided",
        category: entry.category || null,
        created_at: entry.created_at || null
      });
    }

    return res.json([]);
  } catch (error) {
    logger.error("blacklist: GET / failed:", error);
    // Non‑critical check → return empty so UI doesn't break
    return res.json([]);
  }
});

export default router;
