import express from "express";
import pool from "../../utils/db.js";
import crypto from "crypto";

const router = express.Router();

/**
 * POST /api/admin/auth/login
 * Admin login endpoint
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username && !email) {
      return res.status(400).json({ error: "Username or email required" });
    }
    
    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }
    
    // Hash password for comparison
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    
    // Find user by username or email
    const userResult = await pool.query(
      `SELECT id, username, email, password_hash, full_name, active
       FROM admin_users
       WHERE (username = $1 OR email = $2) AND active = true`,
      [username || email, email || username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await pool.query(
      `INSERT INTO admin_sessions (user_id, session_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        sessionToken,
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || "",
        expiresAt
      ]
    );
    
    // Update last login
    await pool.query(
      `UPDATE admin_users 
       SET last_login = NOW(), last_login_ip = $1
       WHERE id = $2`,
      [req.ip || req.connection.remoteAddress, user.id]
    );
    
    // Get user roles
    const rolesResult = await pool.query(
      `SELECT r.name, r.display_name
       FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    
    // Get user permissions
    const { getUserPermissions } = await import("../../middleware/permissions.js");
    const permissions = await getUserPermissions(user.id);
    
    res.json({
      success: true,
      session_token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        roles: rolesResult.rows,
        permissions: permissions
      },
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/admin/auth/logout
 * Admin logout endpoint
 */
router.post("/logout", async (req, res) => {
  try {
    const sessionToken = req.headers["x-admin-session"] || 
                         req.cookies?.admin_session ||
                         req.body?.admin_session;
    
    if (sessionToken) {
      await pool.query(
        "DELETE FROM admin_sessions WHERE session_token = $1",
        [sessionToken]
      );
    }
    
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

/**
 * GET /api/admin/auth/me
 * Get current admin user info
 */
router.get("/me", async (req, res) => {
  try {
    const sessionToken = req.headers["x-admin-session"] || 
                         req.cookies?.admin_session ||
                         req.body?.admin_session;
    
    if (!sessionToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.last_login
       FROM admin_sessions s
       JOIN admin_users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.active = true`,
      [sessionToken]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    
    const user = result.rows[0];
    
    // Get roles
    const rolesResult = await pool.query(
      `SELECT r.id, r.name, r.display_name, r.description
       FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    
    // Get permissions
    const { getUserPermissions } = await import("../../middleware/permissions.js");
    const permissions = await getUserPermissions(user.id);
    
    res.json({
      user: {
        ...user,
        roles: rolesResult.rows,
        permissions: permissions
      }
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

/**
 * POST /api/admin/auth/change-password
 * Change admin user password
 */
router.post("/change-password", async (req, res) => {
  try {
    const sessionToken = req.headers["x-admin-session"] || 
                         req.cookies?.admin_session ||
                         req.body?.admin_session;
    
    if (!sessionToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "Current and new password required" });
    }
    
    if (new_password.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    
    // Get user from session
    const sessionResult = await pool.query(
      `SELECT u.id, u.password_hash
       FROM admin_sessions s
       JOIN admin_users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.active = true`,
      [sessionToken]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid session" });
    }
    
    const user = sessionResult.rows[0];
    
    // Verify current password
    const currentPasswordHash = crypto.createHash("sha256").update(current_password).digest("hex");
    if (user.password_hash !== currentPasswordHash) {
      return res.status(401).json({ error: "Current password incorrect" });
    }
    
    // Update password
    const newPasswordHash = crypto.createHash("sha256").update(new_password).digest("hex");
    await pool.query(
      "UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newPasswordHash, user.id]
    );
    
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
