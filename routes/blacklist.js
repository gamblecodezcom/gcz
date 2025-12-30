import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

// GET /api/blacklist - Check if user is blacklisted (for frontend)
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.json([]); // Return empty array for guests
    }
    
    const result = await pool.query(
      "SELECT * FROM blacklist WHERE user_id = $1",
      [user.user_id]
    );
    
    if (result.rows.length > 0) {
      return res.status(403).json({
        error: "Access denied",
        message: "Your account has been blacklisted",
        reason: result.rows[0].reason || "No reason provided",
      });
    }
    
    res.json([]);
  } catch (error) {
    console.error("Error checking blacklist:", error);
    res.json([]); // Return empty on error (non-critical check)
  }
});

export default router;
