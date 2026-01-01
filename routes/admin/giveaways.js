import express from "express";
import pool from "../../utils/db.js";
import auth from "../../middleware/auth.js";
import superAdminOnly from "../../middleware/superAdminOnly.js";

const router = express.Router();

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
 * GET /api/admin/giveaways
 * List all giveaways with pagination
 * 
 * @route GET /api/admin/giveaways
 * @param {Object} req.query
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 * @param {string} [req.query.status] - Filter by status
 * @param {string} [req.query.type] - Filter by type
 * @returns {Promise<{giveaways: Giveaway[], page: number, limit: number, total: number, totalPages: number}>} 200 - Success
 */
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status, type } = req.query;
    
    let query = "SELECT * FROM giveaways WHERE 1=1";
    let countQuery = "SELECT COUNT(*) FROM giveaways WHERE 1=1";
    const params = [];
    
    if (status) {
      query += ` AND status = $${params.length + 1}`;
      countQuery += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      countQuery += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const [giveawaysResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);
    
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      giveaways: giveawaysResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.type,
        prize_value: row.prize_value,
        prize_asset: row.prize_asset,
        num_winners: row.num_winners,
        status: row.status,
        entry_method: row.entry_method,
        auto_select_winners: row.auto_select_winners,
        allow_repeat_winners: row.allow_repeat_winners,
        start_date: row.start_date ? row.start_date.toISOString() : null,
        end_date: row.end_date ? row.end_date.toISOString() : null,
        winner_selection_method: row.winner_selection_method,
        telegram_chat_id: row.telegram_chat_id,
        telegram_message_id: row.telegram_message_id,
        created_by: row.created_by,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      })),
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching giveaways:", error);
    res.status(500).json({ error: "Failed to fetch giveaways" });
  }
});

/**
 * POST /api/admin/giveaways
 * Create a new giveaway (Super Admin only)
 * 
 * @route POST /api/admin/giveaways
 * @param {Object} req.body
 * @param {string} req.body.title
 * @param {string} [req.body.description]
 * @param {'cwallet'|'runewager'|'crypto'|'lootbox'|'raffle_entries'} req.body.type
 * @param {string} req.body.prize_value
 * @param {string} [req.body.prize_asset]
 * @param {number} req.body.num_winners
 * @param {'telegram'|'web'|'both'} [req.body.entry_method='both']
 * @param {boolean} [req.body.auto_select_winners=true]
 * @param {boolean} [req.body.allow_repeat_winners=false]
 * @param {string} [req.body.start_date]
 * @param {string} [req.body.end_date]
 * @param {'random'|'weighted'|'first_come'} [req.body.winner_selection_method='random']
 * @returns {Promise<{giveaway: Giveaway}>} 200 - Success
 */
router.post("/", superAdminOnly, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      prize_value,
      prize_asset,
      num_winners,
      entry_method = "both",
      auto_select_winners = true,
      allow_repeat_winners = false,
      start_date,
      end_date,
      winner_selection_method = "random"
    } = req.body;
    
    if (!title || !type || !prize_value || !num_winners) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await pool.query(
      `INSERT INTO giveaways (
        title, description, type, prize_value, prize_asset, num_winners,
        entry_method, auto_select_winners, allow_repeat_winners,
        start_date, end_date, winner_selection_method, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft')
      RETURNING *`,
      [
        title,
        description,
        type,
        prize_value,
        prize_asset || null,
        num_winners,
        entry_method,
        auto_select_winners,
        allow_repeat_winners,
        start_date || null,
        end_date || null,
        winner_selection_method,
        req.headers["x-admin-user"] || "unknown"
      ]
    );
    
    await logAdminAction(req, "CREATE", "giveaway", result.rows[0].id.toString(), req.body);
    
    res.json({ giveaway: result.rows[0] });
  } catch (error) {
    console.error("Error creating giveaway:", error);
    res.status(500).json({ error: "Failed to create giveaway" });
  }
});

/**
 * PUT /api/admin/giveaways/:id
 * Update a giveaway (Super Admin only)
 */
router.put("/:id", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    const allowedFields = [
      "title", "description", "type", "prize_value", "prize_asset", "num_winners",
      "entry_method", "auto_select_winners", "allow_repeat_winners",
      "start_date", "end_date", "winner_selection_method", "status"
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(req.body[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);
    
    const result = await pool.query(
      `UPDATE giveaways SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Giveaway not found" });
    }
    
    await logAdminAction(req, "UPDATE", "giveaway", id, req.body);
    res.json({ giveaway: result.rows[0] });
  } catch (error) {
    console.error("Error updating giveaway:", error);
    res.status(500).json({ error: "Failed to update giveaway" });
  }
});

/**
 * POST /api/admin/giveaways/:id/activate
 * Activate a giveaway (Super Admin only)
 */
router.post("/:id/activate", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE giveaways SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Giveaway not found" });
    }
    
    await logAdminAction(req, "ACTIVATE", "giveaway", id);
    res.json({ giveaway: result.rows[0] });
  } catch (error) {
    console.error("Error activating giveaway:", error);
    res.status(500).json({ error: "Failed to activate giveaway" });
  }
});

/**
 * POST /api/admin/giveaways/:id/select-winners
 * Manually select winners for a giveaway (Super Admin only)
 */
router.post("/:id/select-winners", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_ids } = req.body; // Optional: specific user IDs to select
    
    // Get giveaway
    const giveawayResult = await pool.query(
      "SELECT * FROM giveaways WHERE id = $1",
      [id]
    );
    
    if (giveawayResult.rows.length === 0) {
      return res.status(404).json({ error: "Giveaway not found" });
    }
    
    const giveaway = giveawayResult.rows[0];
    
    // Get entries
    let entriesResult;
    if (user_ids && Array.isArray(user_ids)) {
      entriesResult = await pool.query(
        `SELECT * FROM giveaway_entries 
         WHERE giveaway_id = $1 AND user_id = ANY($2::text[])
         ORDER BY RANDOM()`,
        [id, user_ids]
      );
    } else {
      entriesResult = await pool.query(
        `SELECT * FROM giveaway_entries 
         WHERE giveaway_id = $1 
         ORDER BY RANDOM()`,
        [id]
      );
    }
    
    const entries = entriesResult.rows;
    const numWinners = Math.min(giveaway.num_winners, entries.length);
    
    if (numWinners === 0) {
      return res.status(400).json({ error: "No entries to select winners from" });
    }
    
    // Select winners
    const winners = entries.slice(0, numWinners);
    const winnerIds = [];
    
    for (const entry of winners) {
      const winnerResult = await pool.query(
        `INSERT INTO giveaway_winners (giveaway_id, user_id, telegram_id, telegram_username, prize_value, reward_status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING id`,
        [
          id,
          entry.user_id,
          entry.telegram_id,
          entry.telegram_username,
          giveaway.prize_value
        ]
      );
      
      winnerIds.push(winnerResult.rows[0].id);
    }
    
    // Update giveaway status
    await pool.query(
      "UPDATE giveaways SET status = 'ended', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
    
    await logAdminAction(req, "SELECT_WINNERS", "giveaway", id, { 
      num_winners: numWinners,
      winner_ids: winnerIds 
    });
    
    res.json({
      success: true,
      message: `Selected ${numWinners} winner(s)`,
      winners: winners.map((w) => ({
        user_id: w.user_id,
        telegram_username: w.telegram_username,
        prize_value: giveaway.prize_value
      }))
    });
  } catch (error) {
    console.error("Error selecting winners:", error);
    res.status(500).json({ error: "Failed to select winners" });
  }
});

/**
 * GET /api/admin/giveaways/:id/entries
 * Get entries for a giveaway
 */
router.get("/:id/entries", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const [entriesResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM giveaway_entries 
         WHERE giveaway_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      ),
      pool.query(
        "SELECT COUNT(*) FROM giveaway_entries WHERE giveaway_id = $1",
        [id]
      )
    ]);
    
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      entries: entriesResult.rows,
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

/**
 * DELETE /api/admin/giveaways/:id
 * Delete a giveaway (Super Admin only)
 */
router.delete("/:id", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query("DELETE FROM giveaways WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Giveaway not found" });
    }
    
    await logAdminAction(req, "DELETE", "giveaway", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting giveaway:", error);
    res.status(500).json({ error: "Failed to delete giveaway" });
  }
});

export default router;
