import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";
import { broadcastToUser } from "./realtime.js";
import { notifyGiveawayWin } from "../bot/services/notifications.js";

const router = express.Router();

/**
 * @typedef {Object} Giveaway
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {'cwallet'|'runewager'|'crypto'|'lootbox'|'raffle_entries'} type
 * @property {string} prize_value
 * @property {string} [prize_asset]
 * @property {number} num_winners
 * @property {'draft'|'active'|'ended'|'cancelled'} status
 * @property {'telegram'|'web'|'both'} entry_method
 * @property {boolean} auto_select_winners
 * @property {boolean} allow_repeat_winners
 * @property {string} [start_date]
 * @property {string} [end_date]
 * @property {'random'|'weighted'|'first_come'} winner_selection_method
 * @property {string} [telegram_chat_id]
 * @property {string} [telegram_message_id]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} GiveawayEntry
 * @property {number} id
 * @property {number} giveaway_id
 * @property {string} user_id
 * @property {string} [telegram_id]
 * @property {string} [telegram_username]
 * @property {'telegram'|'web'} entry_method
 * @property {Object} [entry_data]
 * @property {string} created_at
 */

/**
 * GET /api/giveaways
 * Get active giveaways
 * 
 * @route GET /api/giveaways
 * @param {Object} req.query
 * @param {'active'|'ended'|'all'} [req.query.status] - Filter by status
 * @param {'cwallet'|'runewager'|'crypto'|'lootbox'|'raffle_entries'} [req.query.type] - Filter by type
 * @returns {Promise<Giveaway[]>} 200 - Success response with giveaways
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/", async (req, res) => {
  try {
    const { status, type } = req.query;
    
    let query = "SELECT * FROM giveaways WHERE 1=1";
    const params = [];
    
    if (status && status !== "all") {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await pool.query(query, params);
    
    res.status(200).json(
      result.rows.map((row) => ({
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
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching giveaways:", error);
    res.status(500).json({
      error: "Failed to fetch giveaways",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/giveaways/:id
 * Get specific giveaway with entry count
 * 
 * @route GET /api/giveaways/:id
 * @param {number} req.params.id - Giveaway ID
 * @returns {Promise<Giveaway & {entry_count: number, user_entered: boolean}>} 200 - Success
 * @returns {Promise<{error: string}>} 404 - Giveaway not found
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserFromRequest(req);
    
    const giveawayResult = await pool.query(
      "SELECT * FROM giveaways WHERE id = $1",
      [id]
    );
    
    if (giveawayResult.rows.length === 0) {
      return res.status(404).json({ error: "Giveaway not found" });
    }
    
    const giveaway = giveawayResult.rows[0];
    
    // Get entry count
    const entryCountResult = await pool.query(
      "SELECT COUNT(*) as count FROM giveaway_entries WHERE giveaway_id = $1",
      [id]
    );
    
    const entryCount = parseInt(entryCountResult.rows[0]?.count || 0);
    
    // Check if user entered
    let userEntered = false;
    if (user) {
      const userEntryResult = await pool.query(
        "SELECT * FROM giveaway_entries WHERE giveaway_id = $1 AND user_id = $2",
        [id, user.user_id]
      );
      userEntered = userEntryResult.rows.length > 0;
    }
    
    res.status(200).json({
      id: giveaway.id,
      title: giveaway.title,
      description: giveaway.description,
      type: giveaway.type,
      prize_value: giveaway.prize_value,
      prize_asset: giveaway.prize_asset,
      num_winners: giveaway.num_winners,
      status: giveaway.status,
      entry_method: giveaway.entry_method,
      auto_select_winners: giveaway.auto_select_winners,
      allow_repeat_winners: giveaway.allow_repeat_winners,
      start_date: giveaway.start_date ? giveaway.start_date.toISOString() : null,
      end_date: giveaway.end_date ? giveaway.end_date.toISOString() : null,
      winner_selection_method: giveaway.winner_selection_method,
      telegram_chat_id: giveaway.telegram_chat_id,
      telegram_message_id: giveaway.telegram_message_id,
      created_at: giveaway.created_at.toISOString(),
      updated_at: giveaway.updated_at.toISOString(),
      entry_count: entryCount,
      user_entered: userEntered,
    });
  } catch (error) {
    console.error("Error fetching giveaway:", error);
    res.status(500).json({
      error: "Failed to fetch giveaway",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/giveaways/:id/enter
 * Enter a giveaway
 * 
 * @route POST /api/giveaways/:id/enter
 * @param {number} req.params.id - Giveaway ID
 * @param {Object} req.body
 * @param {Object} [req.body.entry_data] - Additional entry data (cwallet_id, runewager username, etc.)
 * @returns {Promise<{success: boolean, message: string, entry: GiveawayEntry}>} 200 - Success
 * @returns {Promise<{error: string}>} 400 - Invalid request
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 404 - Giveaway not found
 * @returns {Promise<{error: string}>} 409 - Already entered
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/:id/enter", async (req, res) => {
  try {
    const { id } = req.params;
    const { entry_data } = req.body;
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get giveaway
    const giveawayResult = await pool.query(
      "SELECT * FROM giveaways WHERE id = $1",
      [id]
    );
    
    if (giveawayResult.rows.length === 0) {
      return res.status(404).json({ error: "Giveaway not found" });
    }
    
    const giveaway = giveawayResult.rows[0];
    
    // Check if giveaway is active
    if (giveaway.status !== "active") {
      return res.status(400).json({ error: "Giveaway is not active" });
    }
    
    // Check entry method
    if (giveaway.entry_method === "telegram") {
      return res.status(400).json({ error: "This giveaway can only be entered via Telegram" });
    }
    
    // Check if already entered
    const existingEntry = await pool.query(
      "SELECT * FROM giveaway_entries WHERE giveaway_id = $1 AND user_id = $2",
      [id, user.user_id]
    );
    
    if (existingEntry.rows.length > 0) {
      return res.status(409).json({ error: "Already entered this giveaway" });
    }
    
    // Validate entry requirements based on type
    if (giveaway.type === "cwallet" && (!entry_data?.cwallet_id && !user.cwallet_id)) {
      return res.status(400).json({ error: "Cwallet ID required for this giveaway" });
    }
    
    if (giveaway.type === "runewager" && (!entry_data?.runewager_username && !user.username)) {
      return res.status(400).json({ error: "Runewager username required for this giveaway" });
    }
    
    // Create entry
    const entryResult = await pool.query(
      `INSERT INTO giveaway_entries (giveaway_id, user_id, telegram_id, telegram_username, entry_method, entry_data, created_at)
       VALUES ($1, $2, $3, $4, 'web', $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        id,
        user.user_id,
        user.telegram_id || null,
        user.telegram_username || null,
        JSON.stringify(entry_data || {
          cwallet_id: user.cwallet_id,
          runewager_username: user.username,
        })
      ]
    );
    
    // Log activity
    await pool.query(
      `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
       VALUES ($1, 'reward_logged', 'Giveaway Entry', 'Entered giveaway: ${giveaway.title}', CURRENT_TIMESTAMP)`,
      [user.user_id]
    );

    // Broadcast real-time update
    const io = req.app.get('io');
    if (io) {
      broadcastToUser(io, user.user_id, 'giveaway:entry', {
        giveaway_id: id,
        giveaway_title: giveaway.title,
        timestamp: new Date().toISOString(),
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Successfully entered giveaway",
      entry: {
        id: entryResult.rows[0].id,
        giveaway_id: entryResult.rows[0].giveaway_id,
        user_id: entryResult.rows[0].user_id,
        telegram_id: entryResult.rows[0].telegram_id,
        telegram_username: entryResult.rows[0].telegram_username,
        entry_method: entryResult.rows[0].entry_method,
        entry_data: entryResult.rows[0].entry_data,
        created_at: entryResult.rows[0].created_at.toISOString(),
      }
    });
  } catch (error) {
    console.error("Error entering giveaway:", error);
    res.status(500).json({
      error: "Failed to enter giveaway",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/giveaways/:id/winners
 * Get winners for a giveaway
 * 
 * @route GET /api/giveaways/:id/winners
 * @param {number} req.params.id - Giveaway ID
 * @returns {Promise<Array<{id: number, user_id: string, telegram_username?: string, prize_value: string, reward_status: string, created_at: string}>>} 200 - Success
 * @returns {Promise<{error: string}>} 404 - Giveaway not found
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/:id/winners", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify giveaway exists
    const giveawayResult = await pool.query(
      "SELECT * FROM giveaways WHERE id = $1",
      [id]
    );
    
    if (giveawayResult.rows.length === 0) {
      return res.status(404).json({ error: "Giveaway not found" });
    }
    
    // Get winners
    const winnersResult = await pool.query(
      `SELECT * FROM giveaway_winners 
       WHERE giveaway_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    
    res.status(200).json(
      winnersResult.rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        telegram_id: row.telegram_id,
        telegram_username: row.telegram_username,
        prize_value: row.prize_value,
        reward_status: row.reward_status,
        reward_data: row.reward_data,
        notified_at: row.notified_at ? row.notified_at.toISOString() : null,
        delivered_at: row.delivered_at ? row.delivered_at.toISOString() : null,
        created_at: row.created_at.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching winners:", error);
    res.status(500).json({
      error: "Failed to fetch winners",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
