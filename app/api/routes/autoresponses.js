const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, logActivity } = require('../middleware/auth');

// Get all auto-responses
router.get('/', requireAuth, async (req, res) => {
  try {
    const responses = await db.query('SELECT * FROM auto_responses ORDER BY created_at DESC');
    res.json({ success: true, data: responses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create auto-response
router.post('/', requireAuth, logActivity('create_autoresponse', 'autoresponse'), async (req, res) => {
  try {
    const { trigger_type, trigger_value, body_html, match_mode, scope, deliver_mode, media, buttons } = req.body;

    const id = await db.insert('auto_responses', {
      created_by: req.session.username,
      trigger_type,
      trigger_value,
      body_html,
      match_mode: match_mode || 'exact',
      scope: scope || 'any',
      deliver_mode: deliver_mode || 'reply',
      media: media ? JSON.stringify(media) : null,
      buttons: buttons ? JSON.stringify(buttons) : null,
      status: 'active'
    });

    const response = await db.getById('auto_responses', id);
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Trigger already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update auto-response
router.put('/:id', requireAuth, logActivity('update_autoresponse', 'autoresponse'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.created_at;

    await db.update('auto_responses', req.params.id, updateData);
    const updated = await db.getById('auto_responses', req.params.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle status
router.patch('/:id/toggle', requireAuth, logActivity('toggle_autoresponse', 'autoresponse'), async (req, res) => {
  try {
    const response = await db.getById('auto_responses', req.params.id);
    if (!response) {
      return res.status(404).json({ success: false, message: 'Auto-response not found' });
    }

    const newStatus = response.status === 'active' ? 'paused' : 'active';
    await db.update('auto_responses', req.params.id, { status: newStatus });
    const updated = await db.getById('auto_responses', req.params.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete auto-response
router.delete('/:id', requireAuth, logActivity('delete_autoresponse', 'autoresponse'), async (req, res) => {
  try {
    await db.delete('auto_responses', req.params.id);
    res.json({ success: true, message: 'Auto-response deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
