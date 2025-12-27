import { logSpin } from "../models/spinLog.js";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Weighted reward table
const rewards = [
  { value: 5, weight: 6000 },
  { value: 10, weight: 2500 },
  { value: 25, weight: 1000 },
  { value: 50, weight: 400 },
  { value: 100, weight: 99 },
  { value: "JACKPOT", weight: 1 }
];

function weightedRandom() {
  const total = rewards.reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.floor(Math.random() * total);

  for (const r of rewards) {
    if (rand < r.weight) return r.value;
    rand -= r.weight;
  }
}

export async function handleDailySpin(req, res) {
  try {
    const userId = req.headers["x-user-id"] || "guest";
    const ip = req.headers["x-forwarded-for"] || req.ip;
    const ua = req.headers["user-agent"] || "unknown";

    // Enforce 24h limit
    const check = await pool.query(
      `SELECT created_at FROM spin_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (check.rows.length > 0) {
      const last = new Date(check.rows[0].created_at);
      const now = new Date();
      const diff = now - last;

      if (diff < 24 * 60 * 60 * 1000) {
        return res.status(429).json({
          error: "Daily spin already used"
        });
      }
    }

    // Generate reward
    const reward = weightedRandom();

    // Log spin
    await logSpin({
      user_id: userId,
      reward,
      ip_address: ip,
      user_agent: ua
    });

    return res.json({ reward, jackpot: reward === "JACKPOT" });
  } catch (err) {
    console.error("Spin error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}