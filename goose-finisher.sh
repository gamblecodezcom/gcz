#!/bin/bash
set -e
echo "=== GCZ Goose Finisher v2 (Super Mode) ==="
[ -f "bot/routes/index.js" ] && sed -i "s/setupAutoResponseCommands/setupAutoResponse/g" bot/routes/index.js || echo "[BOT] index.js missing"
if [ -f "routes/api.js" ]; then grep -q "router.get('/drops'" routes/api.js && echo "[API] drops exists" || cat << 'EOR' >> routes/api.js

router.get('/drops', async (req, res) => {
  try {
    const drops = await db.query('SELECT * FROM drops ORDER BY created_at DESC LIMIT 50');
    res.json(drops.rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load drops' });
  }
});
EOR
else echo "[API] routes/api.js missing"; fi
[ -f "front/DegenWheel.jsx" ] && echo "[WHEEL] Edit front/DegenWheel.jsx + DegenWheel.css manually: gold=0.0001 + scale(0.5)"
[ -d "frontend" ] && cd frontend && npm run build && cd .. || echo "[FRONTEND] missing"
[ -d "frontend/dist" ] && rm -rf public/assets && mkdir -p public && cp -r frontend/dist/assets public/ && cp frontend/dist/index.html public/index.html || echo "[DEPLOY] dist missing"
pm2 restart all || true
pm2 status
curl -fsS https://gamblecodez.com/api/health || echo "API health failed"
curl -fsS https://gamblecodez.com || echo "Frontend failed"
echo "=== Goose Finisher v2 COMPLETE ==="
