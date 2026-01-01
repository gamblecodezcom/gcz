import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

/**
 * GET /api/casino/:slug
 * Get casino details by slug for SEO pages
 * 
 * @route GET /api/casino/:slug
 * @param {string} req.params.slug - Casino slug
 * @returns {Promise<CasinoDetails>} 200 - Success response with casino details
 * @returns {Promise<{error: string}>} 404 - Casino not found
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await pool.query(
      `SELECT 
        id,
        name,
        slug,
        description,
        logo as icon_url,
        affiliate_url,
        jurisdiction,
        category,
        level,
        bonus_code,
        bonus_description,
        redemption_speed,
        redemption_minimum,
        redemption_type,
        resolved_domain,
        top_pick,
        created_at
       FROM affiliates_master 
       WHERE slug = $1 OR LOWER(name) = LOWER($1)
       LIMIT 1`,
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Casino not found" });
    }
    
    const casino = result.rows[0];
    
    res.json({
      id: casino.id.toString(),
      name: casino.name,
      slug: casino.slug || slug,
      description: casino.description || null,
      iconUrl: casino.icon_url || null,
      affiliateUrl: casino.affiliate_url || null,
      jurisdiction: casino.jurisdiction || "GLOBAL",
      category: casino.category || "",
      categories: casino.category ? casino.category.split(",").map((c) => c.trim()) : [],
      level: casino.level || null,
      bonusCode: casino.bonus_code || null,
      bonusDescription: casino.bonus_description || null,
      redemptionSpeed: casino.redemption_speed || null,
      redemptionMinimum: casino.redemption_minimum || null,
      redemptionType: casino.redemption_type || null,
      resolvedDomain: casino.resolved_domain || null,
      isTopPick: casino.top_pick || false,
      createdAt: casino.created_at ? casino.created_at.toISOString() : null,
    });
  } catch (error) {
    console.error("Error fetching casino:", error);
    res.status(500).json({ error: "Failed to fetch casino details" });
  }
});

export default router;
