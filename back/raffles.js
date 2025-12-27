const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get("/", async (_, res) => {
  const result = await pool.query("SELECT * FROM raffles WHERE active = true ORDER BY end_date ASC");
  res.json(result.rows);
});

router.post("/enter", async (req, res) => {
  const { user_id, raffle_id } = req.body;
  if (!user_id || !raffle_id) return res.status(400).json({ error: "Missing params" });

  const exists = await pool.query(
    "SELECT * FROM raffle_entries WHERE user_id = $1 AND raffle_id = $2",
    [user_id, raffle_id]
  );

  if (exists.rowCount > 0) {
    return res.status(409).json({ error: "Already entered" });
  }

  await pool.query("INSERT INTO raffle_entries (user_id, raffle_id, timestamp) VALUES ($1, $2, NOW())", [user_id, raffle_id]);
  res.json({ success: true, message: "Entry submitted" });
});

router.get("/winners/:raffle_id", async (req, res) => {
  const { raffle_id } = req.params;
  const result = await pool.query("SELECT * FROM raffle_winners WHERE raffle_id = $1", [raffle_id]);
  res.json(result.rows);
});

router.get("/entries/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const result = await pool.query("SELECT * FROM raffle_entries WHERE user_id = $1", [user_id]);
  res.json(result.rows);
});

module.exports = router;

-- sql/raffles.sql
CREATE TABLE IF NOT EXISTS raffles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  end_date TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT TRUE
);
-- sql/raffle_entries.sql
CREATE TABLE IF NOT EXISTS raffle_entries (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  raffle_id INT REFERENCES raffles(id),
  timestamp TIMESTAMP DEFAULT NOW()
);
-- sql/raffle_winners.sql
CREATE TABLE IF NOT EXISTS raffle_winners (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  raffle_id INT REFERENCES raffles(id),
  reward TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
