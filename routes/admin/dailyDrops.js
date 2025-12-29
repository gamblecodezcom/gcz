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

// GET /api/admin/daily-drops - List daily drops
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const dropDate = req.query.drop_date;

    let query = `
      SELECT dd.*, am.name as affiliate_name
      FROM daily_drops dd
      LEFT JOIN affiliates_master am ON dd.affiliate_id = am.id
    `;
    const params = [];
    const conditions = [];

    if (dropDate) {
      conditions.push(`dd.drop_date = $${params.length + 1}`);
      params.push(dropDate);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += ` ORDER BY dd.drop_date DESC, dd.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ drops: result.rows, page, limit });
  } catch (error) {
    console.error("Error fetching daily drops:", error);
    res.status(500).json({ error: "Failed to fetch daily drops" });
  }
});

// POST /api/admin/daily-drops - Create daily drop
router.post("/", async (req, res) => {
  try {
    const { promo_code, bonus_link, affiliate_id, jurisdiction, category, drop_date } = req.body;

    if (!drop_date) {
      return res.status(400).json({ error: "drop_date is required" });
    }

    const result = await pool.query(
      `INSERT INTO daily_drops (promo_code, bonus_link, affiliate_id, jurisdiction, category, drop_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        promo_code || null,
        bonus_link || null,
        affiliate_id || null,
        jurisdiction || null,
        category || null,
        drop_date
      ]
    );

    await logAdminAction(req, "CREATE", "daily_drop", result.rows[0].id.toString(), { drop_date });
    res.json({ drop: result.rows[0] });
  } catch (error) {
    console.error("Error creating daily drop:", error);
    res.status(500).json({ error: "Failed to create daily drop" });
  }
});

// PUT /api/admin/daily-drops/:id - Update daily drop
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { promo_code, bonus_link, affiliate_id, jurisdiction, category, active, drop_date } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (promo_code !== undefined) {
      updates.push(`promo_code = $${paramIndex++}`);
      params.push(promo_code);
    }
    if (bonus_link !== undefined) {
      updates.push(`bonus_link = $${paramIndex++}`);
      params.push(bonus_link);
    }
    if (affiliate_id !== undefined) {
      updates.push(`affiliate_id = $${paramIndex++}`);
      params.push(affiliate_id);
    }
    if (jurisdiction !== undefined) {
      updates.push(`jurisdiction = $${paramIndex++}`);
      params.push(jurisdiction);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(category);
    }
    if (active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      params.push(active);
    }
    if (drop_date !== undefined) {
      updates.push(`drop_date = $${paramIndex++}`);
      params.push(drop_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE daily_drops SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Daily drop not found" });
    }

    await logAdminAction(req, "UPDATE", "daily_drop", id, req.body);
    res.json({ drop: result.rows[0] });
  } catch (error) {
    console.error("Error updating daily drop:", error);
    res.status(500).json({ error: "Failed to update daily drop" });
  }
});

// DELETE /api/admin/daily-drops/:id - Delete daily drop
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM daily_drops WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Daily drop not found" });
    }

    await logAdminAction(req, "DELETE", "daily_drop", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting daily drop:", error);
    res.status(500).json({ error: "Failed to delete daily drop" });
  }
});

export default router;
