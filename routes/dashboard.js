import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * GET /api/profile/dashboard-stats
 * Basic dashboard stats for the authenticated user.
 */
router.get("/dashboard-stats", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = user.user_id;

    const raffleEntriesResult = await pool.query(
      "SELECT COUNT(*) AS count FROM raffle_entries WHERE user_id = $1",
      [userId]
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const raffleEntriesTodayResult = await pool.query(
      "SELECT COUNT(*) AS count FROM raffle_entries WHERE user_id = $1 AND created_at >= $2",
      [userId, todayStart]
    );

    const lastSpinResult = await pool.query(
      `SELECT created_at
       FROM spin_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    let wheelSpinsRemaining = 1;
    if (lastSpinResult.rows.length > 0) {
      const lastSpin = new Date(lastSpinResult.rows[0].created_at);
      const now = new Date();
      const diffMs = now.getTime() - lastSpin.getTime();
      const hoursSinceLastSpin = diffMs / (1000 * 60 * 60);
      if (hoursSinceLastSpin < 24) {
        wheelSpinsRemaining = 0;
      }
    }

    const linkedCasinosResult = await pool.query(
      "SELECT COUNT(*) AS count FROM user_linked_sites WHERE user_id = $1",
      [userId]
    );

    const giveawaysReceived = 0; // placeholder, reserved for future rewards table

    res.status(200).json({
      raffleEntries: parseInt(raffleEntriesResult.rows[0]?.count || 0, 10),
      raffleEntriesToday: parseInt(
        raffleEntriesTodayResult.rows[0]?.count || 0,
        10
      ),
      wheelSpinsRemaining,
      giveawaysReceived,
      linkedCasinos: parseInt(linkedCasinosResult.rows[0]?.count || 0, 10),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard stats",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/sites-linked
 * Get linked sites for the authenticated user.
 */
router.get("/sites-linked", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = user.user_id;

    const result = await pool.query(
      `SELECT
         uls.id,
         uls.site_id AS "siteId",
         am.name AS "siteName",
         am.slug AS "siteSlug",
         uls.identifier_type AS "identifierType",
         uls.identifier_value AS "identifierValue",
         uls.created_at AS "linkedAt",
         uls.updated_at AS "updatedAt"
       FROM user_linked_sites uls
       JOIN affiliates_master am ON uls.site_id = am.id::text
       WHERE uls.user_id = $1
       ORDER BY uls.created_at DESC`,
      [userId]
    );

    res.status(200).json(
      result.rows.map((row) => ({
        id: row.id.toString(),
        siteId: row.siteId,
        siteName: row.siteName,
        siteSlug: row.siteSlug,
        identifierType: row.identifierType,
        identifierValue: row.identifierValue,
        linkedAt: row.linkedAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching linked sites:", error);
    res.status(500).json({
      error: "Failed to fetch linked sites",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/profile/site-link
 * Link a site to the authenticated user.
 */
router.post("/site-link", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { siteId, identifierType, identifierValue } = req.body;

    if (!siteId || !identifierType || !identifierValue) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["username", "email", "player_id"].includes(identifierType)) {
      return res.status(400).json({ error: "Invalid identifier type" });
    }

    const siteCheck = await pool.query(
      "SELECT id, name, slug FROM affiliates_master WHERE id = $1",
      [siteId]
    );

    if (siteCheck.rows.length === 0) {
      return res.status(404).json({ error: "Site not found" });
    }

    const result = await pool.query(
      `INSERT INTO user_linked_sites (
         user_id,
         site_id,
         identifier_type,
         identifier_value,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, site_id)
       DO UPDATE SET
         identifier_type = EXCLUDED.identifier_type,
         identifier_value = EXCLUDED.identifier_value,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user.user_id, siteId, identifierType, identifierValue]
    );

    await pool.query(
      `INSERT INTO activity_log (
         user_id,
         activity_type,
         title,
         description,
         created_at
       )
       VALUES (
         $1,
         'account_linked',
         'Account Linked',
         'Linked account to ' || $2,
         CURRENT_TIMESTAMP
       )`,
      [user.user_id, siteCheck.rows[0].name]
    );

    res.status(200).json({
      id: result.rows[0].id.toString(),
      siteId: result.rows[0].site_id,
      siteName: siteCheck.rows[0].name,
      siteSlug: siteCheck.rows[0].slug,
      identifierType: result.rows[0].identifier_type,
      identifierValue: result.rows[0].identifier_value,
      linkedAt: result.rows[0].created_at.toISOString(),
      updatedAt: result.rows[0].updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error linking site:", error);
    res.status(500).json({
      error: "Failed to link site",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * DELETE /api/profile/site-link/:siteId
 * Unlink a site from the authenticated user.
 */
router.delete("/site-link/:siteId", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { siteId } = req.params;

    const siteResult = await pool.query(
      "SELECT name FROM affiliates_master WHERE id = $1",
      [siteId]
    );

    await pool.query(
      "DELETE FROM user_linked_sites WHERE user_id = $1 AND site_id = $2",
      [user.user_id, siteId]
    );

    if (siteResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO activity_log (
           user_id,
           activity_type,
           title,
           description,
           created_at
         )
         VALUES (
           $1,
           'account_unlinked',
           'Account Unlinked',
           'Unlinked account from ' || $2,
           CURRENT_TIMESTAMP
         )`,
        [user.user_id, siteResult.rows[0].name]
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Site unlinked successfully" });
  } catch (error) {
    console.error("Error unlinking site:", error);
    res.status(500).json({
      error: "Failed to unlink site",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/profile/tip-eligibility
 * Get tip eligibility for the authenticated user.
 */
router.get("/tip-eligibility", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = user.user_id;

    const runewagerLink = await pool.query(
      `SELECT
         uls.identifier_type,
         uls.identifier_value,
         am.slug
       FROM user_linked_sites uls
       JOIN affiliates_master am ON uls.site_id = am.id::text
       WHERE uls.user_id = $1
         AND (am.slug ILIKE '%runewager%' OR am.name ILIKE '%runewager%')
       LIMIT 1`,
      [userId]
    );

    const runewagerEligible =
      runewagerLink.rows.length > 0 &&
      (runewagerLink.rows[0].identifier_type === "username" ||
        runewagerLink.rows[0].identifier_type === "email");

    const allLinkedSites = await pool.query(
      `SELECT
         am.id,
         am.name,
         am.slug,
         uls.identifier_type,
         uls.identifier_value,
         am.sc_allowed,
         am.crypto_allowed
       FROM user_linked_sites uls
       JOIN affiliates_master am ON uls.site_id = am.id::text
       WHERE uls.user_id = $1
       ORDER BY am.name`,
      [userId]
    );

    const otherSites = allLinkedSites.rows.map((site) => ({
      siteId: site.id.toString(),
      siteName: site.name,
      siteSlug: site.slug,
      identifierType: site.identifier_type,
      identifierValue: site.identifier_value,
      scEligible: site.sc_allowed || false,
      cryptoEligible: site.crypto_allowed || false,
      tipEligible:
        (site.sc_allowed || site.crypto_allowed) &&
        (site.identifier_type === "username" ||
          site.identifier_type === "email"),
    }));

    res.status(200).json({
      runewager: runewagerEligible,
      runewagerDetails:
        runewagerLink.rows.length > 0
          ? {
              identifierType: runewagerLink.rows[0].identifier_type,
              identifierValue: runewagerLink.rows[0].identifier_value,
            }
          : null,
      otherSites,
    });
  } catch (error) {
    console.error("Error fetching tip eligibility:", error);
    res.status(500).json({
      error: "Failed to fetch tip eligibility",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
