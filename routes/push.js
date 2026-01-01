import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

// GET /api/push - Get push notifications
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = user.user_id;
    
    const result = await pool.query(
      `SELECT 
        id,
        type,
        title,
        body,
        link_url,
        read_at,
        created_at
       FROM push_notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    
    res.json(
      result.rows.map((row) => ({
        id: row.id.toString(),
        type: row.type,
        title: row.title,
        body: row.body,
        linkUrl: row.link_url || undefined,
        createdAt: row.created_at.toISOString(),
        readAt: row.read_at ? row.read_at.toISOString() : undefined,
      }))
    );
  } catch (error) {
    console.error("Error fetching push notifications:", error);
    res.status(500).json({ error: "Failed to fetch push notifications" });
  }
});

// PATCH /api/push/:id/read - Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { id } = req.params;
    const userId = user.user_id;
    
    await pool.query(
      "UPDATE push_notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

export default router;
