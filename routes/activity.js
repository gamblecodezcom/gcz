import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

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
 * Get activity log
 * 
 * @route GET /api/profile/activity
 * @param {string} [req.query.type] - Filter by activity type
 * @param {string} [req.query.startDate] - Start date filter (ISO string)
 * @param {string} [req.query.endDate] - End date filter (ISO string)
 * @param {number} [req.query.limit=50] - Maximum number of entries
 * @returns {Promise<ActivityEntry[]>} 200 - Success response with activity entries
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/activity", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { type, startDate, endDate, limit = 50 } = req.query;
    const userId = user.user_id;
    
    let query = "SELECT * FROM activity_log WHERE user_id = $1";
    const params = [userId];
    let paramIndex = 2;
    
    if (type) {
      query += ` AND activity_type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(new Date(startDate));
    }
    
    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(new Date(endDate));
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.status(200).json(
      result.rows.map((row) => ({
        id: row.id.toString(),
        type: row.activity_type,
        title: row.title,
        description: row.description || "",
        timestamp: row.created_at.toISOString(),
        linkUrl: row.link_url || undefined,
        metadata: row.metadata || {},
      }))
    );
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.status(500).json({ 
      error: "Failed to fetch activity log",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * @typedef {Object} WheelHistoryEntry
 * @property {string} id
 * @property {number|string} reward
 * @property {boolean} jackpot
 * @property {number} entriesAdded
 * @property {string} createdAt
 */

/**
 * GET /api/profile/wheel-history
 * Get wheel spin history
 * 
 * @route GET /api/profile/wheel-history
 * @returns {Promise<WheelHistoryEntry[]>} 200 - Success response with wheel history
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/wheel-history", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = user.user_id;
    
    const result = await pool.query(
      `SELECT 
        id,
        reward,
        created_at,
        CASE 
          WHEN reward = 'JACKPOT' THEN true 
          ELSE false 
        END as jackpot
       FROM spin_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    
    res.status(200).json(
      result.rows.map((row) => ({
        id: row.id.toString(),
        reward: row.reward,
        jackpot: row.jackpot,
        entriesAdded: typeof row.reward === "number" ? row.reward : 0,
        createdAt: row.created_at.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching wheel history:", error);
    res.status(500).json({ 
      error: "Failed to fetch wheel history",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
