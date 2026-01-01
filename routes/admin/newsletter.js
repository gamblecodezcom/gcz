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

// GET /api/admin/newsletter/campaigns - List campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, name, subject, preheader, segment, status, sent_count, open_rate, click_rate, created_at
       FROM newsletter_campaigns
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query("SELECT COUNT(*) FROM newsletter_campaigns");
    const total = parseInt(countResult.rows[0].count);

    await logAdminAction(req, "VIEW", "newsletter_campaigns", null);

    res.json({
      campaigns: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// POST /api/admin/newsletter/campaigns - Create campaign
router.post("/campaigns", async (req, res) => {
  try {
    const { name, subject, preheader, segment, content, schedule, scheduled_date } = req.body;

    if (!name || !subject || !segment || !content) {
      return res.status(400).json({ error: "name, subject, segment, and content are required" });
    }

    const status = schedule === "now" ? "draft" : "scheduled";
    const scheduledAt = scheduled_date ? new Date(scheduled_date) : null;

    const result = await pool.query(
      `INSERT INTO newsletter_campaigns (name, subject, preheader, segment, content, status, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, subject, preheader, segment, content, status, scheduledAt]
    );

    await logAdminAction(req, "CREATE", "newsletter_campaigns", result.rows[0].id, { name, subject });

    res.json({ campaign: result.rows[0] });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET /api/admin/newsletter/campaigns/:id - Get campaign
router.get("/campaigns/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM newsletter_campaigns WHERE id = $1",
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

// PUT /api/admin/newsletter/campaigns/:id - Update campaign
router.put("/campaigns/:id", async (req, res) => {
  try {
    const { name, subject, preheader, segment, content, schedule, scheduled_date } = req.body;

    const scheduledAt = scheduled_date ? new Date(scheduled_date) : null;

    const result = await pool.query(
      `UPDATE newsletter_campaigns
       SET name = $1, subject = $2, preheader = $3, segment = $4, content = $5, scheduled_at = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, subject, preheader, segment, content, scheduledAt, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logAdminAction(req, "UPDATE", "newsletter_campaigns", req.params.id);

    res.json({ campaign: result.rows[0] });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// DELETE /api/admin/newsletter/campaigns/:id - Delete campaign
router.delete("/campaigns/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM newsletter_campaigns WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logAdminAction(req, "DELETE", "newsletter_campaigns", req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

// GET /api/admin/newsletter/segments - List segments
router.get("/segments", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, description, rules, approx_count, created_at FROM newsletter_segments ORDER BY created_at DESC"
    );

    res.json({ segments: result.rows });
  } catch (error) {
    console.error("Error fetching segments:", error);
    res.status(500).json({ error: "Failed to fetch segments" });
  }
});

// POST /api/admin/newsletter/segments - Create segment
router.post("/segments", async (req, res) => {
  try {
    const { name, description, rules } = req.body;

    if (!name || !rules || !Array.isArray(rules)) {
      return res.status(400).json({ error: "name and rules array are required" });
    }

    const result = await pool.query(
      `INSERT INTO newsletter_segments (name, description, rules)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, JSON.stringify(rules)]
    );

    await logAdminAction(req, "CREATE", "newsletter_segments", result.rows[0].id, { name });

    res.json({ segment: result.rows[0] });
  } catch (error) {
    console.error("Error creating segment:", error);
    res.status(500).json({ error: "Failed to create segment" });
  }
});

// GET /api/admin/newsletter/segments/:id - Get segment
router.get("/segments/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM newsletter_segments WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Segment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching segment:", error);
    res.status(500).json({ error: "Failed to fetch segment" });
  }
});

// PUT /api/admin/newsletter/segments/:id - Update segment
router.put("/segments/:id", async (req, res) => {
  try {
    const { name, description, rules } = req.body;

    const result = await pool.query(
      `UPDATE newsletter_segments
       SET name = $1, description = $2, rules = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, description, JSON.stringify(rules), req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Segment not found" });
    }

    await logAdminAction(req, "UPDATE", "newsletter_segments", req.params.id);

    res.json({ segment: result.rows[0] });
  } catch (error) {
    console.error("Error updating segment:", error);
    res.status(500).json({ error: "Failed to update segment" });
  }
});

// DELETE /api/admin/newsletter/segments/:id - Delete segment
router.delete("/segments/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM newsletter_segments WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Segment not found" });
    }

    await logAdminAction(req, "DELETE", "newsletter_segments", req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting segment:", error);
    res.status(500).json({ error: "Failed to delete segment" });
  }
});

// GET /api/admin/newsletter/audience - List audience
router.get("/audience", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.email, u.username, u.jurisdiction,
        CASE WHEN u.telegram_id IS NOT NULL THEN true ELSE false END as telegram_linked,
        CASE WHEN u.cwallet_id IS NOT NULL THEN true ELSE false END as cwallet_linked,
        (SELECT COUNT(*) FROM user_site_links WHERE user_id = u.id) as linked_sites_count,
        n.last_opened, n.unsubscribed
      FROM users u
      LEFT JOIN newsletter_subscribers n ON n.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (u.email ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ audience: result.rows });
  } catch (error) {
    console.error("Error fetching audience:", error);
    res.status(500).json({ error: "Failed to fetch audience" });
  }
});

// GET /api/admin/newsletter/templates - List templates
router.get("/templates", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, type, subject, body, last_used, created_at FROM newsletter_templates ORDER BY created_at DESC"
    );

    res.json({ templates: result.rows });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// POST /api/admin/newsletter/templates - Create template
router.post("/templates", async (req, res) => {
  try {
    const { name, type, subject, body } = req.body;

    if (!name || !type || !subject || !body) {
      return res.status(400).json({ error: "name, type, subject, and body are required" });
    }

    const result = await pool.query(
      `INSERT INTO newsletter_templates (name, type, subject, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, type, subject, body]
    );

    await logAdminAction(req, "CREATE", "newsletter_templates", result.rows[0].id, { name, type });

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// GET /api/admin/newsletter/templates/:id - Get template
router.get("/templates/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM newsletter_templates WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// PUT /api/admin/newsletter/templates/:id - Update template
router.put("/templates/:id", async (req, res) => {
  try {
    const { name, type, subject, body } = req.body;

    const result = await pool.query(
      `UPDATE newsletter_templates
       SET name = $1, type = $2, subject = $3, body = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, type, subject, body, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    await logAdminAction(req, "UPDATE", "newsletter_templates", req.params.id);

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

// DELETE /api/admin/newsletter/templates/:id - Delete template
router.delete("/templates/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM newsletter_templates WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    await logAdminAction(req, "DELETE", "newsletter_templates", req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

// GET /api/admin/newsletter/stats - Get stats
router.get("/stats", async (req, res) => {
  try {
    // Global stats
    const totalSubscribers = await pool.query(
      "SELECT COUNT(*) FROM newsletter_subscribers WHERE unsubscribed = false"
    );
    const newSignups7d = await pool.query(
      "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const unsubscribes7d = await pool.query(
      "SELECT COUNT(*) FROM newsletter_subscribers WHERE unsubscribed = true AND updated_at >= NOW() - INTERVAL '7 days'"
    );

    // Campaign stats
    const campaignStats = await pool.query(
      `SELECT name, open_rate, click_rate 
       FROM newsletter_campaigns 
       WHERE status = 'sent'
       ORDER BY created_at DESC
       LIMIT 10`
    );

    res.json({
      total_subscribers: parseInt(totalSubscribers.rows[0].count),
      new_signups_7d: parseInt(newSignups7d.rows[0].count),
      unsubscribes_7d: parseInt(unsubscribes7d.rows[0].count),
      campaign_stats: campaignStats.rows
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
