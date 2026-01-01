import express from "express";
import pool from "../utils/db.js";
import { addRaffleEntries } from "../utils/raffleEntries.js";

const router = express.Router();

/**
 * GET /api/raffles
 * List active raffles with winner info.
 */
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         title,
         description,
         prize_type AS "prizeType",
         prize_value AS "prize",
         secret_code AS "secretCode",
         secret AS "isSecret",
         num_winners AS "maxWinners",
         end_date AS "endsAt",
         created_at AS "createdAt",
         active,
         hidden,
         raffle_type,
         CASE
           WHEN end_date IS NOT NULL AND end_date < CURRENT_TIMESTAMP THEN 'ended'
           WHEN active = false THEN 'cancelled'
           ELSE 'active'
         END AS status
       FROM raffles
       WHERE active = true
         AND hidden = false
         AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
         AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
       ORDER BY end_date ASC NULLS LAST`
    );

    const rafflesWithWinners = await Promise.all(
      result.rows.map(async (raffle) => {
        const winnersResult = await pool.query(
          "SELECT user_id FROM raffle_winners WHERE raffle_id = $1",
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
          winners: winnersResult.rows.map((w) => w.user_id),
          endsAt: raffle.endsAt ? raffle.endsAt.toISOString() : null,
          createdAt: raffle.createdAt
            ? raffle.createdAt.toISOString()
            : new Date().toISOString(),
          status: raffle.status,
          raffleType: raffle.raffle_type || "timed",
        };
      })
    );

    res.status(200).json(rafflesWithWinners);
  } catch (error) {
    console.error("Error fetching raffles:", error);
    res.status(500).json({
      error: "Failed to fetch raffles",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/raffles/enter
 * Manual entry into a raffle (for backfill/manual UI).
 */
router.post("/enter", async (req, res) => {
  try {
    const { user_id, raffle_id } = req.body;

    if (!user_id || !raffle_id) {
      return res
        .status(400)
        .json({ error: "Missing user_id or raffle_id" });
    }

    const raffleCheck = await pool.query(
      "SELECT * FROM raffles WHERE id = $1 AND active = true",
      [raffle_id]
    );

    if (raffleCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Raffle not found or inactive" });
    }

    const raffle = raffleCheck.rows[0];

    let entrySources = raffle.entry_sources;
    if (typeof entrySources === "string") {
      try {
        entrySources = JSON.parse(entrySources || "[]");
      } catch {
        entrySources = [];
      }
    }

    if (!Array.isArray(entrySources) || !entrySources.includes("manual")) {
      return res.status(403).json({
        error: "Manual entry is not allowed for this raffle",
        message: "Manual entry is not allowed for this raffle",
      });
    }

    await addRaffleEntries(pool, raffle, user_id, "manual");

    let entriesPerSource = raffle.entries_per_source;
    if (typeof entriesPerSource === "string") {
      try {
        entriesPerSource = JSON.parse(entriesPerSource || "{}");
      } catch {
        entriesPerSource = {};
      }
    }

    const entriesAdded = entriesPerSource["manual"] || 0;

    if (entriesAdded === 0) {
      return res.status(200).json({
        success: true,
        message:
          "Entry submitted (0 entries - manual entries may be disabled for this raffle)",
      });
    }

    res.status(200).json({
      success: true,
      message: `Entry submitted (${entriesAdded} entries added)`,
    });
  } catch (error) {
    console.error("Error entering raffle:", error);
    res.status(500).json({
      error: "Failed to enter raffle",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/raffles/winners/:raffle_id
 * Get winners for a raffle.
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/raffles/entries/:user_id
 * Get all entries for a given user.
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
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
