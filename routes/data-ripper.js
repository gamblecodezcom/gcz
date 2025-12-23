const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin, logActivity } = require('../middleware/auth');

// Get all ripper jobs (admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const jobs = await db.query('SELECT * FROM data_ripper_jobs ORDER BY created_at DESC');
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single ripper job
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const job = await db.queryOne('SELECT * FROM data_ripper_jobs WHERE id = $1', [req.params.id]);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Ripper job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create ripper job
router.post('/', requireAuth, requireAdmin, logActivity('create_ripper_job', 'data_ripper'), async (req, res) => {
  try {
    const { source_url } = req.body;

    if (!source_url) {
      return res.status(400).json({ success: false, message: 'Source URL is required' });
    }

    const result = await db.query(
      `INSERT INTO data_ripper_jobs (source_url, status)
       VALUES ($1, 'pending')
       RETURNING *`,
      [source_url]
    );

    res.status(201).json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update ripper job (for AI review results)
router.put('/:id', requireAuth, requireAdmin, logActivity('update_ripper_job', 'data_ripper'), async (req, res) => {
  try {
    const job = await db.queryOne('SELECT * FROM data_ripper_jobs WHERE id = $1', [req.params.id]);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Ripper job not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['status', 'raw_data', 'ai_review', 'ai_suggestions', 'admin_notes'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        if (['raw_data', 'ai_review', 'ai_suggestions'].includes(field)) {
          values.push(JSON.stringify(req.body[field]));
        } else {
          values.push(req.body[field]);
        }
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, data: job });
    }

    values.push(req.params.id);
    const sql = `UPDATE data_ripper_jobs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(sql, values);

    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Trigger AI review (placeholder - would integrate with AI service)
router.post('/:id/ai-review', requireAuth, requireAdmin, logActivity('trigger_ai_review', 'data_ripper'), async (req, res) => {
  try {
    const job = await db.queryOne('SELECT * FROM data_ripper_jobs WHERE id = $1', [req.params.id]);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Ripper job not found' });
    }

    // TODO: Integrate with AI service to:
    // 1. Compare ripped data to existing affiliates in DB
    // 2. Flag mismatches
    // 3. Suggest improvements
    // 4. Generate unique description text
    // 5. Ensure unique tone per site

    // For now, return a placeholder response
    const aiReview = {
      mismatches: [],
      suggestions: [],
      generated_description: '',
      tone_analysis: {}
    };

    await db.query(
      'UPDATE data_ripper_jobs SET ai_review = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(aiReview), req.params.id]
    );

    res.json({ success: true, message: 'AI review triggered (placeholder)', data: aiReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
