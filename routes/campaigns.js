const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, logActivity } = require('../middleware/auth');

// Get all campaigns
router.get('/', requireAuth, async (req, res) => {
  try {
    const campaigns = await db.query('SELECT * FROM campaigns ORDER BY created_at DESC');
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single campaign
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const campaign = await db.getById('campaigns', req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create campaign
router.post('/', requireAuth, logActivity('create_campaign', 'campaign'), async (req, res) => {
  try {
    const id = await db.insert('campaigns', req.body);
    const campaign = await db.getById('campaigns', id);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update campaign
router.put('/:id', requireAuth, logActivity('update_campaign', 'campaign'), async (req, res) => {
  try {
    const campaign = await db.getById('campaigns', req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.created_at;

    await db.update('campaigns', req.params.id, updateData);
    const updated = await db.getById('campaigns', req.params.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete campaign
router.delete('/:id', requireAuth, logActivity('delete_campaign', 'campaign'), async (req, res) => {
  try {
    await db.delete('campaigns', req.params.id);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
