import express from "express";
import pool from "../utils/db.js";
import { requireUser } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * @typedef {Object} ActivityEntry
 * @property {string} id
 * @property {string} type
 * @property {string} title
 * @property {string} description
 * @property {string} timestamp
 * @property {string} [linkUrl]
 * @property {Object} [metadata]
 */

/**
 * GET /api/profile/activity
 * Get activity log for the authenticated user
 *
 * Query params:
 * - type (optional)
 * - startDate (optional)
 * - endDate (optional)
 * - limit (default 50)
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
      query += ` AND created_at >= $${idx++}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND created_at <= $${idx++}`;
      params.push(new Date(endDate));
    }

    query += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.status(200).json(
      result.rows.map((row) => ({
        id: row.id.toString(),
        type: row.type,
        title: row.title,
        description: row.description,
        timestamp: row.timestamp.toISOString(),
        linkUrl: row.linkUrl || null,
        metadata: row.metadata || null,
      }))
    );
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.status(500).json({
      error: "Failed to fetch activity log",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/activity/types
 * Returns all distinct activity types for filtering
 */
router.get("/types", requireUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT activity_type AS type
       FROM activity_log
       ORDER BY type ASC`
    );

    res.status(200).json(result.rows.map((r) => r.type));
  } catch (error) {
    console.error("Error fetching activity types:", error);
    res.status(500).json({
      error: "Failed to fetch activity types",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/activity/recent
 * Returns the 10 most recent entries
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

    res.status(200).json(
      result.rows.map((row) => ({
        id: row.id.toString(),
        type: row.type,
        title: row.title,
        description: row.description,
        timestamp: row.timestamp.toISOString(),
        linkUrl: row.linkUrl || null,
        metadata: row.metadata || null,
      }))
    );
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      error: "Failed to fetch recent activity",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
