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
    
    // Send email via MailerSend
    if (mailerSendClient && process.env.MAIL_TO_CONTACT) {
      try {
        await mailerSendClient.email.send({
          from: {
            email: process.env.MAIL_FROM || "info@gamblecodez.com",
            name: "GambleCodez Contact Form"
          },
          to: [
            {
              email: process.env.MAIL_TO_CONTACT,
              name: "Support"
            }
          ],
          reply_to: {
            email: email,
            name: name
          },
          subject: `Contact Form: ${name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
          text: `
New Contact Form Submission

Name: ${name}
Email: ${email}

Message:
${message}
          `
        });
        console.log("Contact form email sent via MailerSend");
      } catch (mailError) {
        console.error("MailerSend error (non-critical):", mailError);
        // Continue even if email fails
      }
    }
    
    res.status(200).json({ success: true, message: "Thank you for your message. We'll get back to you soon!" });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ error: "Failed to submit contact form" });
  }
});

export default router;
