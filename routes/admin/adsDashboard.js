import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

// PLACEMENTS

// GET /api/admin/ads-dashboard/placements - List placements
router.get("/placements", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as current_campaign
       FROM ad_placements p
       LEFT JOIN ad_campaigns c ON c.id = p.current_campaign_id
       ORDER BY p.created_at DESC`
    );

    res.json({ placements: result.rows });
  } catch (error) {
    console.error("Error fetching placements:", error);
    res.status(500).json({ error: "Failed to fetch placements" });
  }
});

// POST /api/admin/ads-dashboard/placements - Create placement
router.post("/placements", async (req, res) => {
  try {
    const { placement_id, location, rotation_mode, frequency_capping } = req.body;

    if (!placement_id || !location || !rotation_mode) {
      return res.status(400).json({ error: "placement_id, location, and rotation_mode are required" });
    }

    const result = await pool.query(
      `INSERT INTO ad_placements (placement_id, location, rotation_mode, frequency_capping, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [placement_id, location, rotation_mode, frequency_capping || null]
    );

    await logAdminAction(req, "CREATE", "ad_placements", result.rows[0].id, { placement_id });

    res.json({ placement: result.rows[0] });
  } catch (error) {
    console.error("Error creating placement:", error);
    res.status(500).json({ error: "Failed to create placement" });
  }
});

// GET /api/admin/ads-dashboard/placements/:id - Get placement
router.get("/placements/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ad_placements WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Placement not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching placement:", error);
    res.status(500).json({ error: "Failed to fetch placement" });
  }
});

// PUT /api/admin/ads-dashboard/placements/:id - Update placement
router.put("/placements/:id", async (req, res) => {
  try {
    const { placement_id, location, rotation_mode, frequency_capping, status } = req.body;

    const result = await pool.query(
      `UPDATE ad_placements
       SET placement_id = $1, location = $2, rotation_mode = $3, frequency_capping = $4, status = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [placement_id, location, rotation_mode, frequency_capping || null, status || 'active', req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Placement not found" });
    }

    await logAdminAction(req, "UPDATE", "ad_placements", req.params.id);

    res.json({ placement: result.rows[0] });
  } catch (error) {
    console.error("Error updating placement:", error);
    res.status(500).json({ error: "Failed to update placement" });
  }
});

// DELETE /api/admin/ads-dashboard/placements/:id - Delete placement
router.delete("/placements/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM ad_placements WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Placement not found" });
    }

    await logAdminAction(req, "DELETE", "ad_placements", req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting placement:", error);
    res.status(500).json({ error: "Failed to delete placement" });
  }
});

// CAMPAIGNS

// GET /api/admin/ads-dashboard/campaigns - List campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
       (SELECT array_agg(placement_id) FROM ad_placements WHERE id = ANY(c.placement_ids)) as placement_names
       FROM ad_campaigns c
       ORDER BY c.created_at DESC`
    );

    res.json({ campaigns: result.rows });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// POST /api/admin/ads-dashboard/campaigns - Create campaign
router.post("/campaigns", async (req, res) => {
  try {
    const { name, type, linked_site, image_url, headline, subtext, cta_text, target_url, placement_ids, start_date, end_date } = req.body;

    if (!name || !type || !image_url || !headline || !cta_text || !target_url) {
      return res.status(400).json({ error: "name, type, image_url, headline, cta_text, and target_url are required" });
    }

    const status = start_date && new Date(start_date) > new Date() ? 'scheduled' : 'active';
    const startAt = start_date ? new Date(start_date) : null;
    const endAt = end_date ? new Date(end_date) : null;

    const result = await pool.query(
      `INSERT INTO ad_campaigns (name, type, linked_site, image_url, headline, subtext, cta_text, target_url, placement_ids, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, type, linked_site || null, image_url, headline, subtext || null, cta_text, target_url, placement_ids || [], startAt, endAt, status]
    );

    await logAdminAction(req, "CREATE", "ad_campaigns", result.rows[0].id, { name, type });

    res.json({ campaign: result.rows[0] });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET /api/admin/ads-dashboard/campaigns/:id - Get campaign
router.get("/campaigns/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ad_campaigns WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

// PUT /api/admin/ads-dashboard/campaigns/:id - Update campaign
router.put("/campaigns/:id", async (req, res) => {
  try {
    const { name, type, linked_site, image_url, headline, subtext, cta_text, target_url, placement_ids, start_date, end_date, status } = req.body;

    const startAt = start_date ? new Date(start_date) : null;
    const endAt = end_date ? new Date(end_date) : null;

    const result = await pool.query(
      `UPDATE ad_campaigns
       SET name = $1, type = $2, linked_site = $3, image_url = $4, headline = $5, subtext = $6, 
           cta_text = $7, target_url = $8, placement_ids = $9, start_date = $10, end_date = $11, 
           status = $12, updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [name, type, linked_site || null, image_url, headline, subtext || null, cta_text, target_url, placement_ids || [], startAt, endAt, status || 'active', req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logAdminAction(req, "UPDATE", "ad_campaigns", req.params.id);

    res.json({ campaign: result.rows[0] });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// DELETE /api/admin/ads-dashboard/campaigns/:id - Delete campaign
router.delete("/campaigns/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM ad_campaigns WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logAdminAction(req, "DELETE", "ad_campaigns", req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

// SPONSORED RAFFLES

// GET /api/admin/ads-dashboard/sponsored-raffles - List sponsored raffles
router.get("/sponsored-raffles", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.name as raffle_name, r.sponsor_site, c.name as ad_campaign,
       (SELECT COUNT(*) FROM ad_clicks WHERE campaign_id = c.id) as clicks,
       (SELECT COUNT(*) FROM raffle_entries WHERE raffle_id = r.id AND source = 'ad_click') as entries_attributed
       FROM raffles r
       LEFT JOIN ad_campaigns c ON c.id = r.sponsor_campaign_id
       WHERE r.sponsor_site IS NOT NULL
       ORDER BY r.created_at DESC`
    );

    res.json({ sponsored_raffles: result.rows });
  } catch (error) {
    console.error("Error fetching sponsored raffles:", error);
    res.status(500).json({ error: "Failed to fetch sponsored raffles" });
  }
});

// PERFORMANCE

// GET /api/admin/ads-dashboard/performance - Get performance stats
router.get("/performance", async (req, res) => {
  try {
    const { start, end } = req.query;
    let dateFilter = "";
    const params = [];

    if (start && end) {
      dateFilter = "WHERE created_at >= $1 AND created_at <= $2";
      params.push(start, end);
    } else if (start) {
      dateFilter = "WHERE created_at >= $1";
      params.push(start);
    } else if (end) {
      dateFilter = "WHERE created_at <= $1";
      params.push(end);
    }

    // Placement stats
    const placementStats = await pool.query(
      `SELECT p.placement_id,
       COUNT(DISTINCT ai.id) as impressions,
       COUNT(DISTINCT ac.id) as clicks,
       CASE WHEN COUNT(DISTINCT ai.id) > 0 
         THEN ROUND(COUNT(DISTINCT ac.id)::numeric / COUNT(DISTINCT ai.id)::numeric * 100, 2) || '%'
         ELSE '0%' END as ctr
       FROM ad_placements p
       LEFT JOIN ad_impressions ai ON ai.placement_id = p.id ${dateFilter ? `AND ai.created_at >= $${params.length + 1} AND ai.created_at <= $${params.length + 2}` : ''}
       LEFT JOIN ad_clicks ac ON ac.placement_id = p.id ${dateFilter ? `AND ac.created_at >= $${params.length + 1} AND ac.created_at <= $${params.length + 2}` : ''}
       GROUP BY p.placement_id`,
      params.length > 0 ? [...params, ...params] : []
    );

    // Campaign stats
    const campaignStats = await pool.query(
      `SELECT c.name,
       COUNT(DISTINCT ac.id) as clicks,
       CASE WHEN COUNT(DISTINCT ai.id) > 0 
         THEN ROUND(COUNT(DISTINCT ac.id)::numeric / COUNT(DISTINCT ai.id)::numeric * 100, 2) || '%'
         ELSE '0%' END as ctr,
       'N/A' as lift
       FROM ad_campaigns c
       LEFT JOIN ad_clicks ac ON ac.campaign_id = c.id ${dateFilter ? `AND ac.created_at >= $${params.length + 1} AND ac.created_at <= $${params.length + 2}` : ''}
       LEFT JOIN ad_impressions ai ON ai.campaign_id = c.id ${dateFilter ? `AND ai.created_at >= $${params.length + 1} AND ai.created_at <= $${params.length + 2}` : ''}
       GROUP BY c.name`,
      params.length > 0 ? [...params, ...params] : []
    );

    res.json({
      placement_stats: placementStats.rows,
      campaign_stats: campaignStats.rows
    });
  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({ error: "Failed to fetch performance data" });
  }
});

export default router;
