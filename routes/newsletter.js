const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Subscribe to newsletter (public)
router.post('/', async (req, res) => {
  try {
    const { email, cwallet_id, telegram_handle, source } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if already subscribed
    const existing = await db.queryOne('SELECT * FROM newsletter_subscriptions WHERE email = $1', [email]);
    if (existing) {
      return res.json({ success: true, message: 'Already subscribed', data: existing });
    }

    const result = await db.query(
      `INSERT INTO newsletter_subscriptions (email, cwallet_id, telegram_handle, source)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [email, cwallet_id || null, telegram_handle || null, source || 'website']
    );

    res.status(201).json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all newsletter subscriptions (admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const subscriptions = await db.query('SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC');
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export newsletter as CSV (admin)
router.get('/export/csv', requireAuth, requireAdmin, async (req, res) => {
  try {
    const subscriptions = await db.query('SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC');
    
    const csv = [
      ['Email', 'Cwallet ID', 'Telegram Handle', 'Source', 'Created At'].join(','),
      ...subscriptions.map(sub => [
        sub.email,
        sub.cwallet_id || '',
        sub.telegram_handle || '',
        sub.source || '',
        sub.created_at
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=newsletter_subscriptions.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export newsletter as ZIP (admin) - returns JSON for now, can be enhanced
router.get('/export/zip', requireAuth, requireAdmin, async (req, res) => {
  try {
    const subscriptions = await db.query('SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC');
    res.json({ success: true, data: subscriptions, format: 'json' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
