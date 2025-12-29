import { logSpin } from "../models/spinLog.js";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Weighted rewards: [value, chance out of 10,000]
const rewards = [
  { value: 5, weight: 5000 },
  { value: 10, weight: 2500 },
  { value: 25, weight: 1500 },
  { value: 50, weight: 700 },
  { value: 100, weight: 299 },
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

export async function checkEligibility(req, res) {
  try {
    const userId = req.query.user_id || req.headers["x-user-id"] || "guest";
    
    const check = await pool.query(
      `SELECT created_at FROM spin_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (check.rows.length === 0) {
      return res.json({ eligible: true });
    }

    const last = new Date(check.rows[0].created_at);
    const now = new Date();
    const diff = now - last;
    const hoursUntilNext = 24 - (diff / (1000 * 60 * 60));
    
    if (diff < 24 * 60 * 60 * 1000) {
      const nextSpin = new Date(last.getTime() + 24 * 60 * 60 * 1000);
      return res.json({ 
        eligible: false, 
        nextSpin: nextSpin.toISOString(),
        hoursUntilNext: Math.max(0, hoursUntilNext)
      });
    }

    return res.json({ eligible: true });
  } catch (err) {
    console.error("Eligibility check error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function handleDailySpin(req, res) {
  try {
    const userId = req.body.user_id || req.headers["x-user-id"] || "guest";
    const ip = req.headers["x-forwarded-for"] || req.ip;
    const ua = req.headers["user-agent"] || "unknown";

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
        return res.status(429).json({ error: "Daily spin already used" });
      }
    }

    const reward = weightedRandom();

    await logSpin({ user_id: userId, reward, ip_address: ip, user_agent: ua });

    return res.json({ reward, jackpot: reward === "JACKPOT" });
  } catch (err) {
    console.error("Spin error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}