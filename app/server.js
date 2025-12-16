require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.WEBAPP_BASE_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'gamblecodez-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static admin panel
app.use(express.static(path.join(__dirname, 'admin')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out' });
});

app.get('/api/session', (req, res) => {
  res.json({ 
    authenticated: !!req.session.authenticated,
    username: req.session.username || null
  });
});

// ============================================================================
// API ROUTES (Import from routes folder)
// ============================================================================

const affiliatesRoutes = require('./api/routes/affiliates');
const campaignsRoutes = require('./api/routes/campaigns');
const conversionsRoutes = require('./api/routes/conversions');
const payoutsRoutes = require('./api/routes/payouts');
const broadcastsRoutes = require('./api/routes/broadcasts');
const autoresponsesRoutes = require('./api/routes/autoresponses');
const settingsRoutes = require('./api/routes/settings');
const statsRoutes = require('./api/routes/stats');

app.use('/api/affiliates', affiliatesRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/conversions', conversionsRoutes);
app.use('/api/payouts', payoutsRoutes);
app.use('/api/broadcasts', broadcastsRoutes);
app.use('/api/autoresponses', autoresponsesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

// ============================================================================
// TELEGRAM WEBHOOK
// ============================================================================

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Import bot handlers
require('./bot/bot')(bot);

// Webhook endpoint
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 GambleCodez Admin API running on port ${PORT}`);
  console.log(`📊 Admin Panel: ${process.env.WEBAPP_BASE_URL}/admin`);
  console.log(`🤖 Telegram Webhook: ${process.env.WEBAPP_BASE_URL}/webhook`);
});

module.exports = app;
