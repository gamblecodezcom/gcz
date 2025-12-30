import express from "express";
import pool from "../../utils/db.js";
import auth from "../../middleware/auth.js";
import dns from "dns";
import { promisify } from "util";

const router = express.Router();
const dnsLookup = promisify(dns.lookup);

// Helper to log admin actions
async function logAdminAction(req, action, resourceType, resourceId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_user, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.headers["x-admin-user"] || "unknown",
        action,
        resourceType,
        resourceId,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || ""
      ]
    );
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

/**
 * GET /api/admin/affiliate-analytics/overview
 * Get overview analytics for all affiliates
 * 
 * @route GET /api/admin/affiliate-analytics/overview
 * @param {Object} req.query
 * @param {string} [req.query.start_date] - Start date (ISO format)
 * @param {string} [req.query.end_date] - End date (ISO format)
 * @returns {Promise<{totalClicks: number, totalConversions: number, conversionRate: number, topAffiliates: Array}>} 200
 */
router.get("/overview", auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = "";
    const params = [];
    
    if (start_date || end_date) {
      const conditions = [];
      if (start_date) {
        conditions.push(`created_at >= $${params.length + 1}`);
        params.push(start_date);
      }
      if (end_date) {
        conditions.push(`created_at <= $${params.length + 1}`);
        params.push(end_date);
      }
      dateFilter = "WHERE " + conditions.join(" AND ");
    }
    
    // Get total clicks
    const clicksResult = await pool.query(
      `SELECT COUNT(*) as count FROM affiliate_clicks ${dateFilter.replace('created_at', 'clicked_at')}`,
      params
    );
    const totalClicks = parseInt(clicksResult.rows[0]?.count || 0);
    
    // Get total conversions
    const conversionsResult = await pool.query(
      `SELECT COUNT(*) as count FROM affiliate_conversions ${dateFilter.replace('created_at', 'converted_at')}`,
      params
    );
    const totalConversions = parseInt(conversionsResult.rows[0]?.count || 0);
    
    // Get top affiliates by clicks
    const topAffiliatesResult = await pool.query(
      `SELECT 
        am.id,
        am.name,
        am.slug,
        COUNT(ac.id) as click_count,
        COUNT(DISTINCT ac.user_id) as unique_users,
        COUNT(conv.id) as conversion_count,
        CASE 
          WHEN COUNT(ac.id) > 0 THEN ROUND(COUNT(conv.id)::numeric / COUNT(ac.id)::numeric * 100, 2)
          ELSE 0
        END as conversion_rate
       FROM affiliates_master am
       LEFT JOIN affiliate_clicks ac ON am.id = ac.affiliate_id
         ${start_date || end_date ? `AND ac.clicked_at >= $1 AND ac.clicked_at <= $2` : ''}
       LEFT JOIN affiliate_conversions conv ON am.id = conv.affiliate_id
         ${start_date || end_date ? `AND conv.converted_at >= $1 AND conv.converted_at <= $2` : ''}
       GROUP BY am.id, am.name, am.slug
       ORDER BY click_count DESC
       LIMIT 20`,
      start_date || end_date ? [start_date || '1970-01-01', end_date || new Date().toISOString()] : []
    );
    
    res.json({
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0,
      topAffiliates: topAffiliatesResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        clickCount: parseInt(row.click_count || 0),
        uniqueUsers: parseInt(row.unique_users || 0),
        conversionCount: parseInt(row.conversion_count || 0),
        conversionRate: parseFloat(row.conversion_rate || 0)
      }))
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    res.status(500).json({ error: "Failed to fetch analytics overview" });
  }
});

/**
 * GET /api/admin/affiliate-analytics/:id
 * Get detailed analytics for a specific affiliate
 * 
 * @route GET /api/admin/affiliate-analytics/:id
 * @param {number} req.params.id - Affiliate ID
 * @param {Object} req.query
 * @param {string} [req.query.start_date]
 * @param {string} [req.query.end_date]
 * @returns {Promise<{affiliate: Object, clicks: Object, conversions: Object, bonusCodes: Object}>} 200
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    // Get affiliate info
    const affiliateResult = await pool.query(
      "SELECT * FROM affiliates_master WHERE id = $1",
      [id]
    );
    
    if (affiliateResult.rows.length === 0) {
      return res.status(404).json({ error: "Affiliate not found" });
    }
    
    const affiliate = affiliateResult.rows[0];
    
    // Build date filter
    let dateFilter = "";
    const params = [id];
    
    if (start_date || end_date) {
      const conditions = [];
      if (start_date) {
        conditions.push(`clicked_at >= $${params.length + 1}`);
        params.push(start_date);
      }
      if (end_date) {
        conditions.push(`clicked_at <= $${params.length + 1}`);
        params.push(end_date);
      }
      dateFilter = "AND " + conditions.join(" AND ");
    }
    
    // Get clicks stats
    const clicksStats = await pool.query(
      `SELECT 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT DATE(clicked_at)) as active_days
       FROM affiliate_clicks 
       WHERE affiliate_id = $1 ${dateFilter}`,
      params
    );
    
    // Get conversions stats
    const conversionsStats = await pool.query(
      `SELECT 
        COUNT(*) as total_conversions,
        COUNT(DISTINCT conversion_type) as conversion_types,
        SUM(conversion_value) as total_value
       FROM affiliate_conversions 
       WHERE affiliate_id = $1 
         ${dateFilter.replace('clicked_at', 'converted_at')}`,
      params
    );
    
    // Get bonus code usage
    const bonusCodeStats = await pool.query(
      `SELECT 
        bonus_code,
        COUNT(*) as usage_count,
        COUNT(DISTINCT user_id) as unique_users
       FROM bonus_code_usage 
       WHERE affiliate_id = $1
         ${dateFilter.replace('clicked_at', 'used_at')}
       GROUP BY bonus_code
       ORDER BY usage_count DESC`,
      params
    );
    
    // Get daily breakdown
    const dailyBreakdown = await pool.query(
      `SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as clicks,
        COUNT(DISTINCT user_id) as unique_users
       FROM affiliate_clicks 
       WHERE affiliate_id = $1 ${dateFilter}
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );
    
    res.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        slug: affiliate.slug,
        url: affiliate.url,
        resolved_domain: affiliate.resolved_domain
      },
      clicks: {
        total: parseInt(clicksStats.rows[0]?.total_clicks || 0),
        uniqueUsers: parseInt(clicksStats.rows[0]?.unique_users || 0),
        activeDays: parseInt(clicksStats.rows[0]?.active_days || 0),
        dailyBreakdown: dailyBreakdown.rows.map((row) => ({
          date: row.date.toISOString().split('T')[0],
          clicks: parseInt(row.clicks || 0),
          uniqueUsers: parseInt(row.unique_users || 0)
        }))
      },
      conversions: {
        total: parseInt(conversionsStats.rows[0]?.total_conversions || 0),
        types: parseInt(conversionsStats.rows[0]?.conversion_types || 0),
        totalValue: parseFloat(conversionsStats.rows[0]?.total_value || 0),
        conversionRate: clicksStats.rows[0]?.total_clicks > 0
          ? ((parseInt(conversionsStats.rows[0]?.total_conversions || 0) / parseInt(clicksStats.rows[0]?.total_clicks || 1)) * 100).toFixed(2)
          : 0
      },
      bonusCodes: bonusCodeStats.rows.map((row) => ({
        code: row.bonus_code,
        usageCount: parseInt(row.usage_count || 0),
        uniqueUsers: parseInt(row.unique_users || 0)
      }))
    });
  } catch (error) {
    console.error("Error fetching affiliate analytics:", error);
    res.status(500).json({ error: "Failed to fetch affiliate analytics" });
  }
});

/**
 * POST /api/admin/affiliate-analytics/track-click
 * Track an affiliate click
 * 
 * @route POST /api/admin/affiliate-analytics/track-click
 * @param {Object} req.body
 * @param {number} req.body.affiliate_id
 * @param {string} [req.body.slug]
 * @param {string} [req.body.user_id]
 * @returns {Promise<{success: boolean}>} 200
 */
router.post("/track-click", auth, async (req, res) => {
  try {
    const { affiliate_id, slug, user_id } = req.body;
    const referrer = req.get("referer") || null;
    const userAgent = req.get("user-agent") || null;
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    
    await pool.query(
      `INSERT INTO affiliate_clicks (affiliate_id, user_id, slug, referrer, user_agent, ip_address, clicked_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [affiliate_id, user_id || null, slug || null, referrer, userAgent, ipAddress]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({ error: "Failed to track click" });
  }
});

/**
 * POST /api/admin/affiliate-analytics/track-conversion
 * Track an affiliate conversion
 * 
 * @route POST /api/admin/affiliate-analytics/track-conversion
 * @param {Object} req.body
 * @param {number} req.body.affiliate_id
 * @param {string} req.body.user_id
 * @param {'signup'|'deposit'|'first_deposit'|'custom'} req.body.conversion_type
 * @param {number} [req.body.conversion_value]
 * @param {Object} [req.body.conversion_data]
 * @returns {Promise<{success: boolean}>} 200
 */
router.post("/track-conversion", auth, async (req, res) => {
  try {
    const { affiliate_id, user_id, conversion_type, conversion_value, conversion_data } = req.body;
    
    await pool.query(
      `INSERT INTO affiliate_conversions (affiliate_id, user_id, conversion_type, conversion_value, conversion_data, converted_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        affiliate_id,
        user_id,
        conversion_type,
        conversion_value || null,
        conversion_data ? JSON.stringify(conversion_data) : null
      ]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking conversion:", error);
    res.status(500).json({ error: "Failed to track conversion" });
  }
});

/**
 * POST /api/admin/affiliate-analytics/resolve-domain
 * Resolve domain for an affiliate URL
 * 
 * @route POST /api/admin/affiliate-analytics/resolve-domain
 * @param {Object} req.body
 * @param {number} req.body.affiliate_id
 * @param {string} [req.body.url] - Override URL to resolve
 * @returns {Promise<{success: boolean, resolved_domain: string}>} 200
 */
router.post("/resolve-domain", auth, async (req, res) => {
  try {
    const { affiliate_id, url } = req.body;
    
    // Get affiliate URL if not provided
    let targetUrl = url;
    if (!targetUrl) {
      const affiliateResult = await pool.query(
        "SELECT url FROM affiliates_master WHERE id = $1",
        [affiliate_id]
      );
      
      if (affiliateResult.rows.length === 0) {
        return res.status(404).json({ error: "Affiliate not found" });
      }
      
      targetUrl = affiliateResult.rows[0].url;
    }
    
    // Extract domain from URL
    let domain;
    try {
      const urlObj = new URL(targetUrl);
      domain = urlObj.hostname;
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }
    
    // Resolve domain
    let resolvedDomain = domain;
    let resolutionStatus = "success";
    let errorMessage = null;
    
    try {
      const addresses = await dnsLookup(domain);
      resolvedDomain = addresses.address || domain;
    } catch (error) {
      resolutionStatus = "failed";
      errorMessage = error.message;
    }
    
    // Log resolution
    await pool.query(
      `INSERT INTO domain_resolution_log (affiliate_id, original_url, resolved_domain, resolution_status, error_message, resolved_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [affiliate_id, targetUrl, resolvedDomain, resolutionStatus, errorMessage]
    );
    
    // Update affiliate if resolution successful
    if (resolutionStatus === "success") {
      await pool.query(
        "UPDATE affiliates_master SET resolved_domain = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [resolvedDomain, affiliate_id]
      );
    }
    
    await logAdminAction(req, "RESOLVE_DOMAIN", "affiliate", affiliate_id.toString(), {
      original_url: targetUrl,
      resolved_domain: resolvedDomain,
      status: resolutionStatus
    });
    
    res.json({
      success: true,
      resolved_domain: resolvedDomain,
      status: resolutionStatus
    });
  } catch (error) {
    console.error("Error resolving domain:", error);
    res.status(500).json({ error: "Failed to resolve domain" });
  }
});

/**
 * POST /api/admin/affiliate-analytics/import-csv
 * Import affiliates from CSV
 * 
 * @route POST /api/admin/affiliate-analytics/import-csv
 * @param {Object} req.body
 * @param {Array<Object>} req.body.affiliates - Array of affiliate objects
 * @returns {Promise<{success: boolean, imported: number, errors: Array}>} 200
 */
router.post("/import-csv", auth, async (req, res) => {
  try {
    const { affiliates } = req.body;
    
    if (!Array.isArray(affiliates)) {
      return res.status(400).json({ error: "affiliates must be an array" });
    }
    
    let imported = 0;
    const errors = [];
    
    for (const affiliate of affiliates) {
      try {
        await pool.query(
          `INSERT INTO affiliates_master (
            name, url, logo, top_pick, jurisdiction, slug, description,
            resolved_domain, redemption_speed, redemption_minimum, redemption_type,
            created_by, source, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            url = EXCLUDED.url,
            updated_at = CURRENT_TIMESTAMP`,
          [
            affiliate.name,
            affiliate.url || affiliate.affiliate_url,
            affiliate.logo || affiliate.icon_url,
            affiliate.top_pick || false,
            affiliate.jurisdiction,
            affiliate.slug,
            affiliate.description || "",
            affiliate.resolved_domain || "",
            affiliate.redemption_speed,
            affiliate.redemption_minimum,
            affiliate.redemption_type,
            req.headers["x-admin-user"] || "unknown",
            affiliate.source || "csv_import"
          ]
        );
        imported++;
      } catch (error) {
        errors.push({ affiliate: affiliate.name || "Unknown", error: error.message });
      }
    }
    
    await logAdminAction(req, "IMPORT_CSV", "affiliate", "bulk", {
      imported,
      total: affiliates.length,
      errors: errors.length
    });
    
    res.json({
      success: true,
      imported,
      total: affiliates.length,
      errors
    });
  } catch (error) {
    console.error("Error importing CSV:", error);
    res.status(500).json({ error: "Failed to import CSV" });
  }
});

/**
 * GET /api/admin/affiliate-analytics/category-mapping
 * Get category mappings for affiliates
 * 
 * @route GET /api/admin/affiliate-analytics/category-mapping
 * @returns {Promise<Array<{affiliate_id: number, category: string, priority: number}>>} 200
 */
router.get("/category-mapping", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        acm.affiliate_id,
        am.name as affiliate_name,
        acm.category,
        acm.priority
       FROM affiliate_category_mapping acm
       JOIN affiliates_master am ON acm.affiliate_id = am.id
       ORDER BY acm.affiliate_id, acm.priority DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching category mappings:", error);
    res.status(500).json({ error: "Failed to fetch category mappings" });
  }
});

/**
 * POST /api/admin/affiliate-analytics/category-mapping
 * Update category mapping for an affiliate
 * 
 * @route POST /api/admin/affiliate-analytics/category-mapping
 * @param {Object} req.body
 * @param {number} req.body.affiliate_id
 * @param {string} req.body.category
 * @param {number} [req.body.priority=0]
 * @returns {Promise<{success: boolean}>} 200
 */
router.post("/category-mapping", auth, async (req, res) => {
  try {
    const { affiliate_id, category, priority = 0 } = req.body;
    
    await pool.query(
      `INSERT INTO affiliate_category_mapping (affiliate_id, category, priority, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (affiliate_id, category) DO UPDATE SET priority = EXCLUDED.priority`,
      [affiliate_id, category, priority]
    );
    
    await logAdminAction(req, "UPDATE_CATEGORY_MAPPING", "affiliate", affiliate_id.toString(), {
      category,
      priority
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating category mapping:", error);
    res.status(500).json({ error: "Failed to update category mapping" });
  }
});

export default router;
