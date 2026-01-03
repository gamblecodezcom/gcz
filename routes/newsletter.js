import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

// Initialize MailerSend if API key is available
let MailerSend = null;
let mailerSendClient = null;
if (process.env.MAILERSEND_API_KEY && process.env.GCZ_MAIL_PROVIDER === 'mailersend') {
  try {
    MailerSend = (await import("mailersend")).default;
    mailerSendClient = new MailerSend({
      api_key: process.env.MAILERSEND_API_KEY,
    });
  } catch (error) {
    console.error("Failed to initialize MailerSend:", error);
  }
}

// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await getUserFromRequest(req);
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Write to database
    try {
      await pool.query(
        `INSERT INTO newsletter_subscribers (user_id, email, unsubscribed, created_at, updated_at)
         VALUES ($1, $2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (email) 
         DO UPDATE SET 
           unsubscribed = false,
           user_id = COALESCE(EXCLUDED.user_id, newsletter_subscribers.user_id),
           updated_at = CURRENT_TIMESTAMP`,
        [user?.user_id || null, email]
      );
    } catch (dbError) {
      console.error("Database error storing newsletter subscription:", dbError);
      return res.status(500).json({ error: "Failed to store subscription" });
    }
    
    // Add to MailerSend mailing list (if configured)
    if (mailerSendClient && process.env.MAILERSEND_LIST_ID) {
      try {
        // Note: This requires a mailing list ID configured in MailerSend
        // For now, we'll just log that it should be added
        console.log("Newsletter subscription should be added to MailerSend list:", email);
        // TODO: Implement MailerSend recipient addition when list ID is available
      } catch (mailError) {
        console.error("MailerSend error (non-critical):", mailError);
        // Continue even if MailerSend fails
      }
    }
    
    res.status(200).json({ success: true, status: "subscribed" });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
router.post("/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Update database
    await pool.query(
      `UPDATE newsletter_subscribers 
       SET unsubscribed = true, updated_at = CURRENT_TIMESTAMP 
       WHERE email = $1`,
      [email]
    );
    
    res.status(200).json({ success: true, status: "unsubscribed" });
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

export default router;
