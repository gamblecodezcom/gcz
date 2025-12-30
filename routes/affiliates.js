import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import { validateAffiliateCSV } from "../utils/validateCsv.js";

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Validate CSV on startup (non-blocking)
try {
  validateAffiliateCSV("master_affiliates.csv");
} catch (error) {
  console.warn("CSV validation warning (non-blocking):", error.message);
  // Continue server startup even if CSV validation fails
}

// GET /api/affiliates - Get all affiliates for dropdown
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, affiliate_url, level FROM affiliates_master ORDER BY name ASC"
    );
    res.json({ status: "ok", affiliates: result.rows });
  } catch (error) {
    console.error("Error fetching affiliates:", error);
    res.status(500).json({ error: "Failed to fetch affiliates" });
  }
});

export default router;
