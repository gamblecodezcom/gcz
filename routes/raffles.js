import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

/**
 * @typedef {Object} Raffle
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} prize
 * @property {'crypto_box'|'cwallet_deposit'|'wallet_tip'|'platform_tip'} prizeType
 * @property {string} [secretCode]
 * @property {boolean} isSecret
 * @property {number} maxWinners
 * @property {string[]} winners
 * @property {string} endsAt
 * @property {string} createdAt
 * @property {'active'|'ended'|'cancelled'} status
 */

/**
 * GET /api/raffles
 * List active raffles
 * 
 * @route GET /api/raffles
 * @returns {Promise<Raffle[]>} 200 - Success response with list of active raffles
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        name as title,
        description,
        prize_type as "prizeType",
        prize_value as "prize",
        secret_password as "secretCode",
        secret as "isSecret",
        1 as "maxWinners",
        end_date as "endsAt",
        updated_at as "createdAt",
        active,
        CASE 
          WHEN end_date IS NOT NULL AND end_date < CURRENT_TIMESTAMP THEN 'ended'
          WHEN active = false THEN 'cancelled'
          ELSE 'active'
        END as status
       FROM raffles 
       WHERE active = true 
       AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
       ORDER BY end_date ASC NULLS LAST`
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
          title: raffle.title || "",
          description: raffle.description || "",
          prize: raffle.prize || "",
          prizeType: raffle.prizeType || "crypto_box",
          secretCode: raffle.secretCode || undefined,
          isSecret: raffle.isSecret || false,
          maxWinners: raffle.maxWinners || 1,
          winners: winnersResult.rows.map((w) => w.winner),
          endsAt: raffle.endsAt ? raffle.endsAt.toISOString() : null,
          createdAt: raffle.createdAt ? raffle.createdAt.toISOString() : new Date().toISOString(),
          status: raffle.status,
        };
      })
    );
    
    res.status(200).json(rafflesWithWinners);
  } catch (error) {
    console.error("Error fetching raffles:", error);
    res.status(500).json({ 
      error: "Failed to fetch raffles",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/raffles/enter
 * Enter a raffle
 * 
 * @route POST /api/raffles/enter
 * @param {Object} req.body
 * @param {string} req.body.user_id - User ID
 * @param {string} req.body.raffle_id - Raffle ID
 * @returns {Promise<{success: boolean, message: string}>} 200 - Success response
 * @returns {Promise<{error: string}>} 400 - Missing required fields
 * @returns {Promise<{error: string}>} 404 - Raffle not found
 * @returns {Promise<{error: string}>} 409 - Already entered
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.post("/enter", async (req, res) => {
  try {
    const { user_id, raffle_id } = req.body;
    if (!user_id || !raffle_id) {
      return res.status(400).json({ error: "Missing user_id or raffle_id" });
    }

    // Check if raffle exists and is active
    const raffleCheck = await pool.query(
      "SELECT * FROM raffles WHERE id = $1 AND active = true",
      [raffle_id]
    );

    if (raffleCheck.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found or inactive" });
    }

    // Check if already entered
    const exists = await pool.query(
      "SELECT * FROM raffle_entries WHERE user_id = $1 AND raffle_id = $2",
      [user_id, raffle_id]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Already entered" });
    }

    // Insert entry
    await pool.query(
      "INSERT INTO raffle_entries (user_id, raffle_id) VALUES ($1, $2)",
      [user_id, raffle_id]
    );

    res.status(200).json({ success: true, message: "Entry submitted" });
  } catch (error) {
    console.error("Error entering raffle:", error);
    res.status(500).json({ 
      error: "Failed to enter raffle",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/raffles/winners/:raffle_id
 * Get winners for a raffle
 * 
 * @route GET /api/raffles/winners/:raffle_id
 * @param {string} req.params.raffle_id - Raffle ID
 * @returns {Promise<{winners: Array}>} 200 - Success response with winners
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/winners/:raffle_id", async (req, res) => {
  try {
    const { raffle_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM raffle_winners WHERE raffle_id = $1",
      [raffle_id]
    );
    res.status(200).json({ winners: result.rows });
  } catch (error) {
    console.error("Error fetching winners:", error);
    res.status(500).json({ 
      error: "Failed to fetch winners",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/raffles/entries/:user_id
 * Get user's entries
 * 
 * @route GET /api/raffles/entries/:user_id
 * @param {string} req.params.user_id - User ID
 * @returns {Promise<{entries: Array}>} 200 - Success response with entries
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/entries/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM raffle_entries WHERE user_id = $1",
      [user_id]
    );
    res.status(200).json({ entries: result.rows });
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ 
      error: "Failed to fetch entries",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/raffles/endless
 * Get the never-ending raffle (linked to wheel)
 * 
 * @route GET /api/raffles/endless
 * @returns {Promise<{raffle: Raffle | null, userEntries: number, totalEntries: number}>} 200 - Success response
 * @returns {Promise<{error: string}>} 500 - Server error
 */
router.get("/endless", async (req, res) => {
  try {
    // Get wheel config to find target raffle
    const wheelConfig = await pool.query(
      "SELECT target_raffle_id FROM wheel_config WHERE id = 1"
    );
    
    if (!wheelConfig.rows.length || !wheelConfig.rows[0].target_raffle_id) {
      return res.status(200).json({ 
        raffle: null, 
        userEntries: 0, 
        totalEntries: 0 
      });
    }
    
    const targetRaffleId = wheelConfig.rows[0].target_raffle_id;
    
    // Get raffle details
    const raffleResult = await pool.query(
      `SELECT 
        id,
        name as title,
        description,
        prize_type as "prizeType",
        prize_value as "prize",
        secret_password as "secretCode",
        secret as "isSecret",
        1 as "maxWinners",
        end_date as "endsAt",
        updated_at as "createdAt",
        active,
        CASE 
          WHEN end_date IS NOT NULL AND end_date < CURRENT_TIMESTAMP THEN 'ended'
          WHEN active = false THEN 'cancelled'
          ELSE 'active'
        END as status
       FROM raffles 
       WHERE id = $1`,
      [targetRaffleId]
    );
    
    if (raffleResult.rows.length === 0) {
      return res.status(200).json({ 
        raffle: null, 
        userEntries: 0, 
        totalEntries: 0 
      });
    }
    
    const raffle = raffleResult.rows[0];
    
    // Get user entries (if authenticated)
    const userId = req.query.user_id || req.headers["x-user-id"] || null;
    let userEntries = 0;
    if (userId) {
      const userEntriesResult = await pool.query(
        `SELECT COUNT(*) as count FROM raffle_entries 
         WHERE raffle_id = $1 AND user_id = $2`,
        [targetRaffleId, userId]
      );
      userEntries = parseInt(userEntriesResult.rows[0]?.count || 0);
    }
    
    // Get total entries
    const totalEntriesResult = await pool.query(
      `SELECT COUNT(*) as count FROM raffle_entries WHERE raffle_id = $1`,
      [targetRaffleId]
    );
    const totalEntries = parseInt(totalEntriesResult.rows[0]?.count || 0);
    
    // Get winners
    const winnersResult = await pool.query(
      "SELECT winner FROM raffle_winners WHERE raffle_id = $1",
      [targetRaffleId]
    );
    
    res.status(200).json({
      raffle: {
        id: raffle.id.toString(),
        title: raffle.title || "",
        description: raffle.description || "",
        prize: raffle.prize || "",
        prizeType: raffle.prizeType || "crypto_box",
        secretCode: raffle.secretCode || undefined,
        isSecret: raffle.isSecret || false,
        maxWinners: raffle.maxWinners || 1,
        winners: winnersResult.rows.map((w) => w.winner),
        endsAt: raffle.endsAt ? raffle.endsAt.toISOString() : null,
        createdAt: raffle.createdAt ? raffle.createdAt.toISOString() : new Date().toISOString(),
        status: raffle.status,
        raffleType: 'endless', // Endless raffles are identified by being linked via wheel_config
      },
      userEntries,
      totalEntries,
    });
  } catch (error) {
    console.error("Error fetching endless raffle:", error);
    res.status(500).json({ 
      error: "Failed to fetch endless raffle",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
