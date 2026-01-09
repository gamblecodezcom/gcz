import { config } from "../config.js";
import { log } from "../utils/logger.js";

export const TelegramRoles = {
  LEVELS: {
    USER: 0,
    MOD: 1,
    MANAGER: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4
  },

  LABELS: {
    0: "User",
    1: "Moderator",
    2: "Manager",
    3: "Admin",
    4: "Super Admin"
  },

  SUPER_ADMIN_TELEGRAM_ID: "6668510825",

  // ============================
  // ROLE CACHE (memory)
  // ============================
  _cache: new Map(),
  CACHE_TTL: 60 * 1000, // 60 seconds

  _getCached(telegramId) {
    const entry = this._cache.get(telegramId);
    if (!entry) return null;

    const expired = Date.now() - entry.timestamp > this.CACHE_TTL;
    if (expired) {
      this._cache.delete(telegramId);
      return null;
    }

    return entry.role;
  },

  _setCached(telegramId, role) {
    this._cache.set(telegramId, {
      role,
      timestamp: Date.now()
    });
  },

  async fetchRoleFromAPI(telegramId) {
    try {
      const res = await fetch(`${config.API_BASE}/auth/role/${telegramId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.role;
    } catch (err) {
      log("roles", "Failed to fetch role from API", err);
      return null;
    }
  },

  normalize(role) {
    if (!role) return this.LEVELS.USER;

    switch (role.toLowerCase()) {
      case "mod":
      case "moderator":
        return this.LEVELS.MOD;
      case "manager":
        return this.LEVELS.MANAGER;
      case "admin":
        return this.LEVELS.ADMIN;
      case "superadmin":
      case "super_admin":
        return this.LEVELS.SUPER_ADMIN;
      default:
        return this.LEVELS.USER;
    }
  },

  async getRoleLevel(telegramId) {
    telegramId = telegramId.toString();

    if (telegramId === this.SUPER_ADMIN_TELEGRAM_ID) {
      return this.LEVELS.SUPER_ADMIN;
    }

    const cached = this._getCached(telegramId);
    if (cached !== null) {
      return cached;
    }

    const apiRole = await this.fetchRoleFromAPI(telegramId);
    const level = this.normalize(apiRole);

    this._setCached(telegramId, level);

    return level;
  },

  async hasRole(telegramId, required) {
    const level = await this.getRoleLevel(telegramId);
    return level >= required;
  }
};