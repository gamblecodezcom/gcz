import express from "express";
import pool from "../../utils/db.js";
import crypto from "crypto";
import adminAuth from "../../middleware/adminAuth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { getAdminUser } from "../../middleware/adminAuth.js";

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Helper to log admin actions
async function logAdminAction(req, action, resourceType, resourceId, details = {}) {
  try {
    const adminUser = await getAdminUser(req);
    await pool.query(
      `INSERT INTO admin_audit_log (admin_user, admin_user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        adminUser?.username || "unknown",
        adminUser?.id || null,
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

/**
 * GET /api/admin/admin-users
 * List all admin users with pagination
 */
router.get("/", requirePermission("admin_users", "view"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    let query = `
      SELECT u.*, 
             STRING_AGG(DISTINCT r.display_name, ', ') as roles
      FROM admin_users u
      LEFT JOIN admin_user_roles ur ON u.id = ur.user_id
      LEFT JOIN admin_roles r ON ur.role_id = r.id
    `;
    let countQuery = "SELECT COUNT(DISTINCT u.id) FROM admin_users u";
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(u.username ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR u.full_name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += " GROUP BY u.id ORDER BY u.created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: usersResult.rows.map(u => ({
        ...u,
        password_hash: undefined // Never return password hash
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error("Error listing admin users:", error);
    res.status(500).json({ error: "Failed to list admin users" });
  }
});

/**
 * GET /api/admin/admin-users/:id
 * Get single admin user with roles and permissions
 */
router.get("/:id", requirePermission("admin_users", "view"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const userResult = await pool.query(
      "SELECT * FROM admin_users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const user = userResult.rows[0];

    // Get roles
    const rolesResult = await pool.query(
      `SELECT r.id, r.name, r.display_name, r.description
       FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    // Get permissions
    const { getUserPermissions } = await import("../../middleware/permissions.js");
    const permissions = await getUserPermissions(userId);

    res.json({
      ...user,
      password_hash: undefined, // Never return password hash
      roles: rolesResult.rows,
      permissions: permissions
    });
  } catch (error) {
    console.error("Error getting admin user:", error);
    res.status(500).json({ error: "Failed to get admin user" });
  }
});

/**
 * POST /api/admin/admin-users
 * Create new admin user
 */
router.post("/", requirePermission("admin_users", "create"), async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    const adminUser = await getAdminUser(req);

    const result = await pool.query(
      `INSERT INTO admin_users (username, email, password_hash, full_name, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name, active, created_at`,
      [username, email, passwordHash, full_name || null, adminUser?.id || null]
    );

    const newUser = result.rows[0];

    // Assign default role if specified
    if (req.body.role_id) {
      await pool.query(
        "INSERT INTO admin_user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)",
        [newUser.id, req.body.role_id, adminUser?.id || null]
      );
    }

    await logAdminAction(req, "CREATE", "admin_user", newUser.id.toString(), { username, email });
    res.status(201).json({ user: newUser });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    console.error("Error creating admin user:", error);
    res.status(500).json({ error: "Failed to create admin user" });
  }
});

/**
 * PUT /api/admin/admin-users/:id
 * Update admin user
 */
router.put("/:id", requirePermission("admin_users", "update"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, full_name, active } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      params.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(email);
    }
    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      params.push(full_name);
    }
    if (active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      params.push(active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    params.push(userId);

    const result = await pool.query(
      `UPDATE admin_users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, username, email, full_name, active`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    await logAdminAction(req, "UPDATE", "admin_user", userId.toString(), req.body);
    res.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    console.error("Error updating admin user:", error);
    res.status(500).json({ error: "Failed to update admin user" });
  }
});

/**
 * POST /api/admin/admin-users/:id/password
 * Reset admin user password (requires manage permission)
 */
router.post("/:id/password", requirePermission("admin_users", "update"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const passwordHash = crypto.createHash("sha256").update(new_password).digest("hex");

    const result = await pool.query(
      "UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id",
      [passwordHash, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    await logAdminAction(req, "UPDATE", "admin_user", userId.toString(), { action: "password_reset" });
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

/**
 * POST /api/admin/admin-users/:id/roles
 * Assign roles to admin user
 */
router.post("/:id/roles", requirePermission("admin_users", "manage_roles"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role_ids } = req.body;

    if (!Array.isArray(role_ids)) {
      return res.status(400).json({ error: "role_ids must be an array" });
    }

    const adminUser = await getAdminUser(req);

    // Remove existing roles
    await pool.query("DELETE FROM admin_user_roles WHERE user_id = $1", [userId]);

    // Add new roles
    if (role_ids.length > 0) {
      const values = role_ids.map((roleId, idx) => 
        `($${idx * 2 + 1}, $${idx * 2 + 2}, $${role_ids.length * 2 + 1})`
      ).join(", ");
      
      const params = [];
      role_ids.forEach(roleId => {
        params.push(userId, roleId);
      });
      params.push(adminUser?.id || null);

      await pool.query(
        `INSERT INTO admin_user_roles (user_id, role_id, assigned_by) VALUES ${values}`,
        params
      );
    }

    await logAdminAction(req, "UPDATE", "admin_user", userId.toString(), { action: "roles_updated", role_ids });
    
    // Get updated user with roles
    const rolesResult = await pool.query(
      `SELECT r.id, r.name, r.display_name, r.description
       FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    res.json({ success: true, roles: rolesResult.rows });
  } catch (error) {
    console.error("Error updating roles:", error);
    res.status(500).json({ error: "Failed to update roles" });
  }
});

/**
 * DELETE /api/admin/admin-users/:id
 * Delete admin user
 */
router.delete("/:id", requirePermission("admin_users", "delete"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const adminUser = await getAdminUser(req);

    // Prevent self-deletion
    if (adminUser?.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const result = await pool.query("DELETE FROM admin_users WHERE id = $1 RETURNING id", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    await logAdminAction(req, "DELETE", "admin_user", userId.toString());
    res.json({ success: true, message: "Admin user deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({ error: "Failed to delete admin user" });
  }
});

/**
 * GET /api/admin/admin-users/roles/list
 * Get all available roles
 */
router.get("/roles/list", requirePermission("admin_users", "view"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, display_name, description FROM admin_roles ORDER BY name"
    );
    res.json({ roles: result.rows });
  } catch (error) {
    console.error("Error listing roles:", error);
    res.status(500).json({ error: "Failed to list roles" });
  }
});

export default router;
