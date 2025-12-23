const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin, logActivity } = require('../middleware/auth');

// Get all ads (public - only active)
router.get('/', async (req, res) => {
  try {
    const ads = await db.query(
      'SELECT * FROM ads WHERE is_active = true ORDER BY weight DESC, created_at DESC'
    );
    res.json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all ads (admin - includes inactive)
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ads = await db.query('SELECT * FROM ads ORDER BY weight DESC, created_at DESC');
    res.json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single ad
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ad = await db.queryOne('SELECT * FROM ads WHERE id = $1', [req.params.id]);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    res.json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create ad
router.post('/', requireAuth, requireAdmin, logActivity('create_ad', 'ad'), async (req, res) => {
  try {
    const {
      title,
      description,
      icon_url,
      background_color,
      glow_color,
      footer_text,
      bonus_code,
      button1_label,
      button1_url,
      button2_label,
      button2_url,
      weight,
      is_active
    } = req.body;

    const result = await db.query(
      `INSERT INTO ads (
        title, description, icon_url, background_color, glow_color,
        footer_text, bonus_code, button1_label, button1_url,
        button2_label, button2_url, weight, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        title,
        description || null,
        icon_url || null,
        background_color || '#1a1a1a',
        glow_color || '#00eaff',
        footer_text || null,
        bonus_code || null,
        button1_label || null,
        button1_url || null,
        button2_label || null,
        button2_url || null,
        weight || 100,
        is_active !== undefined ? is_active : true
      ]
    );

    res.status(201).json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update ad
router.put('/:id', requireAuth, requireAdmin, logActivity('update_ad', 'ad'), async (req, res) => {
  try {
    const ad = await db.queryOne('SELECT * FROM ads WHERE id = $1', [req.params.id]);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'description', 'icon_url', 'background_color', 'glow_color',
      'footer_text', 'bonus_code', 'button1_label', 'button1_url',
      'button2_label', 'button2_url', 'weight', 'is_active'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(req.body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, data: ad });
    }

    values.push(req.params.id);
    const sql = `UPDATE ads SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(sql, values);

    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete ad
router.delete('/:id', requireAuth, requireAdmin, logActivity('delete_ad', 'ad'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM ads WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    res.json({ success: true, message: 'Ad deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
