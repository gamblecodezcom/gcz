import express from "express";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import {
  getUserFromRequest,
  requireUser,
  requireLevel,
  requireSuper
} from "../middleware/userAuth.js";

import {
  processPendingRawDrops,
  notifyNewDrop
} from "../utils/dropEngine.js";

const router = express.Router();

/**
 * ============================
 * ADMIN: APPROVE PROMO CANDIDATE
 * ============================
 */
router.post("/promo-candidates/:id/approve", requireLevel(4), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { mapped_casino_id, headline, body, jurisdiction_tags } = req.body;

    const result = await pool.query(
      `UPDATE promo_candidates
       SET status='approved', reviewed_at=CURRENT_TIMESTAMP
       WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Promo candidate not found" });

    const promo = result.rows[0];

    const insertPromo = await pool.query(
      `INSERT INTO drop_promos (
        raw_drop_id, mapped_casino_id, headline, body,
        jurisdiction_tags, status, featured
      ) VALUES ($1,$2,$3,$4,$5,'active',false)
      RETURNING *`,
      [
        promo.raw_drop_id,
        mapped_casino_id,
        headline,
        body,
        jurisdiction_tags || []
      ]
    );

    await pool.query(
      `INSERT INTO drop_admin_actions (
        admin_user, action_type, resource_type, resource_id
      ) VALUES ($1,$2,$3,$4)`,
      [user.user_id, "approve", "promo_candidate", id]
    );

    res.json({ success: true, promo: insertPromo.rows[0] });
  } catch (error) {
    logger.error("Error approving promo candidate:", error);
    res.status(500).json({ error: "Failed to approve promo candidate" });
  }
});

/**
 * ============================
 * ADMIN: DENY PROMO CANDIDATE
 * ============================
 */
router.post("/promo-candidates/:id/deny", requireLevel(4), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    await pool.query(
      `UPDATE promo_candidates
       SET status='denied', reviewed_at=CURRENT_TIMESTAMP
       WHERE id=$1`,
      [id]
    );

    await pool.query(
      `INSERT INTO drop_admin_actions (
        admin_user, action_type, resource_type, resource_id, reason
      ) VALUES ($1,$2,$3,$4,$5)`,
      [user.user_id, "deny", "promo_candidate", id, reason || "No reason provided"]
    );

    const candidateResult = await pool.query(
      `SELECT raw_drop_id FROM promo_candidates WHERE id=$1`,
      [id]
    );

    if (candidateResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO drop_ai_learning (
          raw_drop_id, promo_candidate_id, admin_decision
        ) VALUES ($1,$2,$3)`,
        [candidateResult.rows[0].raw_drop_id, id, "denied"]
      );
    }

    res.json({ success: true, message: "Promo candidate denied" });
  } catch (error) {
    logger.error("Error denying promo candidate:", error);
    res.status(500).json({ error: "Failed to deny promo candidate" });
  }
});

/**
 * ============================
 * ADMIN: MARK NON-PROMO
 * ============================
 */
router.post("/promo-candidates/:id/mark-non-promo", requireLevel(4), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    await pool.query(
      `UPDATE promo_candidates
       SET status='non_promo', reviewed_at=CURRENT_TIMESTAMP
       WHERE id=$1`,
      [id]
    );

    const candidateResult = await pool.query(
      `SELECT raw_drop_id FROM promo_candidates WHERE id=$1`,
      [id]
    );

    if (candidateResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO drop_ai_learning (
          raw_drop_id, promo_candidate_id, admin_decision
        ) VALUES ($1,$2,$3)`,
        [candidateResult.rows[0].raw_drop_id, id, "marked_non_promo"]
      );
    }

    res.json({ success: true, message: "Marked as non-promo" });
  } catch (error) {
    logger.error("Error marking non-promo:", error);
    res.status(500).json({ error: "Failed to mark as non-promo" });
  }
});

/**
 * ============================
 * PUBLIC: GET ACTIVE PROMOS
 * ============================
 */
router.get("/public", async (req, res) => {
  try {
    const { limit = 50, offset = 0, jurisdiction, casino_id, featured } = req.query;

    let query = `
      SELECT dp.*, am.name AS casino_name, am.icon_url AS casino_logo, am.slug AS casino_slug
      FROM drop_promos dp
      LEFT JOIN affiliates_master am ON dp.mapped_casino_id = am.id
      WHERE dp.status='active'
    `;

    const params = [];
    let i = 1;

    if (jurisdiction) {
      query += ` AND $${i++} = ANY(dp.jurisdiction_tags)`;
      params.push(jurisdiction);
    }

    if (casino_id) {
      query += ` AND dp.mapped_casino_id=$${i++}`;
      params.push(casino_id);
    }

    if (featured === "true") query += ` AND dp.featured=true`;

    query += ` ORDER BY dp.featured DESC, dp.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    const count = await pool.query(`SELECT COUNT(*) FROM drop_promos WHERE status='active'`);

    res.json({
      promos: result.rows,
      total: parseInt(count.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error("Error fetching public drops:", error);
    res.status(500).json({ error: "Failed to fetch public drops" });
  }
});

/**
 * ============================
 * PUBLIC: REPORT PROMO
 * ============================
 */
router.post("/public/:id/report", requireUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { report_type, report_text } = req.body;

    if (!["invalid_promo", "spam", "duplicate", "expired", "other"].includes(report_type))
      return res.status(400).json({ error: "Invalid report_type" });

    await pool.query(
      `INSERT INTO drop_user_reports (
        drop_promo_id, user_id, report_type, report_text
      ) VALUES ($1,$2,$3,$4)`,
      [id, user.user_id, report_type, report_text || null]
    );

    res.json({ success: true, message: "Report submitted" });
  } catch (error) {
    logger.error("Error submitting report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

/**
 * ============================
 * ADMIN: PROCESS PENDING RAW DROPS
 * ============================
 */
router.post("/process-pending", requireLevel(4), async (req, res) => {
  try {
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
 * ============================
 * PUBLIC: GET SINGLE PROMO
 * ============================
 */
router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT dp.*, am.name AS casino_name, am.icon_url AS casino_logo, am.slug AS casino_slug
       FROM drop_promos dp
       LEFT JOIN affiliates_master am ON dp.mapped_casino_id = am.id
       WHERE dp.id=$1 AND dp.status='active'`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Promo not found" });

    await pool.query(`UPDATE drop_promos SET view_count=view_count+1 WHERE id=$1`, [id]);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Error fetching promo:", error);
    res.status(500).json({ error: "Failed to fetch promo" });
  }
});

export default router;
