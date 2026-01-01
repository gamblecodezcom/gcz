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

// GET /api/admin/settings - Get all settings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT key, value FROM settings");
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/admin/settings - Update settings
router.put("/", async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "settings object is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const [key, value] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO settings (key, value, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
          [key, String(value)]
        );
      }

      await client.query("COMMIT");
      await logAdminAction(req, "UPDATE", "settings", "all", { keys: Object.keys(settings) });
      res.json({ success: true });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
