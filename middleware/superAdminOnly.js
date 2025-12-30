import pool from "../utils/db.js";
import { getAdminUser } from "./adminAuth.js";

/**
 * Middleware to restrict access to Super Admin only
 * Checks if user has 'super_admin' role OR is the Super Admin Telegram ID
 * 
 * Usage: router.post("/", superAdminOnly, handler)
 */
export default async function superAdminOnly(req, res, next) {
  try {
    // Check for Telegram admin ID in request (for bot commands)
    const telegramId = req.body?.telegram_id || req.query?.telegram_id || req.headers["x-telegram-id"];
    const superAdminTelegramId = process.env.TELEGRAM_ADMIN_ID ? parseInt(process.env.TELEGRAM_ADMIN_ID) : null;
    
    // If this is a Telegram request and matches Super Admin Telegram ID, allow
    if (telegramId && superAdminTelegramId && parseInt(telegramId) === superAdminTelegramId) {
      return next();
    }
    
    // Check for admin user (web admin panel)
    const adminUser = await getAdminUser(req);
    
    if (!adminUser || !adminUser.id) {
      return res.status(401).json({ 
        error: "Super Admin authentication required",
        message: "Only Super Administrators can perform this action"
      });
    }
    
    // Check if user has super_admin role
    const superAdminCheck = await pool.query(
      `SELECT 1 FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = 'super_admin'`,
      [adminUser.id]
    );
    
    if (superAdminCheck.rows.length === 0) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        message: "Only Super Administrators can perform this action",
        required: "super_admin role"
      });
    }
    
    next();
  } catch (error) {
    console.error("Super Admin check error:", error);
    res.status(500).json({ error: "Permission check failed" });
  }
}

/**
 * Helper function to check if a Telegram user ID is the Super Admin
 * Used in bot commands
 */
export function isSuperAdminTelegram(telegramId) {
  const superAdminTelegramId = process.env.TELEGRAM_ADMIN_ID ? parseInt(process.env.TELEGRAM_ADMIN_ID) : null;
  return superAdminTelegramId && telegramId === superAdminTelegramId;
}

/**
 * Helper function to check if an admin user ID has super_admin role
 * Used in API routes
 */
export async function isSuperAdminUser(adminUserId) {
  try {
    if (!adminUserId) return false;
    
    const result = await pool.query(
      `SELECT 1 FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = 'super_admin'`,
      [adminUserId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking super admin:", error);
    return false;
  }
}
