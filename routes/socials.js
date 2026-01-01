import express from 'express';
import { getSocialsForAPI } from '../utils/socials.js';

const router = express.Router();

// GET /api/socials - Get official socials and links
router.get('/', (req, res) => {
  try {
    const socials = getSocialsForAPI();
    res.json(socials);
  } catch (error) {
    console.error('Error fetching socials:', error);
    res.status(500).json({ error: 'Failed to fetch socials' });
  }
});

export default router;
