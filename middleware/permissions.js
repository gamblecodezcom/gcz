import pool from "../utils/db.js";
import { getAdminUser } from "./adminAuth.js";

/**
 * Permission checking middleware
 * Usage: requirePermission('users', 'view')
 */
export function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      const adminUser = await getAdminUser(req);
      
      if (!adminUser || !adminUser.id) {
        return res.status(401).json({ error: "Admin authentication required" });
      }
      
      // Super admin bypass (check if user has super_admin role)
      const superAdminCheck = await pool.query(
        `SELECT 1 FROM admin_user_roles ur
         JOIN admin_roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1 AND r.name = 'super_admin'`,
        [adminUser.id]
      );
      
      if (superAdminCheck.rows.length > 0) {
        return next(); // Super admin has all permissions
      }
      
      // Check if user has the required permission
      const permissionCheck = await pool.query(
        `SELECT 1 FROM admin_user_roles ur
         JOIN admin_role_permissions rp ON ur.role_id = rp.role_id
         JOIN admin_permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = $1 AND p.resource = $2 AND p.action = $3`,
        [adminUser.id, resource, action]
      );
      
      if (permissionCheck.rows.length === 0) {
        return res.status(403).json({ 
          error: "Insufficient permissions",
          required: `${resource}:${action}`
        });
      }
      
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Permission check failed" });
    }
  };
}

/**
 * Check if admin user has any of the specified permissions
 * Returns true if user has at least one permission
 */
export async function hasAnyPermission(adminUserId, permissions) {
  try {
    if (!adminUserId) return false;
    
    // Check if super admin
    const superAdminCheck = await pool.query(
      `SELECT 1 FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = 'super_admin'`,
      [adminUserId]
    );
    
    if (superAdminCheck.rows.length > 0) {
      return true;
    }
    
    // Build permission check query
    const permissionConditions = permissions.map((perm, idx) => {
      const [resource, action] = perm.split(':');
      return `(p.resource = $${idx * 2 + 2} AND p.action = $${idx * 2 + 3})`;
    }).join(' OR ');
    
    const params = [adminUserId];
    permissions.forEach(perm => {
      const [resource, action] = perm.split(':');
      params.push(resource, action);
    });
    
    const result = await pool.query(
      `SELECT 1 FROM admin_user_roles ur
       JOIN admin_role_permissions rp ON ur.role_id = rp.role_id
       JOIN admin_permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1 AND (${permissionConditions})`,
      params
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking permissions:", error);
    return false;
  }
}

/**
 * Get all permissions for an admin user
 */
export async function getUserPermissions(adminUserId) {
  try {
    if (!adminUserId) return [];
    
    // Check if super admin
    const superAdminCheck = await pool.query(
      `SELECT 1 FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = 'super_admin'`,
      [adminUserId]
    );
    
    if (superAdminCheck.rows.length > 0) {
      // Return all permissions for super admin
      const allPerms = await pool.query(
        "SELECT resource, action FROM admin_permissions"
      );
      return allPerms.rows.map(p => `${p.resource}:${p.action}`);
    }
    
    // Get user's permissions through roles
    const result = await pool.query(
      `SELECT DISTINCT p.resource, p.action
       FROM admin_user_roles ur
       JOIN admin_role_permissions rp ON ur.role_id = rp.role_id
       JOIN admin_permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1`,
      [adminUserId]
    );
    
    return result.rows.map(p => `${p.resource}:${p.action}`);
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

/**
 * Get all roles for an admin user
 */
export async function getUserRoles(adminUserId) {
  try {
    if (!adminUserId) return [];
    
    const result = await pool.query(
      `SELECT r.id, r.name, r.display_name, r.description
       FROM admin_user_roles ur
       JOIN admin_roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [adminUserId]
    );
    
    return result.rows;
  } catch (error) {
    console.error("Error getting user roles:", error);
    return [];
  }
}
