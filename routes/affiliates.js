const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin, logActivity } = require('../middleware/auth');
const { URL } = require('url');

// Helper function to get current Top Pick affiliate ID
async function getCurrentTopPickAffiliateId() {
  const config = await db.queryOne(
    'SELECT affiliate_id FROM top_pick_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1'
  );
  return config?.affiliate_id || null;
}

// Helper function to enrich affiliate with is_current_top_pick
async function enrichAffiliateWithTopPick(affiliate) {
  const topPickId = await getCurrentTopPickAffiliateId();
  return {
    ...affiliate,
    is_current_top_pick: affiliate.id === topPickId
  };
}

// Helper function to enrich multiple affiliates
async function enrichAffiliatesWithTopPick(affiliates) {
  const topPickId = await getCurrentTopPickAffiliateId();
  return affiliates.map(a => ({
    ...a,
    is_current_top_pick: a.id === topPickId
  }));
}

// Helper function to generate slug from name or handle
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

// Helper function to generate icon URL
function generateIconUrl(domain) {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// Get all affiliates
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, region, search } = req.query;
    let sql = 'SELECT * FROM affiliates WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = $' + (params.length + 1);
      params.push(status);
    }
    if (region) {
      sql += ' AND region = $' + (params.length + 1);
      params.push(region);
    }
    if (search) {
      sql += ' AND (LOWER(name) LIKE $' + (params.length + 1) + ' OR LOWER(handle) LIKE $' + (params.length + 1) + ' OR LOWER(tags) LIKE $' + (params.length + 1) + ')';
      const searchTerm = `%${search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY priority DESC, name ASC';
    const affiliates = await db.query(sql, params);
    const enriched = await enrichAffiliatesWithTopPick(affiliates);
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single affiliate
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE id = $1', [req.params.id]);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }
    const enriched = await enrichAffiliateWithTopPick(affiliate);
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create affiliate
router.post('/', requireAdmin, logActivity('create_affiliate', 'affiliate'), async (req, res) => {
  try {
    const {
      name,
      handle,
      email,
      status = 'active',
      region = 'usa',
      tags,
      referral_code,
      referral_url,
      telegram_user_id,
      telegram_username,
      telegram_webapp_url,
      bonus,
      bonus_code,
      priority = 0,
      is_top_pick = false,
      instant_redemption = false,
      kyc_required = true,
      level = 1,
      description,
      features,
      final_redirect_url,
      icon_url
    } = req.body;

    // Generate slug from handle or name
    const slug = handle ? generateSlug(handle) : generateSlug(name);
    
    // Check if slug already exists
    const existing = await db.queryOne('SELECT id FROM affiliates WHERE slug = $1', [slug]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    // Determine final redirect URL
    const finalUrl = final_redirect_url || referral_url;
    const domain = extractDomain(finalUrl);
    
    // Generate icon URL if not provided
    const iconUrl = icon_url || generateIconUrl(domain);

    const result = await db.query(
      `INSERT INTO affiliates (
        name, handle, email, status, region, tags, referral_code, referral_url,
        telegram_user_id, telegram_username, telegram_webapp_url, bonus, bonus_code,
        priority, is_top_pick, instant_redemption, kyc_required, level, description,
        features, slug, final_redirect_url, icon_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        name, handle, email, status, region, tags || null, referral_code, referral_url,
        telegram_user_id || null, telegram_username || null, telegram_webapp_url || null, bonus || null, bonus_code || null,
        priority, is_top_pick, instant_redemption, kyc_required, level, description || null,
        features ? JSON.stringify(features) : null, slug, finalUrl, iconUrl
      ]
    );

    const enriched = await enrichAffiliateWithTopPick(result[0]);
    res.status(201).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update affiliate
router.put('/:id', requireAdmin, logActivity('update_affiliate', 'affiliate'), async (req, res) => {
  try {
    const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE id = $1', [req.params.id]);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'handle', 'email', 'status', 'region', 'tags', 'referral_code', 'referral_url',
      'telegram_user_id', 'telegram_username', 'telegram_webapp_url', 'bonus', 'bonus_code',
      'priority', 'is_top_pick', 'instant_redemption', 'kyc_required', 'level', 'description',
      'features', 'final_redirect_url', 'icon_url'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(field === 'features' && req.body[field] ? JSON.stringify(req.body[field]) : req.body[field]);
        paramIndex++;
      }
    }

    // Regenerate slug if handle or name changed
    if (req.body.handle || req.body.name) {
      const newHandle = req.body.handle || affiliate.handle;
      const newName = req.body.name || affiliate.name;
      const newSlug = generateSlug(newHandle || newName);
      updates.push(`slug = $${paramIndex}`);
      values.push(newSlug);
      paramIndex++;
    }

    // Regenerate icon URL if final_redirect_url changed and icon_url not manually set
    if (req.body.final_redirect_url && !req.body.icon_url) {
      const domain = extractDomain(req.body.final_redirect_url);
      const iconUrl = generateIconUrl(domain);
      if (iconUrl) {
        updates.push(`icon_url = $${paramIndex}`);
        values.push(iconUrl);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, data: affiliate });
    }

    values.push(req.params.id);
    const sql = `UPDATE affiliates SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(sql, values);

    const enriched = await enrichAffiliateWithTopPick(result[0]);
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete affiliate
router.delete('/:id', requireAdmin, logActivity('delete_affiliate', 'affiliate'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM affiliates WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }
    res.json({ success: true, message: 'Affiliate deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle status
router.patch('/:id/status', requireAdmin, logActivity('toggle_affiliate_status', 'affiliate'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await db.query(
      'UPDATE affiliates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    const enriched = await enrichAffiliateWithTopPick(result[0]);
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Regenerate icon URL for affiliate
router.post('/:id/regenerate-icon', requireAdmin, logActivity('regenerate_icon', 'affiliate'), async (req, res) => {
  try {
    const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE id = $1', [req.params.id]);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    const finalUrl = affiliate.final_redirect_url || affiliate.referral_url;
    const domain = extractDomain(finalUrl);
    const iconUrl = generateIconUrl(domain);

    if (!iconUrl) {
      return res.status(400).json({ success: false, message: 'Could not generate icon URL' });
    }

    const result = await db.query(
      'UPDATE affiliates SET icon_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [iconUrl, req.params.id]
    );

    const enriched = await enrichAffiliateWithTopPick(result[0]);
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
