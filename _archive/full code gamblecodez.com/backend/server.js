const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const db = require('./db');
const api = require('./api');

const app = express();
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'GambleCodez2024!';

app.use(cors());
app.use(bodyParser.json());

// Authentication (simple JWT bearer)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  const token = jwt.sign({ admin: true }, ADMIN_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Protected middleware
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], ADMIN_SECRET);
    if (!decoded.admin) throw 'Bad token';
    next();
  } catch {
    res.status(401).json({ error: 'Bad token' });
  }
}

// Public API (Newsletter, Site Cards)
app.get('/api/affiliates', api.getAffiliates);
app.post('/api/newsletter', api.subscribeNewsletter);
app.post('/api/daily-checkin', api.dailyCheckin);
app.get('/api/raffles', api.getRaffles);

// Admin API (protected)
app.post('/api/affiliates', requireAdmin, api.createAffiliate);
app.patch('/api/affiliates/:id', requireAdmin, api.updateAffiliate);
app.delete('/api/affiliates/:id', requireAdmin, api.deleteAffiliate);
app.post('/api/raffles', requireAdmin, api.createRaffle);
app.post('/api/raffles/:id/draw', requireAdmin, api.drawRaffle);
app.delete('/api/raffles/:id', requireAdmin, api.deleteRaffle);

app.listen(3050, () => {
  console.log('GambleCodez backend live on port 3050');
});