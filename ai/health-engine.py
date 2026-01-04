import express from "express";
import cors from "cors";
import { pool, addMemory, logHealth, logAnomaly } from "./memory-store.js";
import { runHealthScan } from "./memory-monitor.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8010;

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_memory (
      id SERIAL PRIMARY KEY,
      category TEXT,
      message TEXT,
      source TEXT,
      meta JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_health (
      id SERIAL PRIMARY KEY,
      service TEXT,
      status TEXT,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS anomalies (
      id SERIAL PRIMARY KEY,
      type TEXT,
      message TEXT,
      meta JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

/**
 * STORE MEMORY
 */
app.post("/memory", async (req, res) => {
  try {
    const { category, message, source, meta } = req.body;
    await addMemory(category, message, source, meta || {});
    res.json({ ok: true });
  } catch (err) {
    console.error("addMemory error:", err);
    res.status(500).json({ error: "failed" });
  }
});

/**
 * GET MEMORY LOG
 */
app.get("/memory", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_memory ORDER BY created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("memory query error:", err);
    res.status(500).json({ error: "failed" });
  }
});

/**
 * HEALTH DATA
 */
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM service_health ORDER BY created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("health query error:", err);
    res.status(500).json({ error: "failed" });
  }
});

/**
 * ANOMALIES
 */
app.get("/anomalies", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM anomalies ORDER BY created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("anomalies query error:", err);
    res.status(500).json({ error: "failed" });
  }
});

/**
 * RUN HEALTH SCAN
 */
app.post("/scan", async (req, res) => {
  try {
    await runHealthScan();
    res.json({ ok: true });
  } catch (err) {
    console.error("scan error:", err);
    res.status(500).json({ error: "failed" });
  }
});

(async () => {
  await init();

  app.listen(PORT, () =>
    console.log(`🧠 AI Memory Monitor running on :${PORT}`)
  );

  setInterval(runHealthScan, 60000);
})();