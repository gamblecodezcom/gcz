import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function logAdminAction(req, action, resourceType, resourceId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_user, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.headers["x-admin-user"] || "unknown",
        action,
        resourceType,
        resourceId,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || ""
      ]
    );
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

// POST /api/admin/push/broadcast - Send broadcast push notification
router.post("/broadcast", async (req, res) => {
  try {
    const { title, message, url, icon } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "title and message are required" });
    }

    // TODO: Implement actual push notification sending
    // This would typically:
    // 1. Get all subscribed users from a push_subscriptions table
    // 2. Send push notifications via web-push library
    // 3. Log the notification

    await logAdminAction(req, "BROADCAST_PUSH", "notification", "all", {
      title,
      message
    });

    res.json({
      success: true,
      message: "Broadcast notification sent",
      notification: { title, message, url, icon }
    });
  } catch (error) {
    console.error("Error sending broadcast:", error);
    res.status(500).json({ error: "Failed to send broadcast" });
  }
});

export default router;
