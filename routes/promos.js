import express from "express";
import pkg from "pg";
import fetch from "node-fetch";

const { Pool } = pkg;
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * POST /api/promos/intake
 * Legacy endpoint, forwards to unified drops system.
 * DEPRECATED for new clients, but kept live for compatibility.
 */
router.post("/intake", async (req, res) => {
  try {
    const { source = "discord", channel, content, submitted_by } = req.body;

    if (!channel || !content || !submitted_by) {
      return res.status(400).json({
        error: "Missing required fields: channel, content, submitted_by",
      });
    }

    if (!["links", "codes"].includes(channel)) {
      return res.status(400).json({
        error: "Channel must be 'links' or 'codes'",
      });
    }

    if (channel === "links") {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(content.trim())) {
        return res.status(400).json({
          error: "Links channel requires a valid URL",
        });
      }
    }

    const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000";

    try {
      const response = await fetch(`${apiBaseUrl}/api/drops/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: source === "discord" ? "discord" : "site_form",
          source_channel_id: channel,
          source_user_id: submitted_by,
          source_username: null,
          raw_text: content,
          metadata: {
            legacy_channel: channel,
            legacy_source: source,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(201).json({
          success: true,
          message: "Promo submitted to unified drops system",
          raw_drop: data.raw_drop,
          deprecated: true,
          migration_note:
            "This endpoint is deprecated. Use /api/drops/intake instead.",
        });
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        return res.status(response.status).json(errorData);
      }
    } catch (forwardError) {
      console.error("Error forwarding to drops system:", forwardError);
      return res.status(500).json({
        error: "Failed to forward to drops system",
        details:
          forwardError instanceof Error ? forwardError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error processing legacy promo intake:", error);
    res.status(500).json({ error: "Failed to process promo intake" });
  }
});

/**
 * GET /api/promos/review
 * Get pending promos for admin review.
 */
router.get("/review", async (req, res) => {
  try {
    const { status = "pending", limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT p.*,
              a.name AS affiliate_name,
              a.affiliate_url AS affiliate_url
       FROM promos p
       LEFT JOIN affiliates_master a ON p.affiliate_id = a.id
       WHERE p.status = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM promos WHERE status = $1",
      [status]
    );

    res.json({
      promos: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching promo review queue:", error);
    res.status(500).json({ error: "Failed to fetch promo review queue" });
  }
});

/**
 * POST /api/promos/review/:id
 * Admin reviews a promo (approve/deny).
 */
router.post("/review/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, affiliate_id, deny_reason, clean_text, reviewed_by } =
      req.body;

    if (!["approve", "deny"].includes(action)) {
      return res.status(400).json({
        error: "Action must be 'approve' or 'deny'",
      });
    }

    if (action === "approve" && !affiliate_id) {
      return res.status(400).json({
        error: "affiliate_id required for approval",
      });
    }

    if (action === "deny" && !deny_reason) {
      return res.status(400).json({
        error: "deny_reason required for denial",
      });
    }

    const promoResult = await pool.query(
      "SELECT * FROM promos WHERE id = $1",
      [id]
    );

    if (promoResult.rows.length === 0) {
      return res.status(404).json({ error: "Promo not found" });
    }

    const status = action === "approve" ? "approved" : "denied";

    const updateFields = [
      "status = $1",
      "reviewed_by = $2",
      "reviewed_at = CURRENT_TIMESTAMP",
    ];
    const updateValues = [status, reviewed_by || "admin"];
    let paramIndex = 3;

    if (action === "approve") {
      updateFields.push(`affiliate_id = $${paramIndex++}`);
      updateValues.push(affiliate_id);

      if (clean_text) {
        updateFields.push(`clean_text = $${paramIndex++}`);
        updateValues.push(clean_text);
      }
    } else {
      updateFields.push(`deny_reason = $${paramIndex++}`);
      updateValues.push(deny_reason);
    }

    updateValues.push(id);

    await pool.query(
      `UPDATE promos
       SET ${updateFields.join(", ")},
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}`,
      updateValues
    );

    await pool.query(
      `INSERT INTO promo_decisions
         (promo_id, decision, affiliate_id, deny_reason, reviewed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        status,
        action === "approve" ? affiliate_id : null,
        action === "deny" ? deny_reason : null,
        reviewed_by || "admin",
      ]
    );

    if (action === "approve") {
      const updatedPromo = await pool.query(
        `SELECT p.*,
                a.name AS affiliate_name,
                a.affiliate_url
         FROM promos p
         LEFT JOIN affiliates_master a ON p.affiliate_id = a.id
         WHERE p.id = $1`,
        [id]
      );

      console.log(
        `[PROMO] Approved promo #${id}, ready for Telegram distribution`
      );

      if (global.promoApprovedHandler) {
        global.promoApprovedHandler(updatedPromo.rows[0]);
      }
    }

    const finalPromo = await pool.query("SELECT * FROM promos WHERE id = $1", [
      id,
    ]);

    res.json({
      success: true,
      message: `Promo ${status}`,
      promo: finalPromo.rows[0],
    });
  } catch (error) {
    console.error("Error reviewing promo:", error);
    res.status(500).json({ error: "Failed to review promo" });
  }
});

/**
 * GET /api/promos/approved
 * Get approved promos for website feed.
 */
router.get("/approved", async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT p.*,
              a.name AS affiliate_name,
              a.affiliate_url AS affiliate_url
       FROM promos p
       LEFT JOIN affiliates_master a ON p.affiliate_id = a.id
       WHERE p.status = 'approved'
       ORDER BY p.reviewed_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    res.json({
      promos: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching approved promos:", error);
    res.status(500).json({ error: "Failed to fetch approved promos" });
  }
});

/**
 * GET /api/promos/:id
 * Get a single promo by id.
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*,
              a.name AS affiliate_name,
              a.affiliate_url AS affiliate_url
       FROM promos p
       LEFT JOIN affiliates_master a ON p.affiliate_id = a.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Promo not found" });
    }

    res.json({ promo: result.rows[0] });
  } catch (error) {
    console.error("Error fetching promo:", error);
    res.status(500).json({ error: "Failed to fetch promo" });
  }
});

export default router;
