import express from "express";
import pool from "../utils/db.js";
import { getUserFromRequest } from "../middleware/userAuth.js";

const router = express.Router();

/**
 * @typedef {Object} Ad
 * @property {string} id
 * @property {'popup'} type
 * @property {string} title
 * @property {string} content
 * @property {string} [imageUrl]
 * @property {string} [linkUrl]
 * @property {number} weight
 */

/**
 * GET /api/ads
 * Get weighted random ad
 * 
 * @route GET /api/ads
 * @returns {Promise<Ad|null>} 200 - Success response with ad or null if none available
 * @returns {Promise<null>} 200 - No ads available (non-critical, returns null)
 */
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.user_id || null;
    
    // Get all active ads
    const result = await pool.query(
      `SELECT 
        id,
        logo_url as "imageUrl",
        site_description as title,
        bonus_code_description as content,
        button_url as "linkUrl",
        weight,
        'popup' as type
       FROM ads 
       WHERE active = true 
       ORDER BY weight DESC`
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    // Weighted random selection
    const totalWeight = result.rows.reduce((sum, ad) => sum + (ad.weight || 1), 0);
    let random = Math.random() * totalWeight;
    let selectedAd = null;
    
    for (const ad of result.rows) {
      random -= ad.weight || 1;
      if (random <= 0) {
        selectedAd = ad;
        break;
      }
    }
    
    // Fallback to first ad if selection failed
    if (!selectedAd) {
      selectedAd = result.rows[0];
    }
    
    // Log impression if user is logged in
    if (userId) {
      try {
        await pool.query(
          "INSERT INTO ad_impressions (campaign_id, user_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)",
          [selectedAd.id, userId]
        );
      } catch (error) {
        // Non-critical, continue
        console.error("Error logging ad impression:", error);
      }
    }
    
    res.status(200).json({
      id: selectedAd.id.toString(),
      type: selectedAd.type || "popup",
      title: selectedAd.title,
      content: selectedAd.content || "",
      imageUrl: selectedAd.imageUrl || undefined,
      linkUrl: selectedAd.linkUrl || undefined,
      weight: selectedAd.weight || 1,
    });
  } catch (error) {
    console.error("Error fetching ad:", error);
    res.status(200).json(null); // Return null on error (non-critical)
  }
});

/**
 * POST /api/ads/:id/click
 * Track ad click
 * 
 * @route POST /api/ads/:id/click
 * @param {string} req.params.id - Ad campaign ID
 * @returns {Promise<{success: boolean}>} 200 - Success response (non-critical)
 */
router.post("/:id/click", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.user_id || null;
    const { id } = req.params;
    
    if (userId) {
      await pool.query(
        "INSERT INTO ad_clicks (campaign_id, user_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)",
        [id, userId]
      );
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error tracking ad click:", error);
    res.status(200).json({ success: true }); // Non-critical
  }
});

export default router;
