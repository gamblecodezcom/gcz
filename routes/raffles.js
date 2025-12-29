import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/raffles - List active raffles
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM raffles WHERE active = true ORDER BY end_date ASC"
    );
    res.json({ raffles: result.rows });
  } catch (error) {
    console.error("Error fetching raffles:", error);
    res.status(500).json({ error: "Failed to fetch raffles" });
  }
});

// POST /api/raffles/enter - Enter a raffle
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

    res.json({ success: true, message: "Entry submitted" });
  } catch (error) {
    console.error("Error entering raffle:", error);
    res.status(500).json({ error: "Failed to enter raffle" });
  }
});

// GET /api/raffles/winners/:raffle_id - Get winners for a raffle
router.get("/winners/:raffle_id", async (req, res) => {
  try {
    const { raffle_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM raffle_winners WHERE raffle_id = $1",
      [raffle_id]
    );
    res.json({ winners: result.rows });
  } catch (error) {
    console.error("Error fetching winners:", error);
    res.status(500).json({ error: "Failed to fetch winners" });
  }
});

// GET /api/raffles/entries/:user_id - Get user's entries
router.get("/entries/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM raffle_entries WHERE user_id = $1",
      [user_id]
    );
    res.json({ entries: result.rows });
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

export default router;
