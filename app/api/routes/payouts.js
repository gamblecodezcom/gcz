const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, logActivity } = require('../middleware/auth');

// Get all payouts
router.get('/', requireAuth, async (req, res) => {
  try {
    const sql = `
      SELECT p.*, a.name as affiliate_name, a.email as affiliate_email
      FROM payouts p
      LEFT JOIN affiliates a ON p.affiliate_id = a.id
      ORDER BY p.created_at DESC
    `;
    const payouts = await db.query(sql);
    res.json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calculate payouts for period
router.post('/calculate', requireAuth, logActivity('calculate_payouts', 'payout'), async (req, res) => {
  try {
    const { period_start, period_end } = req.body;

    // Get approved conversions for period
    const sql = `
      SELECT affiliate_id, SUM(amount) as total
      FROM conversions
      WHERE status = 'approved' 
      AND occurred_at >= ? 
      AND occurred_at <= ?
      GROUP BY affiliate_id
    `;
    const results = await db.query(sql, [period_start, period_end]);

    const payouts = [];
    for (const row of results) {
      const id = await db.insert('payouts', {
        affiliate_id: row.affiliate_id,
        period_start,
        period_end,
        gross: row.total,
        fees: 0,
        net: row.total,
        status: 'calculated'
      });
      payouts.push(await db.getById('payouts', id));
    }

    res.json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve payout
router.patch('/:id/approve', requireAuth, logActivity('approve_payout', 'payout'), async (req, res) => {
  try {
    await db.update('payouts', req.params.id, {
      status: 'approved',
      approved_at: new Date(),
      approved_by: req.session.username
    });

    const updated = await db.getById('payouts', req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark as paid
router.patch('/:id/paid', requireAuth, logActivity('mark_payout_paid', 'payout'), async (req, res) => {
  try {
    await db.update('payouts', req.params.id, {
      status: 'paid',
      paid_at: new Date()
    });

    const updated = await db.getById('payouts', req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
