const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin, logActivity } = require('../middleware/auth');

// Get current Top Pick configuration
router.get('/', async (req, res) => {
  try {
    const config = await db.queryOne(
      'SELECT * FROM top_pick_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1'
    );
    
    if (!config) {
      return res.json({ success: true, data: null });
    }

    // If affiliate_id exists, fetch affiliate details
    if (config.affiliate_id) {
      const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE id = $1', [config.affiliate_id]);
      config.affiliate = affiliate;
    }

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Top Pick configuration (admin)
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const config = await db.queryOne(
      'SELECT * FROM top_pick_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1'
    );
    
    if (!config) {
      return res.json({ success: true, data: null });
    }

    // Fetch affiliate details
    if (config.affiliate_id) {
      const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE id = $1', [config.affiliate_id]);
      config.affiliate = affiliate;
    }

    // Fetch all affiliates for dropdown
    const affiliates = await db.query('SELECT id, name, handle, slug FROM affiliates WHERE status = $1 ORDER BY name', ['active']);

    res.json({ success: true, data: { config, affiliates } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or update Top Pick configuration
router.post('/', requireAuth, requireAdmin, logActivity('update_top_pick', 'top_pick'), async (req, res) => {
  try {
    const {
      affiliate_id,
      hero_title,
      hero_subtitle,
      background_color,
      background_image_url,
      highlight_color,
      description_blocks,
      bonus_code_section,
      cta_buttons,
      why_section,
      pros_cons_section,
      faq_section
    } = req.body;

    // Deactivate all existing configs
    await db.query('UPDATE top_pick_config SET is_active = false');

    // Insert new config
    const result = await db.query(
      `INSERT INTO top_pick_config (
        affiliate_id, hero_title, hero_subtitle, background_color, background_image_url,
        highlight_color, description_blocks, bonus_code_section, cta_buttons,
        why_section, pros_cons_section, faq_section, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      RETURNING *`,
      [
        affiliate_id || null,
        hero_title || 'Top Pick',
        hero_subtitle || null,
        background_color || '#0a0a0a',
        background_image_url || null,
        highlight_color || '#00eaff',
        description_blocks ? JSON.stringify(description_blocks) : '[]',
        bonus_code_section ? JSON.stringify(bonus_code_section) : '{}',
        cta_buttons ? JSON.stringify(cta_buttons) : '[]',
        why_section ? JSON.stringify(why_section) : '{}',
        pros_cons_section ? JSON.stringify(pros_cons_section) : '{}',
        faq_section ? JSON.stringify(faq_section) : '[]'
      ]
    );

    const config = result[0];
    if (config.affiliate_id) {
      const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE id = $1', [config.affiliate_id]);
      config.affiliate = affiliate;
    }

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Top Pick configuration
router.put('/:id', requireAuth, requireAdmin, logActivity('update_top_pick', 'top_pick'), async (req, res) => {
  try {
    const config = await db.queryOne('SELECT * FROM top_pick_config WHERE id = $1', [req.params.id]);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Top Pick config not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'affiliate_id', 'hero_title', 'hero_subtitle', 'background_color', 'background_image_url',
      'highlight_color', 'description_blocks', 'bonus_code_section', 'cta_buttons',
      'why_section', 'pros_cons_section', 'faq_section', 'is_active'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        if (['description_blocks', 'bonus_code_section', 'cta_buttons', 'why_section', 'pros_cons_section', 'faq_section'].includes(field)) {
          values.push(JSON.stringify(req.body[field]));
        } else {
          values.push(req.body[field]);
        }
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, data: config });
    }

    values.push(req.params.id);
    const sql = `UPDATE top_pick_config SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(sql, values);

    const updated = result[0];
    if (updated.affiliate_id) {
      const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE id = $1', [updated.affiliate_id]);
      updated.affiliate = affiliate;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
