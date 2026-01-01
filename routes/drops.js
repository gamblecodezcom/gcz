import express from "express";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import {
  getUserFromRequest,
  requireUser,
  requireLevel,
  requireSuper
} from "../middleware/userAuth.js";

import { processDrop } from "../utils/dropEngine.js";

const router = express.Router();

/**
 * ============================
 * USER: SUBMIT DROP
 * POST /api/drops
 * ============================
 * Body: {
 *   text: string,
 *   source?: "web" | "bot" | "discord" | string,
 *   meta?: object
 * }
 */
router.post("/", requireUser, async (req, res) => {
  try {
    const user = await getUserFromRequest(req).catch(() => null);

    const raw = {
      ...req.body,
      source: req.body.source || "web",
      meta: {
        ...(req.body.meta || {}),
        user_id: user?.id || null
      }
    };

    const result = await processDrop(raw);

    if (!result.ok) {
      logger.warn("drops: processDrop failed", result);
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    logger.error("drops: POST / handler failed:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
});

/**
 * ============================
 * USER: LIST RECENT DROPS
 * GET /api/drops
 * ============================
 * NOTE: This is a placeholder. You can later wire this
 * to your actual drops table or cache.
 */
router.get("/", async (req, res) => {
  try {
    // TODO: Replace with real query once drops table is defined.
    // Example shape:
    // const { rows } = await pool.query(
    //   "SELECT id, text, category, confidence, created_at FROM drops ORDER BY created_at DESC LIMIT 50"
    // );

    const rows = []; // placeholder to avoid runtime errors
    return res.json({ ok: true, drops: rows });
  } catch (err) {
    logger.error("drops: GET / handler failed:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
});

/**
 * ============================
 * ADMIN: VIEW PENDING DROPS
 * GET /api/drops/pending
 * ============================
 * Requires elevated level (e.g. mod/admin).
 * This is a stub until you define a real pending table.
 */
router.get("/pending", requireLevel(2), async (req, res) => {
  try {
    // TODO: Wire to real pending table:
    // const { rows } = await pool.query(
    //   "SELECT id, text, category, confidence, created_at FROM drops_pending ORDER BY created_at ASC"
    // );

    const rows = []; // placeholder
    return res.json({ ok: true, pending: rows });
  } catch (err) {
    logger.error("drops: GET /pending handler failed:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
});

/**
 * ============================
 * ADMIN: APPROVE DROP
 * POST /api/drops/:id/approve
 * ============================
 * Body: { categoryOverride?: string }
 * Requires super/admin for now.
 * This is a stub; you can wire it to move a record from
 * drops_pending -> drops and notify bots/telegram.
 */
router.post("/:id/approve", requireSuper, async (req, res) => {
  const { id } = req.params;
  const { categoryOverride } = req.body || {};

  try {
    // TODO: Example logic (replace when schema is ready):
    // await pool.query(
    //   "SELECT * FROM drops_pending WHERE id = $1",
    //   [id]
    // );
    // Move to drops table, delete from pending, etc.

    logger.info("drops: approve called for id:", id, "override:", categoryOverride);

    // For now, just respond success so UI can be wired without DB ready.
    return res.json({
      ok: true,
      id,
      categoryOverride: categoryOverride || null,
      message: "Approve endpoint stub OK"
    });
  } catch (err) {
    logger.error("drops: POST /:id/approve handler failed:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
});

export default router;
