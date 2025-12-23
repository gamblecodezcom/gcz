const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin, logActivity } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Get all active public raffles
router.get('/', async (req, res) => {
  try {
    const raffles = await db.query(
      'SELECT * FROM raffles WHERE is_active = true AND is_public = true AND is_hidden = false ORDER BY created_at DESC'
    );
    res.json({ success: true, data: raffles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all raffles (admin)
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const raffles = await db.query('SELECT * FROM raffles ORDER BY created_at DESC');
    
    // Get entry counts for each raffle
    for (const raffle of raffles) {
      const entries = await db.query('SELECT COUNT(*) as count FROM raffle_entries WHERE raffle_id = $1', [raffle.id]);
      raffle.entry_count = parseInt(entries[0]?.count || 0);
    }
    
    res.json({ success: true, data: raffles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single raffle
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const raffle = await db.queryOne('SELECT * FROM raffles WHERE id = $1', [req.params.id]);
    if (!raffle) {
      return res.status(404).json({ success: false, message: 'Raffle not found' });
    }
    
    const entries = await db.query('SELECT * FROM raffle_entries WHERE raffle_id = $1 ORDER BY entry_time DESC', [raffle.id]);
    raffle.entries = entries;
    
    res.json({ success: true, data: raffle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create raffle
router.post('/', requireAuth, requireAdmin, logActivity('create_raffle', 'raffle'), async (req, res) => {
  try {
    const {
      name,
      description,
      prize,
      secret_password,
      start_time,
      end_time,
      is_active,
      is_public,
      is_hidden,
      passcode,
      social_phrase,
      reveal_phrase,
      require_newsletter
    } = req.body;

    let passcode_hash = null;
    if (passcode) {
      passcode_hash = await bcrypt.hash(passcode, 10);
    }

    const result = await db.query(
      `INSERT INTO raffles (
        name, description, prize, secret_password, start_time, end_time,
        is_active, is_public, is_hidden, passcode_hash, social_phrase,
        reveal_phrase, require_newsletter
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name,
        description,
        prize,
        secret_password,
        start_time,
        end_time,
        is_active !== undefined ? is_active : true,
        is_public !== undefined ? is_public : true,
        is_hidden !== undefined ? is_hidden : false,
        passcode_hash,
        social_phrase || null,
        reveal_phrase !== undefined ? reveal_phrase : false,
        require_newsletter !== undefined ? require_newsletter : true
      ]
    );

    res.status(201).json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update raffle
router.put('/:id', requireAuth, requireAdmin, logActivity('update_raffle', 'raffle'), async (req, res) => {
  try {
    const raffle = await db.queryOne('SELECT * FROM raffles WHERE id = $1', [req.params.id]);
    if (!raffle) {
      return res.status(404).json({ success: false, message: 'Raffle not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'description', 'prize', 'secret_password', 'start_time', 'end_time',
      'is_active', 'is_public', 'is_hidden', 'social_phrase', 'reveal_phrase', 'require_newsletter'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(req.body[field]);
        paramIndex++;
      }
    }

    // Handle passcode update
    if (req.body.passcode !== undefined) {
      if (req.body.passcode) {
        const passcode_hash = await bcrypt.hash(req.body.passcode, 10);
        updates.push(`passcode_hash = $${paramIndex}`);
        values.push(passcode_hash);
        paramIndex++;
      } else {
        updates.push(`passcode_hash = $${paramIndex}`);
        values.push(null);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, data: raffle });
    }

    values.push(req.params.id);
    const sql = `UPDATE raffles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(sql, values);

    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pick winner
router.post('/:id/pick-winner', requireAuth, requireAdmin, logActivity('pick_raffle_winner', 'raffle'), async (req, res) => {
  try {
    const raffle = await db.queryOne('SELECT * FROM raffles WHERE id = $1', [req.params.id]);
    if (!raffle) {
      return res.status(404).json({ success: false, message: 'Raffle not found' });
    }

    const entries = await db.query('SELECT * FROM raffle_entries WHERE raffle_id = $1', [req.params.id]);
    if (entries.length === 0) {
      return res.status(400).json({ success: false, message: 'No entries for this raffle' });
    }

    // Randomly pick a winner
    const winner = entries[Math.floor(Math.random() * entries.length)];

    await db.query(
      'UPDATE raffles SET winner_user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [winner.user_id || winner.telegram_user_id, req.params.id]
    );

    res.json({ success: true, data: winner, message: 'Winner picked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get raffle entries
router.get('/:id/entries', requireAuth, requireAdmin, async (req, res) => {
  try {
    const entries = await db.query('SELECT * FROM raffle_entries WHERE raffle_id = $1 ORDER BY entry_time DESC', [req.params.id]);
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete raffle
router.delete('/:id', requireAuth, requireAdmin, logActivity('delete_raffle', 'raffle'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM raffles WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Raffle not found' });
    }
    res.json({ success: true, message: 'Raffle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
