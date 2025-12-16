const db = require('./db');
const crypto = require('crypto');

// Affiliates endpoints
exports.getAffiliates = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM affiliates WHERE status="approved"');
  res.json(rows);
};
exports.createAffiliate = async (req, res) => {
  const site = req.body;
  await db.query('INSERT INTO affiliates SET ?', site);
  res.status(201).json({ success: true });
};
exports.updateAffiliate = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  await db.query('UPDATE affiliates SET ? WHERE id=?', [updates, id]);
  res.json({ success: true });
};
exports.deleteAffiliate = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM affiliates WHERE id=?', [id]);
  res.json({ success: true });
};

// Newsletter endpoints
exports.subscribeNewsletter = async (req, res) => {
  const { email, jurisdiction, telegram, cwallet, promooptin } = req.body;
  await db.query('INSERT IGNORE INTO newsletter SET ?', { email, jurisdiction, telegram, cwallet, promooptin });
  res.json({ success: true });
};
exports.dailyCheckin = async (req, res) => {
  const { email } = req.body;
  const today = new Date().toISOString().slice(0,10);
  const [rows] = await db.query('SELECT * FROM newsletter WHERE email=?', [email]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not a subscriber' });
  await db.query('UPDATE newsletter SET last_checkin=? WHERE email=?', [today, email]);
  res.json({ success: true, date: today });
};

// Raffles endpoints
exports.getRaffles = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM raffles');
  res.json(rows);
};
exports.createRaffle = async (req, res) => {
  const { title, prize, description, winners } = req.body;
  await db.query('INSERT INTO raffles SET ?', { title, prize, description, winners, status: 'active' });
  res.status(201).json({ success: true });
};
exports.drawRaffle = async (req, res) => {
  const { id } = req.params;
  const [raffleRows] = await db.query('SELECT * FROM raffles WHERE id=?', [id]);
  if (raffleRows.length === 0) return res.status(404).json({ error: 'Not found' });
  const raffle = raffleRows[0];

  // Pick winners randomly from newsletter who checked in last N days
  const [subs] = await db.query('SELECT * FROM newsletter WHERE last_checkin >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)');
  if (subs.length < raffle.winners) return res.status(400).json({ error: 'Not enough entries.' });
  const shuffled = subs.sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, raffle.winners).map(user => user.email);
  await db.query('UPDATE raffles SET status="completed", winners_list=? WHERE id=?', [JSON.stringify(winners), id]);
  res.json({ success: true, winners });
};
exports.deleteRaffle = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM raffles WHERE id=?', [id]);
  res.json({ success: true });
};