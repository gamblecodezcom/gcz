const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, logActivity } = require('../middleware/auth');

// Get all settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await db.query('SELECT * FROM settings');
    const result = {};
    settings.forEach(s => {
      result[s.k] = JSON.parse(s.v);
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific setting
router.get('/:key', requireAuth, async (req, res) => {
  try {
    const setting = await db.queryOne('SELECT * FROM settings WHERE k = ?', [req.params.key]);
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }
    res.json({ success: true, data: JSON.parse(setting.v) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update setting
router.put('/:key', requireAuth, logActivity('update_setting', 'setting'), async (req, res) => {
  try {
    const { value } = req.body;

    await db.query(
      'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = ?',
      [req.params.key, JSON.stringify(value), JSON.stringify(value)]
    );

    const updated = await db.queryOne('SELECT * FROM settings WHERE k = ?', [req.params.key]);
    res.json({ success: true, data: JSON.parse(updated.v) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get feature flags
router.get('/features/flags', requireAuth, async (req, res) => {
  try {
    const setting = await db.queryOne('SELECT v FROM settings WHERE k = "feature_flags"');
    res.json({ success: true, data: setting ? JSON.parse(setting.v) : {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update feature flag
router.patch('/features/:flag', requireAuth, logActivity('toggle_feature', 'setting'), async (req, res) => {
  try {
    const { enabled } = req.body;

    const setting = await db.queryOne('SELECT v FROM settings WHERE k = "feature_flags"');
    const flags = setting ? JSON.parse(setting.v) : {};
    flags[req.params.flag] = enabled;

    await db.query(
      'INSERT INTO settings (k, v) VALUES ("feature_flags", ?) ON DUPLICATE KEY UPDATE v = ?',
      [JSON.stringify(flags), JSON.stringify(flags)]
    );

    res.json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
