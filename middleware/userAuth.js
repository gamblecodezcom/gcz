import pool from "../utils/db.js";
import crypto from "crypto";

/**
 * Middleware to extract and validate user from request
 * Supports multiple methods:
 * - x-user-id header
 * - user_id in body/query
 * - session-based (future)
 */
export async function getUserFromRequest(req) {
  // Try header first
  let userId = req.headers["x-user-id"];
  
  // Fall back to body or query
  if (!userId) {
    userId = req.body?.user_id || req.query?.user_id;
  }
  
  // If still no user, return null (guest access)
  if (!userId || userId === "guest") {
    return null;
  }
  
  // Fetch user from database
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Auto-create user if doesn't exist
      await pool.query(
        `INSERT INTO users (user_id, created_at, updated_at)
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      return { user_id: userId, pin_hash: null, locked: false };
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Middleware to require user authentication
 */
export async function requireUser(req, res, next) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (user.locked) {
    return res.status(403).json({ error: "Account is locked" });
  }
  
  req.user = user;
  next();
}

/**
 * Middleware to require PIN verification
 */
export async function requirePin(req, res, next) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!user.pin_hash) {
    return res.status(403).json({ error: "PIN not set. Please set your PIN first." });
  }
  
  const providedPin = req.body?.pin || req.headers["x-pin"];
  
  if (!providedPin) {
    return res.status(401).json({ error: "PIN required" });
  }
  
  // Verify PIN using timing-safe comparison
  const hash = crypto.createHash("sha256").update(providedPin).digest("hex");
  const isValid = crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(user.pin_hash)
  );
  
  if (!isValid) {
    return res.status(401).json({ error: "Invalid PIN" });
  }
  
  req.user = user;
  next();
}

/**
 * Check if user is blacklisted
 */
export async function checkBlacklist(req, res, next) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return next(); // Allow guest access
  }
  
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
  } catch (error) {
    console.error("Error checking blacklist:", error);
  }
  
  next();
}
