require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== ENV VALIDATION ==========
const REQUIRED_ENV = ['SESSION_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'WEBAPP_BASE_URL', 'TELEGRAM_BOT_TOKEN'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`❌ Missing environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// ========== MIDDLEWARE ==========
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

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000 // 24h
  }
}));

// ========== STATIC ADMIN PANEL ==========
app.use(express.static(path.join(__dirname, 'admin')));

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== AUTH ROUTES ==========
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    req.session.username = username;
    return res.json({ success: true, message: 'Login successful' });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out' });
  });
});

app.get('/api/session', (req, res) => {
  res.json({
    authenticated: !!req.session.authenticated,
    username: req.session.username || null
  });
});

// ========== API ROUTES ==========
app.use('/api/affiliates', require('./api/routes/affiliates'));
app.use('/api/campaigns', require('./api/routes/campaigns'));
app.use('/api/conversions', require('./api/routes/conversions'));
app.use('/api/payouts', require('./api/routes/payouts'));
app.use('/api/broadcasts', require('./api/routes/broadcasts'));
app.use('/api/autoresponses', require('./api/routes/autoresponses'));
app.use('/api/settings', require('./api/routes/settings'));
app.use('/api/stats', require('./api/routes/stats'));

// ========== TELEGRAM BOT ==========
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
require('./bot/bot')(bot);

// Telegram Webhook
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 GambleCodez Admin API running on port ${PORT}`);
  console.log(`📊 Admin Panel: ${process.env.WEBAPP_BASE_URL}/admin`);
  console.log(`🤖 Telegram Webhook: ${process.env.WEBAPP_BASE_URL}/webhook`);
});

module.exports = app;
