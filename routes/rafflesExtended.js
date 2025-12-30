import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest, requireUser } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * @typedef {Object} SecretCodeResponse
 * @property {boolean} success
 * @property {string} message
 * @property {number} [entriesAdded]
 * @property {string[]} [raffleIds]
 */

/**
 * POST /api/raffles/secret-code
 * Submit secret code
 * 
 * @route POST /api/raffles/secret-code
 * @param {Object} req.body
 * @param {string} req.body.code - Secret code to redeem
 * @returns {Promise<SecretCodeResponse>} 200 - Success response
 * @returns {Promise<{error: string}>} 400 - Invalid code format
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/secret-code", requireUser, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.user_id;
    
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Secret code is required" });
    }
    
    // Find active raffles with matching secret code
    const rafflesResult = await pool.query(
      `SELECT id, title, entries_per_source 
       FROM raffles 
       WHERE active = true 
       AND secret = true 
       AND secret_code = $1 
       AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
       AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)`,
      [code.toUpperCase().trim()]
    );
    
    if (rafflesResult.rows.length === 0) {
      return res.json({
        success: false,
        message: "Invalid secret code",
      });
    }
    
    const entriesAdded = [];
    const raffleIds = [];
    
    for (const raffle of rafflesResult.rows) {
      // Check if already entered
      const existingEntry = await pool.query(
        "SELECT * FROM raffle_entries WHERE raffle_id = $1 AND user_id = $2",
        [raffle.id, userId]
      );
      
      if (existingEntry.rows.length > 0) {
        continue; // Skip if already entered
      }
      
      // Get entries per source from JSONB
      const entriesPerSource = raffle.entries_per_source || {};
      const entriesToAdd = entriesPerSource.secret_code || 10;
      
      // Add entry
      await pool.query(
        `INSERT INTO raffle_entries (raffle_id, user_id, entry_source, entry_time)
         VALUES ($1, $2, 'secret_code', CURRENT_TIMESTAMP)`,
        [raffle.id, userId]
      );
      
      // Log activity
      await pool.query(
        `INSERT INTO activity_log (user_id, activity_type, title, description, created_at)
         VALUES ($1, 'secret_code', 'Secret Code Redeemed', 'Redeemed secret code for ' || $2, CURRENT_TIMESTAMP)`,
        [userId, raffle.title]
      );
      
      entriesAdded.push(entriesToAdd);
      raffleIds.push(raffle.id.toString());
    }
    
    if (entriesAdded.length === 0) {
      return res.json({
        success: false,
        message: "You have already entered all raffles for this code",
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Secret code redeemed! Added ${entriesAdded.reduce((a, b) => a + b, 0)} entries.`,
      entriesAdded: entriesAdded.reduce((a, b) => a + b, 0),
      raffleIds,
    });
  } catch (error) {
    console.error("Error submitting secret code:", error);
    res.status(500).json({ 
      error: "Failed to submit secret code",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * @typedef {Object} RaffleEntry
 * @property {string} id
 * @property {string} raffleId
 * @property {string} raffleTitle
 * @property {'daily_checkin'|'wheel'|'secret_code'|'manual'} source
 * @property {number} entries
 * @property {string} createdAt
 */

/**
 * GET /api/raffles/entries
 * Get user's raffle entries
 * 
 * @route GET /api/raffles/entries
 * @param {string} [req.query.raffleId] - Optional raffle ID filter
 * @returns {Promise<RaffleEntry[]>} 200 - Success response with entries
 * @returns {Promise<{error: string}>} 401 - Authentication required
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/entries", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { raffleId } = req.query;
    const userId = user.user_id;
    
    let query = `
      SELECT 
        re.id,
        re.raffle_id as "raffleId",
        r.title as "raffleTitle",
        re.entry_source as source,
        re.entry_time as "createdAt",
        CASE 
          WHEN re.entry_source = 'daily_checkin' THEN COALESCE((r.entries_per_source->>'daily_checkin')::int, 1)
          WHEN re.entry_source = 'wheel' THEN COALESCE((r.entries_per_source->>'wheel')::int, 5)
          WHEN re.entry_source = 'secret_code' THEN COALESCE((r.entries_per_source->>'secret_code')::int, 10)
          WHEN re.entry_source = 'manual' THEN COALESCE((r.entries_per_source->>'manual')::int, 0)
          ELSE 1
        END as entries
      FROM raffle_entries re
      JOIN raffles r ON re.raffle_id = r.id
      WHERE re.user_id = $1
    `;
    
    const params = [userId];
    
    if (raffleId) {
      query += " AND re.raffle_id = $2";
      params.push(raffleId);
    }
    
    query += " ORDER BY re.entry_time DESC";
    
    const result = await pool.query(query, params);
    
    res.status(200).json(
      result.rows.map((row) => ({
        id: row.id.toString(),
        raffleId: row.raffleId.toString(),
        raffleTitle: row.raffleTitle,
        source: row.source,
        entries: parseInt(row.entries) || 1,
        createdAt: row.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching raffle entries:", error);
    res.status(500).json({ 
      error: "Failed to fetch raffle entries",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/raffles/past
 * Get past raffles
 * 
 * @route GET /api/raffles/past
 * @returns {Promise<Raffle[]>} 200 - Success response with past raffles
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/past", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        title,
        description,
        prize_type as "prizeType",
        prize_value as "prize",
        secret_code as "secretCode",
        secret as "isSecret",
        num_winners as "maxWinners",
        end_date as "endsAt",
        created_at as "createdAt",
        active,
        CASE 
          WHEN end_date < CURRENT_TIMESTAMP THEN 'ended'
          WHEN active = false THEN 'cancelled'
          ELSE 'active'
        END as status
       FROM raffles 
       WHERE end_date < CURRENT_TIMESTAMP OR active = false
       ORDER BY end_date DESC 
       LIMIT 50`
    );
    
    // Get winners for each raffle
    const rafflesWithWinners = await Promise.all(
      result.rows.map(async (raffle) => {
        const winnersResult = await pool.query(
          "SELECT winner FROM raffle_winners WHERE raffle_id = $1",
          [raffle.id]
        );
        
        return {
          id: raffle.id.toString(),
          title: raffle.title,
          description: raffle.description || "",
          prize: raffle.prize || "",
          prizeType: raffle.prizeType || "crypto_box",
          secretCode: raffle.secretCode || undefined,
          isSecret: raffle.secret || false,
          maxWinners: raffle.maxWinners || 1,
          winners: winnersResult.rows.map((w) => w.winner),
          endsAt: raffle.endsAt ? raffle.endsAt.toISOString() : "",
          createdAt: raffle.createdAt.toISOString(),
          status: raffle.status,
        };
      })
    );
    
    res.status(200).json(rafflesWithWinners);
  } catch (error) {
    console.error("Error fetching past raffles:", error);
    res.status(500).json({ 
      error: "Failed to fetch past raffles",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
