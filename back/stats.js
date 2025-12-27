const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get("/", async (_, res) => {
  const [spins, raffles] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM spin_logs"),
    pool.query("SELECT COUNT(*) FROM raffle_entries"),
  ]);

  res.json({
    total_spins: parseInt(spins.rows[0].count, 10),
    total_raffle_entries: parseInt(raffles.rows[0].count, 10),
  });
});

module.exports = router;
