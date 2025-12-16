const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, logActivity } = require('../middleware/auth');

// Get all broadcasts
router.get('/', requireAuth, async (req, res) => {
  try {
    const broadcasts = await db.query('SELECT * FROM broadcasts ORDER BY created_at DESC');
    res.json({ success: true, data: broadcasts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create broadcast
router.post('/', requireAuth, logActivity('create_broadcast', 'broadcast'), async (req, res) => {
  try {
    const { title, body_html, scope, media, buttons, schedule_at } = req.body;

    const id = await db.insert('broadcasts', {
      created_by: req.session.username,
      title,
      body_html,
      scope,
      media: media ? JSON.stringify(media) : null,
      buttons: buttons ? JSON.stringify(buttons) : null,
      status: schedule_at ? 'scheduled' : 'draft',
      schedule_at: schedule_at || null
    });

    const broadcast = await db.getById('broadcasts', id);
    res.status(201).json({ success: true, data: broadcast });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send broadcast immediately
router.post('/:id/send', requireAuth, logActivity('send_broadcast', 'broadcast'), async (req, res) => {
  try {
    const broadcast = await db.getById('broadcasts', req.params.id);
    if (!broadcast) {
      return res.status(404).json({ success: false, message: 'Broadcast not found' });
    }

    // TODO: Actually send via Telegram bot
    // This would trigger the bot to send the message

    await db.update('broadcasts', req.params.id, {
      status: 'sent',
      sent_at: new Date()
    });

    const updated = await db.getById('broadcasts', req.params.id);
    res.json({ success: true, data: updated, message: 'Broadcast sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update broadcast
router.put('/:id', requireAuth, logActivity('update_broadcast', 'broadcast'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.created_at;

    await db.update('broadcasts', req.params.id, updateData);
    const updated = await db.getById('broadcasts', req.params.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete broadcast
router.delete('/:id', requireAuth, logActivity('delete_broadcast', 'broadcast'), async (req, res) => {
  try {
    await db.delete('broadcasts', req.params.id);
    res.json({ success: true, message: 'Broadcast deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
