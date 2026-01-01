import pool from "../utils/db.js";
import crypto from "crypto";

/**
 * Extract user from request
 * Supports:
 * - x-user-id header
 * - user_id in body/query
 */
export async function getUserFromRequest(req) {
  let userId = req.headers["x-user-id"];
  if (!userId) userId = req.body?.user_id || req.query?.user_id;

  if (!userId || userId === "guest") return null;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (user_id, created_at, updated_at)
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      return {
        user_id: userId,
        pin_hash: null,
        locked: false,
        admin_level: 0
      };
    }

    return result.rows[0];
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
}

/**
 * Require authenticated user
 */
export async function requireUser(req, res, next) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (user.locked) return res.status(403).json({ error: "Account is locked" });

  req.user = user;
  next();
}

/**
 * Require PIN verification
 */
export async function requirePin(req, res, next) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });

  if (!user.pin_hash)
    return res.status(403).json({ error: "PIN not set. Please set your PIN first." });

  const providedPin = req.body?.pin || req.headers["x-pin"];
  if (!providedPin) return res.status(401).json({ error: "PIN required" });

  const hash = crypto.createHash("sha256").update(providedPin).digest("hex");
  const isValid = crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(user.pin_hash)
  );

  if (!isValid) return res.status(401).json({ error: "Invalid PIN" });

  req.user = user;
  next();
}

/**
 * Check blacklist
 */
export async function checkBlacklist(req, res, next) {
  const user = await getUserFromRequest(req);
  if (!user) return next();

  try {
    const result = await pool.query(
      "SELECT * FROM blacklist WHERE user_id = $1",
      [user.user_id]
    );

    if (result.rows.length > 0) {
      return res.status(403).json({
        error: "Access denied",
        message: "Your account has been blacklisted"
      });
    }
  } catch (err) {
    console.error("Error checking blacklist:", err);
  }

  next();
}

/**
 * Require minimum admin level
 */
export const requireLevel = lvl => (req, res, next) => {
  if (!req.user || req.user.admin_level < lvl)
    return res.status(403).json({ error: "Insufficient permissions" });
  next();
};

/**
 * Require super admin (level 5)
 */
export const requireSuper = (req, res, next) => {
  if (!req.user || req.user.admin_level !== 5)
    return res.status(403).json({ error: "Super admin only" });
  next();
};
