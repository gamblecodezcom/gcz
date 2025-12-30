import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

// POST /api/contact - Submit contact form
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Store contact submission in database
    try {
      await pool.query(
        `INSERT INTO contact_submissions (name, email, message, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [name, email, message]
      );
    } catch (dbError) {
      // If table doesn't exist, log it (non-critical)
      console.log("Contact form submission (not stored):", { name, email, message });
      console.error("Database error (non-critical):", dbError);
    }
    
    res.status(200).json({ success: true, message: "Thank you for your message. We'll get back to you soon!" });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ error: "Failed to submit contact form" });
  }
});

export default router;
