import express from "express";
import pool from "../utils/db.js";
import { classifyRawDrop, processPendingRawDrops } from "../services/dropsAI.js";
import { notifyNewDrop } from "../services/dropsNotifications.js";
import { getUserFromRequest } from "../middleware/userAuth.js";
import { logger } from "../bot/utils/logger.js";

const router = express.Router();

/**
 * POST /api/drops/intake
 * Universal intake endpoint for all sources (Discord, Telegram, site form)
 */
router.post("/intake", async (req, res) => {
  try {
    const { source, source_channel_id, source_user_id, source_username, raw_text, metadata = {} } = req.body;

    // Validation
    if (!source || !['discord', 'telegram_group', 'telegram_dm', 'site_form'].includes(source)) {
      return res.status(400).json({ error: "Invalid source. Must be: discord, telegram_group, telegram_dm, or site_form" });
    }

    if (!source_user_id || !raw_text) {
      return res.status(400).json({ error: "Missing required fields: source_user_id, raw_text" });
    }

    // Extract URLs and codes from raw text
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const rawUrls = (raw_text.match(urlRegex) || []).map(url => url.trim().replace(/[.,;!?]+$/, ''));

    const codePatterns = [
      /\b[A-Z]{3,15}\d{2,10}\b/g,
      /\b[A-Z]{4,20}\b/g,
    ];
    const bonusCodeCandidates = new Set();
    codePatterns.forEach(pattern => {
      const matches = raw_text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.length >= 4 && match.length <= 20) {
            bonusCodeCandidates.add(match.toUpperCase());
          }
        });
      }
    });

    // Create raw drop
    const result = await pool.query(
      `INSERT INTO raw_drops (
        source, source_channel_id, source_user_id, source_username,
        raw_text, raw_urls, bonus_code_candidates, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        source,
        source_channel_id || null,
        source_user_id,
        source_username || null,
        raw_text,
        rawUrls,
        Array.from(bonusCodeCandidates),
        JSON.stringify(metadata)
      ]
    );

    const rawDrop = result.rows[0];

    // Trigger AI classification asynchronously
    classifyRawDrop(rawDrop.id).catch(err => {
      logger.error(`Error classifying raw drop ${rawDrop.id}:`, err);
    });

    res.status(201).json({
      success: true,
      raw_drop: rawDrop,
      message: "Raw drop created and queued for AI classification"
    });

  } catch (error) {
    logger.error("Error creating raw drop:", error);
    res.status(500).json({ error: "Failed to create raw drop" });
  }
});

/**
 * GET /api/drops/promo-candidates
 * Get promo candidates for admin review (inbox)
 */
router.get("/promo-candidates", async (req, res) => {
  try {
    const { status = 'pending', limit = 50, offset = 0, casino_id, jurisdiction } = req.query;

    let query = `
      SELECT 
        pc.*,
        rd.source, rd.source_username, rd.raw_text, rd.created_at as submitted_at,
        acs.confidence_score, acs.guessed_casino, acs.guessed_jurisdiction,
        am.name as mapped_casino_name, am.icon_url as mapped_casino_logo, am.affiliate_url as mapped_casino_affiliate_url
      FROM promo_candidates pc
      JOIN raw_drops rd ON pc.raw_drop_id = rd.id
      JOIN ai_classification_snapshots acs ON pc.ai_snapshot_id = acs.id
      LEFT JOIN affiliates_master am ON pc.mapped_casino_id = am.id
      WHERE pc.status = $1
    `;

    const params = [status];
    let paramIndex = 2;

    if (casino_id) {
      query += ` AND pc.mapped_casino_id = $${paramIndex++}`;
      params.push(casino_id);
    }

    if (jurisdiction) {
      query += ` AND $${paramIndex++} = ANY(pc.jurisdiction_tags)`;
      params.push(jurisdiction);
    }

    query += ` ORDER BY rd.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM promo_candidates WHERE status = $1`,
      [status]
    );

    res.json({
      candidates: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error("Error fetching promo candidates:", error);
    res.status(500).json({ error: "Failed to fetch promo candidates" });
  }
});

/**
 * POST /api/drops/promo-candidates/:id/approve
 * Admin approves a promo candidate (creates DropPromo)
 */
router.post("/promo-candidates/:id/approve", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { 
      headline, description, bonus_code, promo_url, mapped_casino_id, 
      jurisdiction_tags, quick_signup_url 
    } = req.body;

    // Get promo candidate
    const candidateResult = await pool.query(
      `SELECT pc.*, rd.id as raw_drop_id 
       FROM promo_candidates pc
       JOIN raw_drops rd ON pc.raw_drop_id = rd.id
       WHERE pc.id = $1`,
      [id]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: "Promo candidate not found" });
    }

    const candidate = candidateResult.rows[0];

    // Get affiliate URL if casino is mapped
    let finalQuickSignupUrl = quick_signup_url;
    if (mapped_casino_id && !finalQuickSignupUrl) {
      const affiliateResult = await pool.query(
        'SELECT affiliate_url FROM affiliates_master WHERE id = $1',
        [mapped_casino_id]
      );
      if (affiliateResult.rows.length > 0) {
        finalQuickSignupUrl = affiliateResult.rows[0].affiliate_url;
      }
    }

    // Create drop promo
    const promoResult = await pool.query(
      `INSERT INTO drop_promos (
        headline, description, promo_type, bonus_code, promo_url,
        resolved_domain, mapped_casino_id, jurisdiction_tags,
        quick_signup_url, source_raw_drop_id, source_promo_candidate_id,
        validity_flags, audit_trail
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        headline || candidate.headline,
        description || candidate.description,
        candidate.promo_type,
        bonus_code || candidate.bonus_code,
        promo_url || candidate.promo_url,
        candidate.resolved_domain,
        mapped_casino_id || candidate.mapped_casino_id,
        jurisdiction_tags || candidate.jurisdiction_tags || [],
        finalQuickSignupUrl,
        candidate.raw_drop_id,
        candidate.id,
        JSON.stringify({
          verified: true,
          community_submitted: candidate.raw_drop_id ? true : false,
          admin_approved: true
        }),
        JSON.stringify([{
          action: 'approved',
          admin: user.user_id || user.username || 'admin',
          timestamp: new Date().toISOString()
        }])
      ]
    );

    const dropPromo = promoResult.rows[0];

    // Update candidate status
    await pool.query(
      'UPDATE promo_candidates SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['approved', id]
    );

    // Log admin action
    await pool.query(
      `INSERT INTO drop_admin_actions (
        admin_user, action_type, resource_type, resource_id, changes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        user.user_id || user.username || 'admin',
        'approve',
        'promo_candidate',
        id,
        JSON.stringify({ drop_promo_id: dropPromo.id })
      ]
    );

    // Log learning data
    await pool.query(
      `INSERT INTO drop_ai_learning (
        raw_drop_id, promo_candidate_id, admin_decision, admin_casino_override, admin_jurisdiction_override
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        candidate.raw_drop_id,
        id,
        'approved',
        mapped_casino_id || candidate.mapped_casino_id,
        jurisdiction_tags || candidate.jurisdiction_tags
      ]
    );

    // Send notifications for new drop (async, don't wait)
    notifyNewDrop(dropPromo.id).catch(err => {
      logger.error(`Error sending notifications for drop ${dropPromo.id}:`, err);
    });

    // Emit real-time event for new drop
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('drop:new', {
          id: dropPromo.id,
          headline: dropPromo.headline,
          featured: dropPromo.featured,
          jurisdiction_tags: dropPromo.jurisdiction_tags
        });
      }
    } catch (err) {
      logger.warn('Could not emit real-time event:', err);
    }

    res.json({
      success: true,
      drop_promo: dropPromo,
      message: "Promo approved and published"
    });

  } catch (error) {
    logger.error("Error approving promo candidate:", error);
    res.status(500).json({ error: "Failed to approve promo candidate" });
  }
});

/**
 * POST /api/drops/promo-candidates/:id/deny
 * Admin denies a promo candidate
 */
router.post("/promo-candidates/:id/deny", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { reason } = req.body;

    await pool.query(
      'UPDATE promo_candidates SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['denied', id]
    );

    // Log admin action
    await pool.query(
      `INSERT INTO drop_admin_actions (
        admin_user, action_type, resource_type, resource_id, reason
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        user.user_id || user.username || 'admin',
        'deny',
        'promo_candidate',
        id,
        reason || 'No reason provided'
      ]
    );

    // Log learning data
    const candidateResult = await pool.query(
      'SELECT raw_drop_id FROM promo_candidates WHERE id = $1',
      [id]
    );
    if (candidateResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO drop_ai_learning (
          raw_drop_id, promo_candidate_id, admin_decision
        ) VALUES ($1, $2, $3)`,
        [
          candidateResult.rows[0].raw_drop_id,
          id,
          'denied'
        ]
      );
    }

    res.json({ success: true, message: "Promo candidate denied" });

  } catch (error) {
    logger.error("Error denying promo candidate:", error);
    res.status(500).json({ error: "Failed to deny promo candidate" });
  }
});

/**
 * POST /api/drops/promo-candidates/:id/mark-non-promo
 * Admin marks a candidate as non-promo
 */
router.post("/promo-candidates/:id/mark-non-promo", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;

    await pool.query(
      'UPDATE promo_candidates SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['non_promo', id]
    );

    // Log learning data
    const candidateResult = await pool.query(
      'SELECT raw_drop_id FROM promo_candidates WHERE id = $1',
      [id]
    );
    if (candidateResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO drop_ai_learning (
          raw_drop_id, promo_candidate_id, admin_decision
        ) VALUES ($1, $2, $3)`,
        [
          candidateResult.rows[0].raw_drop_id,
          id,
          'marked_non_promo'
        ]
      );
    }

    res.json({ success: true, message: "Marked as non-promo" });

  } catch (error) {
    logger.error("Error marking non-promo:", error);
    res.status(500).json({ error: "Failed to mark as non-promo" });
  }
});

/**
 * GET /api/drops/public
 * Get public drop promos for the frontend board
 */
router.get("/public", async (req, res) => {
  try {
    const { limit = 50, offset = 0, jurisdiction, casino_id, featured } = req.query;

    let query = `
      SELECT 
        dp.*,
        am.name as casino_name, am.icon_url as casino_logo, am.slug as casino_slug
      FROM drop_promos dp
      LEFT JOIN affiliates_master am ON dp.mapped_casino_id = am.id
      WHERE dp.status = 'active'
    `;

    const params = [];
    let paramIndex = 1;

    if (jurisdiction) {
      query += ` AND $${paramIndex++} = ANY(dp.jurisdiction_tags)`;
      params.push(jurisdiction);
    }

    if (casino_id) {
      query += ` AND dp.mapped_casino_id = $${paramIndex++}`;
      params.push(casino_id);
    }

    if (featured === 'true') {
      query += ` AND dp.featured = true`;
    }

    query += ` ORDER BY dp.featured DESC, dp.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM drop_promos WHERE status = 'active'`
    );

    res.json({
      promos: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error("Error fetching public drops:", error);
    res.status(500).json({ error: "Failed to fetch public drops" });
  }
});

/**
 * POST /api/drops/public/:id/report
 * User reports an invalid promo
 */
router.post("/public/:id/report", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const { id } = req.params;
    const { report_type, report_text } = req.body;

    if (!report_type || !['invalid_promo', 'spam', 'duplicate', 'expired', 'other'].includes(report_type)) {
      return res.status(400).json({ error: "Invalid report_type" });
    }

    await pool.query(
      `INSERT INTO drop_user_reports (
        drop_promo_id, user_id, report_type, report_text
      ) VALUES ($1, $2, $3, $4)`,
      [
        id,
        user?.user_id || 'anonymous',
        report_type,
        report_text || null
      ]
    );

    res.json({ success: true, message: "Report submitted" });

  } catch (error) {
    logger.error("Error submitting report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

/**
 * POST /api/drops/process-pending
 * Manually trigger processing of pending raw drops (admin only)
 */
router.post("/process-pending", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { limit = 10 } = req.query;
    const processed = await processPendingRawDrops(parseInt(limit));

    res.json({
      success: true,
      processed: processed.length,
      results: processed
    });

  } catch (error) {
    logger.error("Error processing pending drops:", error);
    res.status(500).json({ error: "Failed to process pending drops" });
  }
});

/**
 * GET /api/drops/public/:id
 * Get a single drop promo by ID (increments view count)
 */
router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Increment view count
    await pool.query(
      'UPDATE drop_promos SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    const result = await pool.query(
      `SELECT 
        dp.*,
        am.name as casino_name, am.icon_url as casino_logo, am.slug as casino_slug
      FROM drop_promos dp
      LEFT JOIN affiliates_master am ON dp.mapped_casino_id = am.id
      WHERE dp.id = $1 AND dp.status = 'active'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drop promo not found" });
    }

    res.json({ promo: result.rows[0] });

  } catch (error) {
    logger.error("Error fetching drop promo:", error);
    res.status(500).json({ error: "Failed to fetch drop promo" });
  }
});

/**
 * POST /api/drops/public/:id/click
 * Track a click on a promo link
 */
router.post("/public/:id/click", async (req, res) => {
  try {
    const { id } = req.params;
    const { link_type } = req.body; // 'promo_url' or 'quick_signup_url'
    
    // Increment click count
    await pool.query(
      'UPDATE drop_promos SET click_count = click_count + 1 WHERE id = $1',
      [id]
    );

    // Log click event (optional - for detailed analytics)
    const user = await getUserFromRequest(req);
    if (user) {
      await pool.query(
        `INSERT INTO drop_click_events (drop_promo_id, user_id, link_type, clicked_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING`,
        [id, user.user_id, link_type || 'promo_url']
      ).catch(() => {
        // Table might not exist yet, that's okay
      });
    }

    res.json({ success: true });

  } catch (error) {
    logger.error("Error tracking click:", error);
    res.status(500).json({ error: "Failed to track click" });
  }
});

/**
 * GET /api/drops/admin/promos
 * Get all drop promos for admin management
 */
router.get("/admin/promos", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { status, limit = 50, offset = 0, casino_id, jurisdiction, featured } = req.query;

    let query = `
      SELECT 
        dp.*,
        am.name as casino_name, am.icon_url as casino_logo, am.slug as casino_slug,
        (SELECT COUNT(*) FROM drop_user_reports WHERE drop_promo_id = dp.id) as report_count
      FROM drop_promos dp
      LEFT JOIN affiliates_master am ON dp.mapped_casino_id = am.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND dp.status = $${paramIndex++}`;
      params.push(status);
    }

    if (casino_id) {
      query += ` AND dp.mapped_casino_id = $${paramIndex++}`;
      params.push(casino_id);
    }

    if (jurisdiction) {
      query += ` AND $${paramIndex++} = ANY(dp.jurisdiction_tags)`;
      params.push(jurisdiction);
    }

    if (featured === 'true') {
      query += ` AND dp.featured = true`;
    } else if (featured === 'false') {
      query += ` AND dp.featured = false`;
    }

    query += ` ORDER BY dp.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM drop_promos WHERE 1=1${status ? ` AND status = '${status}'` : ''}`
    );

    res.json({
      promos: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error("Error fetching admin promos:", error);
    res.status(500).json({ error: "Failed to fetch promos" });
  }
});

/**
 * GET /api/drops/admin/promos/:id
 * Get a single drop promo for admin editing
 */
router.get("/admin/promos/:id", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        dp.*,
        am.name as casino_name, am.icon_url as casino_logo, am.slug as casino_slug,
        (SELECT COUNT(*) FROM drop_user_reports WHERE drop_promo_id = dp.id) as report_count
      FROM drop_promos dp
      LEFT JOIN affiliates_master am ON dp.mapped_casino_id = am.id
      WHERE dp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drop promo not found" });
    }

    res.json({ promo: result.rows[0] });

  } catch (error) {
    logger.error("Error fetching admin promo:", error);
    res.status(500).json({ error: "Failed to fetch promo" });
  }
});

/**
 * PUT /api/drops/admin/promos/:id
 * Update a drop promo (admin only)
 */
router.put("/admin/promos/:id", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const {
      headline, description, bonus_code, promo_url, mapped_casino_id,
      jurisdiction_tags, quick_signup_url, featured, status, expires_at
    } = req.body;

    // Get current promo
    const currentResult = await pool.query(
      'SELECT * FROM drop_promos WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Drop promo not found" });
    }

    const current = currentResult.rows[0];

    // Build update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (headline !== undefined) {
      updates.push(`headline = $${paramIndex++}`);
      params.push(headline);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (bonus_code !== undefined) {
      updates.push(`bonus_code = $${paramIndex++}`);
      params.push(bonus_code);
    }
    if (promo_url !== undefined) {
      updates.push(`promo_url = $${paramIndex++}`);
      params.push(promo_url);
    }
    if (mapped_casino_id !== undefined) {
      updates.push(`mapped_casino_id = $${paramIndex++}`);
      params.push(mapped_casino_id);
    }
    if (jurisdiction_tags !== undefined) {
      updates.push(`jurisdiction_tags = $${paramIndex++}`);
      params.push(jurisdiction_tags);
    }
    if (quick_signup_url !== undefined) {
      updates.push(`quick_signup_url = $${paramIndex++}`);
      params.push(quick_signup_url);
    }
    if (featured !== undefined) {
      updates.push(`featured = $${paramIndex++}`);
      params.push(featured);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (expires_at !== undefined) {
      updates.push(`expires_at = $${paramIndex++}`);
      params.push(expires_at);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Update audit trail
    const auditTrail = current.audit_trail || [];
    auditTrail.push({
      action: 'updated',
      admin: user.user_id || user.username || 'admin',
      timestamp: new Date().toISOString(),
      changes: Object.keys(req.body)
    });

    updates.push(`audit_trail = $${paramIndex++}`);
    params.push(JSON.stringify(auditTrail));

    params.push(id);
    const updateQuery = `UPDATE drop_promos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(updateQuery, params);

    // Log admin action
    await pool.query(
      `INSERT INTO drop_admin_actions (
        admin_user, action_type, resource_type, resource_id, changes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        user.user_id || user.username || 'admin',
        'update',
        'drop_promo',
        id,
        JSON.stringify(req.body)
      ]
    );

    res.json({
      success: true,
      promo: result.rows[0],
      message: "Drop promo updated"
    });

  } catch (error) {
    logger.error("Error updating drop promo:", error);
    res.status(500).json({ error: "Failed to update drop promo" });
  }
});

/**
 * POST /api/drops/admin/promos/:id/feature
 * Feature/unfeature a drop promo
 */
router.post("/admin/promos/:id/feature", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { featured = true } = req.body;

    const result = await pool.query(
      'UPDATE drop_promos SET featured = $1 WHERE id = $2 RETURNING *',
      [featured, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drop promo not found" });
    }

    // Log admin action
    await pool.query(
      `INSERT INTO drop_admin_actions (
        admin_user, action_type, resource_type, resource_id, changes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        user.user_id || user.username || 'admin',
        featured ? 'feature' : 'unfeature',
        'drop_promo',
        id,
        JSON.stringify({ featured })
      ]
    );

    // If featuring, send notifications
    if (featured) {
      notifyNewDrop(id).catch(err => {
        logger.error(`Error sending notifications for featured drop ${id}:`, err);
      });
    }

    res.json({
      success: true,
      promo: result.rows[0],
      message: featured ? "Drop promo featured" : "Drop promo unfeatured"
    });

  } catch (error) {
    logger.error("Error featuring drop promo:", error);
    res.status(500).json({ error: "Failed to feature drop promo" });
  }
});

/**
 * DELETE /api/drops/admin/promos/:id
 * Delete/archive a drop promo
 */
router.delete("/admin/promos/:id", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;

    // Soft delete by setting status to archived
    const result = await pool.query(
      'UPDATE drop_promos SET status = $1 WHERE id = $2 RETURNING *',
      ['archived', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drop promo not found" });
    }

    // Log admin action
    await pool.query(
      `INSERT INTO drop_admin_actions (
        admin_user, action_type, resource_type, resource_id
      ) VALUES ($1, $2, $3, $4)`,
      [
        user.user_id || user.username || 'admin',
        'delete',
        'drop_promo',
        id
      ]
    );

    res.json({
      success: true,
      message: "Drop promo archived"
    });

  } catch (error) {
    logger.error("Error deleting drop promo:", error);
    res.status(500).json({ error: "Failed to delete drop promo" });
  }
});

/**
 * GET /api/drops/admin/analytics
 * Get analytics for drops
 */
router.get("/admin/analytics", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { days = 30 } = req.query;

    // Overall stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
        COUNT(*) FILTER (WHERE featured = true) as featured_count,
        SUM(view_count) as total_views,
        SUM(click_count) as total_clicks,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '${days} days') as recent_count
      FROM drop_promos
    `);

    // Top performing promos
    const topPromosResult = await pool.query(`
      SELECT 
        dp.id, dp.headline, dp.view_count, dp.click_count,
        am.name as casino_name
      FROM drop_promos dp
      LEFT JOIN affiliates_master am ON dp.mapped_casino_id = am.id
      WHERE dp.status = 'active'
      ORDER BY dp.click_count DESC, dp.view_count DESC
      LIMIT 10
    `);

    // Jurisdiction breakdown
    const jurisdictionResult = await pool.query(`
      SELECT 
        unnest(jurisdiction_tags) as jurisdiction,
        COUNT(*) as count
      FROM drop_promos
      WHERE status = 'active'
      GROUP BY unnest(jurisdiction_tags)
    `);

    // Daily stats (last 30 days)
    const dailyStatsResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as created,
        SUM(view_count) as views,
        SUM(click_count) as clicks
      FROM drop_promos
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      stats: statsResult.rows[0],
      top_promos: topPromosResult.rows,
      jurisdiction_breakdown: jurisdictionResult.rows,
      daily_stats: dailyStatsResult.rows
    });

  } catch (error) {
    logger.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/**
 * GET /api/drops/admin/raw-drops
 * Get raw drops for admin review
 */
router.get("/admin/raw-drops", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { status, limit = 50, offset = 0, source } = req.query;

    let query = `
      SELECT 
        rd.*,
        (SELECT COUNT(*) FROM promo_candidates WHERE raw_drop_id = rd.id) as candidate_count
      FROM raw_drops rd
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND rd.status = $${paramIndex++}`;
      params.push(status);
    }

    if (source) {
      query += ` AND rd.source = $${paramIndex++}`;
      params.push(source);
    }

    query += ` ORDER BY rd.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM raw_drops WHERE 1=1${status ? ` AND status = '${status}'` : ''}${source ? ` AND source = '${source}'` : ''}`
    );

    res.json({
      raw_drops: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error("Error fetching raw drops:", error);
    res.status(500).json({ error: "Failed to fetch raw drops" });
  }
});

export default router;
