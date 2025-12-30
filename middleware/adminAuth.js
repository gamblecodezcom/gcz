import pool from "../utils/db.js";
import crypto from "crypto";

/**
 * Enhanced admin authentication middleware
 * Supports both token-based (legacy) and session-based authentication
 */
export default async function adminAuth(req, res, next) {
  // Try session-based authentication first
  const sessionToken = req.headers["x-admin-session"] || 
                       req.cookies?.admin_session ||
                       req.body?.admin_session;
  
  if (sessionToken) {
    try {
      // Verify session
      const sessionResult = await pool.query(
        `SELECT s.*, u.id as user_id, u.username, u.email, u.active
         FROM admin_sessions s
         JOIN admin_users u ON s.user_id = u.id
         WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.active = true`,
        [sessionToken]
      );
      
      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        
        // Attach admin user to request
        req.adminUser = {
          id: session.user_id,
          username: session.username,
          email: session.email
        };
        
        // Update last login info
        await pool.query(
          `UPDATE admin_users 
           SET last_login = NOW(), last_login_ip = $1
           WHERE id = $2`,
          [req.ip || req.connection.remoteAddress, session.user_id]
        );
        
        return next();
      }
    } catch (error) {
      console.error("Session auth error:", error);
      // Fall through to token auth
    }
  }
  
  // Fall back to token-based authentication (legacy)
  const token = req.headers["x-admin-token"];
  const expected = process.env.ADMIN_TOKEN;
  
  if (!token || !expected) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  
  const valid =
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  
  if (!valid) {
    return res.status(403).json({ error: "Invalid admin token" });
  }
  
  // For token-based auth, set a default admin user
  req.adminUser = {
    id: null,
    username: "system",
    email: "system@gamblecodez.com"
  };
  
  next();
}

/**
 * Get admin user from request (for use in routes)
 */
export async function getAdminUser(req) {
  if (req.adminUser) {
    return req.adminUser;
  }
  
  // Try to get from session
  const sessionToken = req.headers["x-admin-session"] || 
                       req.cookies?.admin_session ||
                       req.body?.admin_session;
  
  if (sessionToken) {
    try {
      const result = await pool.query(
        `SELECT u.id, u.username, u.email
         FROM admin_sessions s
         JOIN admin_users u ON s.user_id = u.id
         WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.active = true`,
        [sessionToken]
      );
      
      if (result.rows.length > 0) {
        return {
          id: result.rows[0].id,
          username: result.rows[0].username,
          email: result.rows[0].email
        };
      }
    } catch (error) {
      console.error("Error getting admin user:", error);
    }
  }
  
  return null;
}
