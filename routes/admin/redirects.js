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

// GET /api/admin/redirects - List redirects
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM redirects ORDER BY weight DESC, slug ASC"
    );
    res.json({ redirects: result.rows });
  } catch (error) {
    console.error("Error fetching redirects:", error);
    res.status(500).json({ error: "Failed to fetch redirects" });
  }
});

// POST /api/admin/redirects - Create redirect
router.post("/", async (req, res) => {
  try {
    const { slug, weight } = req.body;

    if (!slug) {
      return res.status(400).json({ error: "slug is required" });
    }

    const result = await pool.query(
      "INSERT INTO redirects (slug, weight) VALUES ($1, $2) RETURNING *",
      [slug, weight || 1]
    );

    await logAdminAction(req, "CREATE", "redirect", result.rows[0].id.toString(), { slug });
    res.json({ redirect: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Redirect slug already exists" });
    }
    console.error("Error creating redirect:", error);
    res.status(500).json({ error: "Failed to create redirect" });
  }
});

// PUT /api/admin/redirects/:id - Update redirect
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, weight } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      params.push(slug);
    }
    if (weight !== undefined) {
      updates.push(`weight = $${paramIndex++}`);
      params.push(weight);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE redirects SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Redirect not found" });
    }

    await logAdminAction(req, "UPDATE", "redirect", id, req.body);
    res.json({ redirect: result.rows[0] });
  } catch (error) {
    console.error("Error updating redirect:", error);
    res.status(500).json({ error: "Failed to update redirect" });
  }
});

// DELETE /api/admin/redirects/:id - Delete redirect
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM redirects WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Redirect not found" });
    }

    await logAdminAction(req, "DELETE", "redirect", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting redirect:", error);
    res.status(500).json({ error: "Failed to delete redirect" });
  }
});


export default router;
