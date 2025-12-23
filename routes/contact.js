const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin, logActivity } = require('../middleware/auth');

// Submit contact message (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, telegram_handle, cwallet_id, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    const result = await db.query(
      `INSERT INTO contact_messages (name, email, telegram_handle, cwallet_id, subject, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'new')
       RETURNING *`,
      [name, email, telegram_handle || null, cwallet_id || null, subject || null, message]
    );

    res.status(201).json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all contact messages (admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM contact_messages WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = $1';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const messages = await db.query(sql, params);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single contact message
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const message = await db.queryOne('SELECT * FROM contact_messages WHERE id = $1', [req.params.id]);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update contact message status
router.patch('/:id/status', requireAuth, requireAdmin, logActivity('update_contact_status', 'contact'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'in_progress', 'resolved', 'spam'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await db.query(
      'UPDATE contact_messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Convert contact message to affiliate request
router.post('/:id/convert-to-affiliate', requireAuth, requireAdmin, logActivity('convert_contact_to_affiliate', 'contact'), async (req, res) => {
  try {
    const message = await db.queryOne('SELECT * FROM contact_messages WHERE id = $1', [req.params.id]);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    // Mark message as resolved
    await db.query(
      'UPDATE contact_messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['resolved', req.params.id]
    );

    // Return message data for admin to create affiliate manually
    res.json({
      success: true,
      message: 'Contact message marked as resolved. Use the data below to create an affiliate.',
      data: message
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete contact message
router.delete('/:id', requireAuth, requireAdmin, logActivity('delete_contact', 'contact'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM contact_messages WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }
    res.json({ success: true, message: 'Contact message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
