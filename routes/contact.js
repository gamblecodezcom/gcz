import express from "express";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * ============================================
 * MAILERSEND INITIALIZATION (NON‑BLOCKING)
 * ============================================
 */
let mailerSendClient = null;

(async () => {
  try {
    if (process.env.MAILERSEND_API_KEY && process.env.GCZ_MAIL_PROVIDER === "mailersend") {
      const MailerSend = (await import("mailersend")).default;
      mailerSendClient = new MailerSend({
        api_key: process.env.MAILERSEND_API_KEY,
      });
      logger.info("MailerSend initialized for contact form");
    }
  } catch (err) {
    logger.error("Failed to initialize MailerSend:", err);
  }
})();

/**
 * ============================================
 * POST /api/contact
 * Public contact form endpoint
 * ============================================
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Optional: detect logged‑in user for rate‑limit bypass
    let user = null;
    try {
      user = await getUserFromRequest(req);
    } catch (_) {}

    /**
     * ============================================
     * STORE CONTACT SUBMISSION (NON‑CRITICAL)
     * ============================================
     */
    try {
      await pool.query(
        `INSERT INTO contact_submissions (name, email, message, user_id, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [cleanName, cleanEmail, cleanMessage, user?.user_id || null]
      );
    } catch (dbError) {
      logger.warn("Contact form submission NOT stored (table missing?):", {
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
      });
      logger.error("DB error (non‑critical):", dbError);
    }

    /**
     * ============================================
     * SEND EMAIL VIA MAILERSEND (NON‑BLOCKING)
     * ============================================
     */
    if (mailerSendClient && process.env.MAIL_TO_CONTACT) {
      try {
        await mailerSendClient.email.send({
          from: {
            email: process.env.MAIL_FROM || "info@gamblecodez.com",
            name: "GambleCodez Contact Form",
          },
          to: [
            {
              email: process.env.MAIL_TO_CONTACT,
              name: "Support",
            },
          ],
          reply_to: {
            email: cleanEmail,
            name: cleanName,
          },
          subject: `Contact Form: ${cleanName}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${cleanName}</p>
            <p><strong>Email:</strong> ${cleanEmail}</p>
            <p><strong>Message:</strong></p>
            <p>${cleanMessage.replace(/\n/g, "<br>")}</p>
          `,
          text: `
New Contact Form Submission

Name: ${cleanName}
Email: ${cleanEmail}

Message:
${cleanMessage}
          `,
        });

        logger.info("Contact form email sent via MailerSend");
      } catch (mailErr) {
        logger.error("MailerSend error (non‑critical):", mailErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for your message. We'll get back to you soon!",
    });
  } catch (error) {
    logger.error("Error submitting contact form:", error);
    return res.status(500).json({ error: "Failed to submit contact form" });
  }
});

export default router;
