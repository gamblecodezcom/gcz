const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Get dashboard stats
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const totalsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM affiliates) as total_affiliates,
        (SELECT COUNT(*) FROM affiliates WHERE status = 'active') as active_affiliates,
        (SELECT COUNT(*) FROM conversions) as total_conversions,
        (SELECT COALESCE(SUM(revenue), 0) FROM affiliates) as total_revenue,
        (SELECT COUNT(*) FROM payouts WHERE status = 'calculated') as pending_payouts,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'active') as active_campaigns,
        (SELECT COUNT(*) FROM newsletter_subscriptions) as newsletter_count,
        (SELECT COUNT(*) FROM ads WHERE is_active = true) as active_ads
    `);
    const totals = totalsResult[0] || {};

    const recentActivity = await db.query(`
      SELECT 
        'conversion' as type,
        c.id,
        c.occurred_at as timestamp,
        a.name as affiliate_name,
        c.amount,
        c.status
      FROM conversions c
      LEFT JOIN affiliates a ON c.affiliate_id = a.id
      ORDER BY c.occurred_at DESC
      LIMIT 10
    `);

    res.json({ 
      success: true, 
      data: { 
        totals,
        recentActivity 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get affiliate performance
router.get('/affiliates/:id/performance', requireAuth, async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_conversions,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(AVG(amount), 0) as avg_conversion_value
      FROM conversions
      WHERE affiliate_id = $1 AND status = 'approved'
    `, [req.params.id]);
    const stats = statsResult[0] || {};

    const monthly = await db.query(`
      SELECT 
        TO_CHAR(occurred_at, 'YYYY-MM') as month,
        COUNT(*) as conversions,
        COALESCE(SUM(amount), 0) as revenue
      FROM conversions
      WHERE affiliate_id = $1 AND status = 'approved'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, [req.params.id]);

    res.json({ 
      success: true, 
      data: { 
        summary: stats,
        monthly 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
