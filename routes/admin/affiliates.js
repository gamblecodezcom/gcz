import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get broadcast function from app
function getBroadcastFunction(req) {
  return req.app.get("broadcastAdminUpdate");
}

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

// GET /api/admin/affiliates/:id - Get single affiliate
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM affiliates_master WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Affiliate not found" });
    }
    
    res.json({ affiliate: result.rows[0] });
  } catch (error) {
    console.error("Error fetching affiliate:", error);
    res.status(500).json({ error: "Failed to fetch affiliate" });
  }
});

// GET /api/admin/affiliates - List affiliates with pagination and search
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const jurisdiction = req.query.jurisdiction || "";

    let query = "SELECT * FROM affiliates_master";
    let countQuery = "SELECT COUNT(*) FROM affiliates_master";
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(name ILIKE $${params.length + 1} OR affiliate_url ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }
    if (jurisdiction) {
      conditions.push(`jurisdiction = $${params.length + 1}`);
      params.push(jurisdiction);
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY priority DESC, name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [affiliatesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    res.json({
      affiliates: affiliatesResult.rows,
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching affiliates:", error);
    res.status(500).json({ error: "Failed to fetch affiliates" });
  }
});

// POST /api/admin/affiliates - Create affiliate
router.post("/", async (req, res) => {
  try {
    const {
      name, affiliate_url, priority, category, status, level, date_added,
      bonus_code, bonus_description, icon_url, resolved_domain,
      redemption_speed, redemption_minimum, redemption_type, created_by, source,
      top_pick, jurisdiction
    } = req.body;

    if (!name || !affiliate_url || !category) {
      return res.status(400).json({ error: "name, affiliate_url, and category are required" });
    }

    const result = await pool.query(
      `INSERT INTO affiliates_master (
        name, affiliate_url, priority, category, status, level, date_added,
        bonus_code, bonus_description, icon_url, resolved_domain,
        redemption_speed, redemption_minimum, redemption_type, created_by, source,
        top_pick, jurisdiction
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        name, affiliate_url, priority || 0, category, status || "active", level || 1,
        date_added || new Date().toISOString().split("T")[0],
        bonus_code || null, bonus_description || "", icon_url || "", resolved_domain || "",
        redemption_speed || "", redemption_minimum || 0, redemption_type || "", created_by || "admin", source || "manual",
        top_pick || false, jurisdiction || null
      ]
    );

    await logAdminAction(req, "CREATE", "affiliate", result.rows[0].id.toString(), { name });
    const broadcast = getBroadcastFunction(req);
    if (broadcast) broadcast("affiliates", "admin:update", { resource_type: "affiliate", action: "CREATE", id: result.rows[0].id });
    res.json({ affiliate: result.rows[0] });
  } catch (error) {
    console.error("Error creating affiliate:", error);
    res.status(500).json({ error: "Failed to create affiliate" });
  }
});

// PUT /api/admin/affiliates/:id - Update affiliate
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = [
      "name", "affiliate_url", "priority", "category", "status", "level",
      "bonus_code", "bonus_description", "icon_url", "resolved_domain",
      "redemption_speed", "redemption_minimum", "redemption_type",
      "top_pick", "jurisdiction"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE affiliates_master SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Affiliate not found" });
    }

    await logAdminAction(req, "UPDATE", "affiliate", id, req.body);
    const broadcast = getBroadcastFunction(req);
    if (broadcast) broadcast("affiliates", "admin:update", { resource_type: "affiliate", action: "UPDATE", id });
    res.json({ affiliate: result.rows[0] });
  } catch (error) {
    console.error("Error updating affiliate:", error);
    res.status(500).json({ error: "Failed to update affiliate" });
  }
});

// DELETE /api/admin/affiliates/:id - Delete affiliate
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM affiliates_master WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Affiliate not found" });
    }

    await logAdminAction(req, "DELETE", "affiliate", id);
    const broadcast = getBroadcastFunction(req);
    if (broadcast) broadcast("affiliates", "admin:update", { resource_type: "affiliate", action: "DELETE", id });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting affiliate:", error);
    res.status(500).json({ error: "Failed to delete affiliate" });
  }
});

// POST /api/admin/affiliates/bulk - Bulk operations
router.post("/bulk", async (req, res) => {
  try {
    const { action, ids, data } = req.body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "action and ids array are required" });
    }

    if (action === "delete") {
      await pool.query("DELETE FROM affiliates_master WHERE id = ANY($1)", [ids]);
      await logAdminAction(req, "BULK_DELETE", "affiliate", ids.join(","), { count: ids.length });
      const broadcast = getBroadcastFunction(req);
      if (broadcast) broadcast("affiliates", "admin:update", { resource_type: "affiliate", action: "BULK_DELETE", ids });
      return res.json({ success: true, deleted: ids.length });
    }

    if (action === "update" && data) {
      const updates = [];
      const params = [];
      let paramIndex = 1;

      const allowedFields = ["status", "category", "top_pick", "jurisdiction"];
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updates.push(`${field} = $${paramIndex++}`);
          params.push(data[field]);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      params.push(ids);
      const result = await pool.query(
        `UPDATE affiliates_master SET ${updates.join(", ")} WHERE id = ANY($${paramIndex}) RETURNING id`,
        params
      );

      await logAdminAction(req, "BULK_UPDATE", "affiliate", ids.join(","), { count: result.rows.length, data });
      const broadcast = getBroadcastFunction(req);
      if (broadcast) broadcast("affiliates", "admin:update", { resource_type: "affiliate", action: "BULK_UPDATE", ids });
      return res.json({ success: true, updated: result.rows.length });
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("Error in bulk operation:", error);
    res.status(500).json({ error: "Failed to perform bulk operation" });
  }
});

// GET /api/admin/affiliates/:id/linked-count - Get count of linked players for a site
router.get("/:id/linked-count", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM user_linked_sites WHERE site_id = $1",
      [id]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    console.error("Error fetching linked count:", error);
    res.status(500).json({ error: "Failed to fetch linked count" });
  }
});

export default router;
