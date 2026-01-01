import express from "express";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import { requireUser } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * ============================================
 * GET /api/profile/activity
 * Fetch activity log for authenticated user
 * Supports:
 *   ?type=
 *   ?startDate=
 *   ?endDate=
 *   ?limit=50
 * ============================================
 */
router.get("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { type, startDate, endDate, limit = 50 } = req.query;

    const params = [userId];
    let idx = 2;

    let query = `
      SELECT
        id,
        activity_type AS type,
        title,
        description,
        created_at AS timestamp,
        link_url AS "linkUrl",
        metadata
      FROM activity_log
      WHERE user_id = $1
    `;

    if (type) {
      query += ` AND activity_type = $${idx++}`;
      params.push(type);
    }

    if (startDate) {
      const parsed = new Date(startDate);
      if (!isNaN(parsed)) {
        query += ` AND created_at >= $${idx++}`;
        params.push(parsed);
      }
    }

    if (endDate) {
      const parsed = new Date(endDate);
      if (!isNaN(parsed)) {
        query += ` AND created_at <= $${idx++}`;
        params.push(parsed);
      }
    }

    query += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    return res.status(200).json(
      result.rows.map((row) => ({
        id: row.id?.toString(),
        type: row.type,
        title: row.title,
        description: row.description,
        timestamp: row.timestamp?.toISOString(),
        linkUrl: row.linkUrl || null,
        metadata: row.metadata || null,
      }))
    );
  } catch (error) {
    logger.error("profile/activity: GET / failed:", error);
    return res.status(500).json({
      error: "Failed to fetch activity log",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * ============================================
 * GET /api/profile/activity/types
 * Returns all distinct activity types
 * ============================================
 */
router.get("/types", requireUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT activity_type AS type
       FROM activity_log
       ORDER BY type ASC`
    );

    return res.status(200).json(result.rows.map((r) => r.type));
  } catch (error) {
    logger.error("profile/activity: GET /types failed:", error);
    return res.status(500).json({
      error: "Failed to fetch activity types",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * ============================================
 * GET /api/profile/activity/recent
 * Returns the 10 most recent entries
 * ============================================
 */
router.get("/recent", requireUser, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      `SELECT
        id,
        activity_type AS type,
        title,
        description,
        created_at AS timestamp,
        link_url AS "linkUrl",
        metadata
       FROM activity_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    return res.status(200).json(
      result.rows.map((row) => ({
        id: row.id?.toString(),
        type: row.type,
        title: row.title,
        description: row.description,
        timestamp: row.timestamp?.toISOString(),
        linkUrl: row.linkUrl || null,
        metadata: row.metadata || null,
      }))
    );
  } catch (error) {
    logger.error("profile/activity: GET /recent failed:", error);
    return res.status(500).json({
      error: "Failed to fetch recent activity",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
