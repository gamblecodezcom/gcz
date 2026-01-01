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

// GET /api/admin/live-banner - Get active live banner
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM live_banner WHERE active = true ORDER BY priority DESC, created_at DESC LIMIT 1"
    );
    res.json({ banner: result.rows[0] || null });
  } catch (error) {
    console.error("Error fetching live banner:", error);
    res.status(500).json({ error: "Failed to fetch live banner" });
  }
});

// GET /api/admin/live-banner/all - Get all banners
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM live_banner ORDER BY priority DESC, created_at DESC"
    );
    res.json({ banners: result.rows });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

// POST /api/admin/live-banner - Create live banner
router.post("/", async (req, res) => {
  try {
    const { message, link_url, active, priority } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Deactivate other banners if this one is active
    if (active) {
      await pool.query("UPDATE live_banner SET active = false WHERE active = true");
    }

    const result = await pool.query(
      "INSERT INTO live_banner (message, link_url, active, priority) VALUES ($1, $2, $3, $4) RETURNING *",
      [message, link_url || null, active !== undefined ? active : true, priority || 0]
    );

    await logAdminAction(req, "CREATE", "live_banner", result.rows[0].id.toString(), { message });
    res.json({ banner: result.rows[0] });
  } catch (error) {
    console.error("Error creating live banner:", error);
    res.status(500).json({ error: "Failed to create live banner" });
  }
});

// PUT /api/admin/live-banner/:id - Update live banner
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { message, link_url, active, priority } = req.body;

    // If activating this banner, deactivate others
    if (active) {
      await pool.query("UPDATE live_banner SET active = false WHERE active = true AND id != $1", [id]);
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (message !== undefined) {
      updates.push(`message = $${paramIndex++}`);
      params.push(message);
    }
    if (link_url !== undefined) {
      updates.push(`link_url = $${paramIndex++}`);
      params.push(link_url);
    }
    if (active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      params.push(active);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE live_banner SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Banner not found" });
    }

    await logAdminAction(req, "UPDATE", "live_banner", id, req.body);
    res.json({ banner: result.rows[0] });
  } catch (error) {
    console.error("Error updating live banner:", error);
    res.status(500).json({ error: "Failed to update live banner" });
  }
});

// DELETE /api/admin/live-banner/:id - Delete live banner
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM live_banner WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Banner not found" });
    }

    await logAdminAction(req, "DELETE", "live_banner", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting live banner:", error);
    res.status(500).json({ error: "Failed to delete live banner" });
  }
});

export default router;
