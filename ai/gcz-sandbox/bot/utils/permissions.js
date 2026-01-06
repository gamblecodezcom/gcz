import { config } from "../config.js";
import { log } from "./logger.js";

// Role constants
export const ROLES = {
  USER: 1,
  MOD: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

// Optional: your Telegram super admin ID from memory
const SUPER_ADMIN_ID = 6668510825;

// Fetch role from your backend API
async function fetchRoleFromAPI(telegramId) {
  try {
    const res = await fetch(`${config.API_BASE}/auth/role/${telegramId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.role || null;
  } catch (err) {
    log("permissions", "Failed to fetch role from API", err);
    return null;
  }
}

// Main role resolver
export async function getUserRole(telegramId) {
  try {
    // Hardcoded super admin override
    if (telegramId === SUPER_ADMIN_ID) {
      return ROLES.SUPER_ADMIN;
    }

    const role = await fetchRoleFromAPI(telegramId);

    if (!role) return ROLES.USER;

    switch (role.toLowerCase()) {
      case "mod":
      case "moderator":
        return ROLES.MOD;

      case "admin":
        return ROLES.ADMIN;

      case "superadmin":
      case "super_admin":
        return ROLES.SUPER_ADMIN;

      default:
        return ROLES.USER;
    }
  } catch (err) {
    log("permissions", "Error resolving user role", err);
    return ROLES.USER;
  }
}

// Helper: check if user has required role
export function hasRole(userRole, requiredRole) {
  return userRole >= requiredRole;
}
