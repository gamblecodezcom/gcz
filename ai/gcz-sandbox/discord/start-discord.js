import('./client.js')
  .then(() => {
    console.log('[GCZ-DISCORD] Client started successfully');
  })
  .catch(err => {
    console.error('[GCZ-DISCORD] Failed to start Discord bot:', err);
    process.exit(1);
  });

// --- SIGNAL HANDLERS ---
process.once('SIGINT', () => {
  console.log('[GCZ-DISCORD] SIGINT received — shutting down');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('[GCZ-DISCORD] SIGTERM received — shutting down');
  process.exit(0);
});
