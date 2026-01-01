
// Drops endpoint (auto-added by goose-finisher)
router.get('/drops', async (req, res) => {
  try {
    const drops = await db.query('SELECT * FROM drop_promos ORDER BY created_at DESC LIMIT 50');
    res.json(drops.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load drops' });
  }
});
