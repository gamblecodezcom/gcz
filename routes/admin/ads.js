import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configure multer for image uploads
const uploadDir = path.join(__dirname, "../../public/uploads/ads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "ad-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

async function logAdminAction(req, action, resourceType, resourceId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_user, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.headers["x-admin-user"] || "unknown",
        action,
        resourceType,
        resourceId,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || ""
      ]
    );
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

// GET /api/admin/ads - List ads
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ads ORDER BY weight DESC, created_at DESC"
    );
    res.json({ ads: result.rows });
  } catch (error) {
    console.error("Error fetching ads:", error);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

// POST /api/admin/ads - Create ad (with optional image upload)
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    const {
      logo_url,
      site_description,
      bonus_code_description,
      fine_print,
      weight,
      button_url
    } = req.body;

    // Use uploaded file URL or provided URL
    let finalLogoUrl = logo_url;
    if (req.file) {
      finalLogoUrl = `/uploads/ads/${req.file.filename}`;
    }

    if (!finalLogoUrl || !site_description || !button_url) {
      return res.status(400).json({ error: "logo_url, site_description, and button_url are required" });
    }

    const result = await pool.query(
      `INSERT INTO ads (logo_url, site_description, bonus_code_description, fine_print, weight, button_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        finalLogoUrl,
        site_description,
        bonus_code_description || null,
        fine_print || null,
        parseInt(weight) || 1,
        button_url
      ]
    );

    await logAdminAction(req, "CREATE", "ad", result.rows[0].id.toString(), { logo_url: finalLogoUrl });
    res.json({ ad: result.rows[0] });
  } catch (error) {
    console.error("Error creating ad:", error);
    res.status(500).json({ error: "Failed to create ad" });
  }
});

// PUT /api/admin/ads/:id - Update ad (with optional image upload)
router.put("/:id", upload.single("logo"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      logo_url,
      site_description,
      bonus_code_description,
      fine_print,
      weight,
      button_url,
      active
    } = req.body;

    // Use uploaded file URL or provided URL
    let finalLogoUrl = logo_url;
    if (req.file) {
      finalLogoUrl = `/uploads/ads/${req.file.filename}`;
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (finalLogoUrl !== undefined) {
      updates.push(`logo_url = $${paramIndex++}`);
      params.push(finalLogoUrl);
    }
    if (site_description !== undefined) {
      updates.push(`site_description = $${paramIndex++}`);
      params.push(site_description);
    }
    if (bonus_code_description !== undefined) {
      updates.push(`bonus_code_description = $${paramIndex++}`);
      params.push(bonus_code_description);
    }
    if (fine_print !== undefined) {
      updates.push(`fine_print = $${paramIndex++}`);
      params.push(fine_print);
    }
    if (weight !== undefined) {
      updates.push(`weight = $${paramIndex++}`);
      params.push(parseInt(weight));
    }
    if (button_url !== undefined) {
      updates.push(`button_url = $${paramIndex++}`);
      params.push(button_url);
    }
    if (active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      params.push(active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE ads SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ad not found" });
    }

    await logAdminAction(req, "UPDATE", "ad", id, req.body);
    res.json({ ad: result.rows[0] });
  } catch (error) {
    console.error("Error updating ad:", error);
    res.status(500).json({ error: "Failed to update ad" });
  }
});

// DELETE /api/admin/ads/:id - Delete ad
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get ad to delete logo file if it's uploaded
    const adResult = await pool.query("SELECT logo_url FROM ads WHERE id = $1", [id]);
    if (adResult.rows.length > 0 && adResult.rows[0].logo_url?.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "../../public", adResult.rows[0].logo_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const result = await pool.query("DELETE FROM ads WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ad not found" });
    }

    await logAdminAction(req, "DELETE", "ad", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ error: "Failed to delete ad" });
  }
});

export default router;
