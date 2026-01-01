import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

/**
 * @typedef {Object} PromoCode
 * @property {string} id
 * @property {string} site
 * @property {string} code
 * @property {string} description
 * @property {string} [expiresAt]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} PromoLink
 * @property {string} id
 * @property {string} site
 * @property {string} url
 * @property {string} description
 * @property {string} createdAt
 */

/**
 * @typedef {Object} LiveDashboardResponse
 * @property {PromoCode[]} promoCodes
 * @property {PromoLink[]} promoLinks
 */

/**
 * GET /api/live-dashboard
 * Get live promo codes and links
 * 
 * @route GET /api/live-dashboard
 * @returns {Promise<LiveDashboardResponse>} 200 - Success response with promo codes and links
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/", async (req, res) => {
  try {
    // Get recent approved promos (codes)
    const promoCodesResult = await pool.query(
      `SELECT 
        p.id,
        am.name as site,
        p.clean_text as code,
        p.content as description,
        p.created_at as "createdAt",
        p.updated_at as "expiresAt"
       FROM promos p
       LEFT JOIN affiliates_master am ON p.affiliate_id = am.id
       WHERE p.status = 'approved' 
       AND p.channel = 'codes'
       ORDER BY p.created_at DESC 
       LIMIT 20`
    );
    
    // Get recent approved promos (links)
    const promoLinksResult = await pool.query(
      `SELECT 
        p.id,
        am.name as site,
        p.content as url,
        p.clean_text as description,
        p.created_at as "createdAt"
       FROM promos p
       LEFT JOIN affiliates_master am ON p.affiliate_id = am.id
       WHERE p.status = 'approved' 
       AND p.channel = 'links'
       ORDER BY p.created_at DESC 
       LIMIT 20`
    );
    
    const response = {
      promoCodes: promoCodesResult.rows.map((row) => ({
        id: row.id.toString(),
        site: row.site || "Unknown",
        code: row.code || "",
        description: row.description || "",
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : undefined,
        createdAt: row.createdAt.toISOString(),
      })),
      promoLinks: promoLinksResult.rows.map((row) => ({
        id: row.id.toString(),
        site: row.site || "Unknown",
        url: row.url || "",
        description: row.description || "",
        createdAt: row.createdAt.toISOString(),
      })),
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching live dashboard:", error);
    res.status(500).json({ 
      error: "Failed to fetch live dashboard data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
