const express = require("express");
const router = express.Router();
const MailerSend = require("mailersend");

const mailer = new MailerSend({
  api_key: process.env.MAILERSENDAPIKEY,
});

router.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // This assumes mailing list already configured in MailerSend
    await mailer.recipients.create({
      email,
      name: email,
      subscribed: true,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Subscription error:", err.message);
    res.status(500).json({ error: "Subscription failed" });
  }
});

module.exports = router;
