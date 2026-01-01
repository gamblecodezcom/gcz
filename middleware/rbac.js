/**
 * /var/www/html/gcz/server/middleware/rbac.js
 * Centralized RBAC middleware for GambleCodez backend
 */

export function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// -----------------------------
// SUPER ADMIN ONLY (Tyler)
// -----------------------------
export function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role_level !== 5) {
    return res.status(403).json({ error: "Only the owner can perform this action" });
  }
  next();
}

// -----------------------------
// ADMIN OR HIGHER (4–5)
// -----------------------------
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role_level < 4) {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  next();
}

// -----------------------------
// GENERIC PERMISSION CHECK
// (Admin panel + Telegram unified)
// -----------------------------
export function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ error: "Permission denied" });
    }

    if (!req.user.permissions.includes(permissionName)) {
      return res.status(403).json({ error: `Missing permission: ${permissionName}` });
    }

    next();
  };
}

// -----------------------------
// SITE‑ADMIN ROLE CHECK
// viewer < editor < manager < owner
// -----------------------------
export function requireSiteRole(requiredLevel) {
  return (req, res, next) => {
    const siteRole = req.siteRole; // must be loaded earlier in route

    if (!siteRole) {
      return res.status(403).json({ error: "No site role assigned" });
    }

    const levels = {
      viewer: 1,
      editor: 2,
      manager: 3,
      owner: 4
    };

    if (levels[siteRole] < levels[requiredLevel]) {
      return res.status(403).json({ error: `Requires site role: ${requiredLevel}` });
    }

    next();
  };
}

// -----------------------------
// SPECIALIZED RULES
// -----------------------------

// ONLY YOU can modify affiliates
export function requireAffiliateOwner(req, res, next) {
  if (!req.user || req.user.role_level !== 5) {
    return res.status(403).json({ error: "Only the owner can modify affiliates" });
  }
  next();
}

// Admins can approve SC links/codes + crypto promos
export function requirePromoApproval(req, res, next) {
  if (!req.user || req.user.role_level < 4) {
    return res.status(403).json({ error: "Admin required to approve promos" });
  }
  next();
}

// Operators (2) and above can view protected dashboards
export function requireOperator(req, res, next) {
  if (!req.user || req.user.role_level < 2) {
    return res.status(403).json({ error: "Operator access required" });
  }
  next();
}