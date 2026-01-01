import express from "express";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import { validateAffiliateCSV } from "../utils/validateCsv.js";

const router = express.Router();

/**
 * ============================================
 * CSV VALIDATION (NON‑BLOCKING)
 * ============================================
 */
try {
  validateAffiliateCSV("master_affiliates.csv");
} catch (error) {
  logger.warn("CSV validation warning (non-blocking): " + error.message);
}

/**
 * ============================================
 * GET /api/affiliates
 * Fetch all affiliates (dropdown / admin panel)
 * Supports optional:
 *   ?search=shock
 *   ?level=5
 *   ?sort=name|priority
 * ============================================
 */
router.get("/", async (req, res) => {
  const { search, level, sort } = req.query;

  let query = `
    SELECT id, name, affiliate_url, level, priority, category, status
    FROM affiliates_master
    WHERE 1=1
  `;
  const params = [];

  // Search filter
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    query += ` AND LOWER(name) LIKE $${params.length}`;
  }

  // Level filter
  if (level) {
    params.push(level);
    query += ` AND level = $${params.length}`;
  }

  // Sorting
  if (sort === "priority") {
    query += " ORDER BY priority DESC, name ASC";
  } else {
    query += " ORDER BY name ASC";
  }

  try {
    const result = await pool.query(query, params);
    return res.json({ ok: true, affiliates: result.rows });
  } catch (error) {
    logger.error("affiliates: GET / failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch affiliates" });
  }
});

/**
 * ============================================
 * GET /api/affiliates/:id
 * Fetch a single affiliate by ID
 * ============================================
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM affiliates_master
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Affiliate not found" });
    }

    return res.json({ ok: true, affiliate: result.rows[0] });
  } catch (error) {
    logger.error("affiliates: GET /:id failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch affiliate" });
  }
});

export default router;
