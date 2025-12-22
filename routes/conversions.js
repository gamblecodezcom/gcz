const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, logActivity } = require('../middleware/auth');

// Get all conversions
router.get('/', requireAuth, async (req, res) => {
  try {
    const sql = `
      SELECT c.*, a.name as affiliate_name, cam.name as campaign_name
      FROM conversions c
      LEFT JOIN affiliates a ON c.affiliate_id = a.id
      LEFT JOIN campaigns cam ON c.campaign_id = cam.id
      ORDER BY c.occurred_at DESC
    `;
    const conversions = await db.query(sql);
    res.json({ success: true, data: conversions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve conversion
router.patch('/:id/approve', requireAuth, logActivity('approve_conversion', 'conversion'), async (req, res) => {
  try {
    await db.update('conversions', req.params.id, {
      status: 'approved',
      approved_at: new Date(),
      approved_by: req.session.username
    });

    // Update affiliate conversion count and revenue
    const conversion = await db.getById('conversions', req.params.id);
    await db.query(
      'UPDATE affiliates SET conversions = conversions + 1, revenue = revenue + ? WHERE id = ?',
      [conversion.amount, conversion.affiliate_id]
    );

    const updated = await db.getById('conversions', req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject conversion
router.patch('/:id/reject', requireAuth, logActivity('reject_conversion', 'conversion'), async (req, res) => {
  try {
    await db.update('conversions', req.params.id, {
      status: 'rejected',
      approved_at: new Date(),
      approved_by: req.session.username
    });

    const updated = await db.getById('conversions', req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
