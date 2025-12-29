import express from "express";
import pkg from "pg";
import crypto from "crypto";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper to log admin actions
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

// GET /api/admin/users - List users with pagination and search
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    let query = "SELECT * FROM users";
    let countQuery = "SELECT COUNT(*) FROM users";
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`user_id ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: usersResult.rows,
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/admin/users - Create user
router.post("/", async (req, res) => {
  try {
    const { user_id, pin } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    let pinHash = null;
    if (pin) {
      pinHash = crypto.createHash("sha256").update(pin).digest("hex");
    }

    const result = await pool.query(
      "INSERT INTO users (user_id, pin_hash) VALUES ($1, $2) RETURNING *",
      [user_id, pinHash]
    );

    await logAdminAction(req, "CREATE", "user", result.rows[0].id.toString(), { user_id });
    res.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "User already exists" });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/admin/users/:id - Update user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, locked } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (user_id !== undefined) {
      updates.push(`user_id = $${paramIndex++}`);
      params.push(user_id);
    }

    if (locked !== undefined) {
      updates.push(`locked = $${paramIndex++}`);
      params.push(locked);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await logAdminAction(req, "UPDATE", "user", id, req.body);
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// POST /api/admin/users/:id/lock - Lock/unlock user
router.post("/:id/lock", async (req, res) => {
  try {
    const { id } = req.params;
    const { locked } = req.body;

    const result = await pool.query(
      "UPDATE users SET locked = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [locked, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await logAdminAction(req, locked ? "LOCK" : "UNLOCK", "user", id);
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating user lock:", error);
    res.status(500).json({ error: "Failed to update user lock" });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await logAdminAction(req, "DELETE", "user", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// POST /api/admin/pin-reset - Reset user PIN
router.post("/pin-reset", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // Set pin_hash to null to reset PIN
    const result = await pool.query(
      "UPDATE users SET pin_hash = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *",
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await logAdminAction(req, "PIN_RESET", "user", result.rows[0].id.toString(), { user_id });
    res.json({ success: true, message: "PIN reset successfully" });
  } catch (error) {
    console.error("Error resetting PIN:", error);
    res.status(500).json({ error: "Failed to reset PIN" });
  }
});

export default router;
