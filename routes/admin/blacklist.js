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

// GET /api/admin/blacklist - List blacklist entries
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM blacklist ORDER BY created_at DESC"
    );
    res.json({ blacklist: result.rows });
  } catch (error) {
    console.error("Error fetching blacklist:", error);
    res.status(500).json({ error: "Failed to fetch blacklist" });
  }
});

// POST /api/admin/blacklist - Add to blacklist
router.post("/", async (req, res) => {
  try {
    const { user_id, reason } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const result = await pool.query(
      "INSERT INTO blacklist (user_id, reason, created_by) VALUES ($1, $2, $3) RETURNING *",
      [user_id, reason || null, req.headers["x-admin-user"] || "admin"]
    );

    await logAdminAction(req, "CREATE", "blacklist", result.rows[0].id.toString(), { user_id });
    res.json({ entry: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "User already blacklisted" });
    }
    console.error("Error adding to blacklist:", error);
    res.status(500).json({ error: "Failed to add to blacklist" });
  }
});

// DELETE /api/admin/blacklist/:id - Remove from blacklist
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM blacklist WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blacklist entry not found" });
    }

    await logAdminAction(req, "DELETE", "blacklist", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing from blacklist:", error);
    res.status(500).json({ error: "Failed to remove from blacklist" });
  }
});

export default router;
