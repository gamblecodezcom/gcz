import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req).catch(() => null);

    const {
      role,
      surface,
      issue_type,
      severity,
      description,
      metadata
    } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const result = await pool.query(
      `INSERT INTO bug_reports 
       (user_id, role, surface, issue_type, severity, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        user?.user_id || null,
        role || "user",
        surface || "website",
        issue_type || "other",
        severity || "low",
        description,
        metadata || {}
      ]
    );

    return res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error("Bug report insert failed:", err);
    return res.status(500).json({ ok: false, error: "Failed to submit bug report" });
  }
});

export default router;
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bug_reports ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    logger.error("bugReports: GET /all failed:", err);
    res.status(500).json({ error: "Failed to load bug reports" });
  }
});

router.post("/status", async (req, res) => {
  try {
    const { id, status } = req.body;

    await pool.query("UPDATE bug_reports SET status = $1 WHERE id = $2", [status, id]);

    await pool.query(
      "INSERT INTO bug_report_actions (bug_id, action, ts) VALUES ($1, $2, NOW())",
      [id, status]
    );

    res.json({ ok: true });
  } catch (err) {
    logger.error("bugReports: POST /status failed:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});
