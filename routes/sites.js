import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

// GET /api/sites - Get sites with pagination and filters
router.get("/", async (req, res) => {
  try {
    const {
      jurisdiction,
      category,
      page = 1,
      limit = 20,
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT 
        id,
        name,
        slug,
        logo as icon_url,
        sort_order as priority,
        CASE 
          WHEN status = 'active' THEN 'active'
          WHEN status = 'paused' THEN 'paused'
          ELSE 'blacklisted'
        END as status,
        jurisdiction,
        category,
        level,
        bonus_code,
        bonus_description,
        redemption_speed,
        redemption_minimum,
        redemption_type,
        resolved_domain as resolveddomain,
        top_pick as is_top_pick,
        slug as redirect_slug,
        url as redirect_url,
        created_at as date_added
      FROM affiliates_master
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (jurisdiction) {
      query += ` AND (jurisdiction = $${paramIndex} OR jurisdiction = 'GLOBAL')`;
      params.push(jurisdiction);
      paramIndex++;
    }
    
    if (category) {
      // Category is stored as comma-separated string, check if it contains the category
      query += ` AND category LIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }
    
    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      "SELECT COUNT(*) as total FROM"
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);
    
    // Add pagination
    query += ` ORDER BY sort_order DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data: result.rows.map((row) => ({
        id: row.id.toString(),
        name: row.name,
        slug: row.slug || "",
        icon_url: row.icon_url || "",
        priority: row.priority || 0,
        status: row.status || "active",
        jurisdiction: row.jurisdiction || "GLOBAL",
        category: row.category || "",
        categories: row.category ? row.category.split(",").map((c) => c.trim()) : [],
        level: row.level || undefined,
        bonus_code: row.bonus_code || undefined,
        bonus_description: row.bonus_description || undefined,
        redemption_speed: row.redemption_speed || undefined,
        redemption_minimum: row.redemption_minimum || undefined,
        redemption_type: row.redemption_type || undefined,
        resolveddomain: row.resolveddomain || "",
        is_top_pick: row.is_top_pick || false,
        redirect_slug: row.redirect_slug || "",
        redirect_url: row.redirect_url || undefined,
        date_added: row.date_added ? row.date_added.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching sites:", error);
    res.status(500).json({ error: "Failed to fetch sites" });
  }
});

// GET /api/sites/recent - Get recently added sites
router.get("/recent", async (req, res) => {
  try {
    const {
      jurisdiction,
      category,
      page = 1,
      limit = 20,
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT 
        id,
        name,
        slug,
        logo as icon_url,
        sort_order as priority,
        'active' as status,
        jurisdiction,
        category,
        level,
        bonus_code,
        bonus_description,
        redemption_speed,
        redemption_minimum,
        redemption_type,
        resolved_domain as resolveddomain,
        top_pick as is_top_pick,
        slug as redirect_slug,
        url as redirect_url,
        created_at as date_added
      FROM affiliates_master
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (jurisdiction) {
      query += ` AND (jurisdiction = $${paramIndex} OR jurisdiction = 'GLOBAL')`;
      params.push(jurisdiction);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND category LIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }
    
    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      "SELECT COUNT(*) as total FROM"
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);
    
    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data: result.rows.map((row) => ({
        id: row.id.toString(),
        name: row.name,
        slug: row.slug || "",
        icon_url: row.icon_url || "",
        priority: row.priority || 0,
        status: row.status || "active",
        jurisdiction: row.jurisdiction || "GLOBAL",
        category: row.category || "",
        categories: row.category ? row.category.split(",").map((c) => c.trim()) : [],
        level: row.level || undefined,
        bonus_code: row.bonus_code || undefined,
        bonus_description: row.bonus_description || undefined,
        redemption_speed: row.redemption_speed || undefined,
        redemption_minimum: row.redemption_minimum || undefined,
        redemption_type: row.redemption_type || undefined,
        resolveddomain: row.resolveddomain || "",
        is_top_pick: row.is_top_pick || false,
        redirect_slug: row.redirect_slug || "",
        redirect_url: row.redirect_url || undefined,
        date_added: row.date_added ? row.date_added.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching recent sites:", error);
    res.status(500).json({ error: "Failed to fetch recent sites" });
  }
});

export default router;
