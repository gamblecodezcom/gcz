if (process.env.DISCORD_READ_ONLY === "true") { try { const Discord = require("discord.js"); const safeSend = () => (console.log("[SANDBOX] Discord send() blocked — READ ONLY MODE"), Promise.resolve()); Discord.TextChannel.prototype.send = safeSend; Discord.ThreadChannel.prototype.send = safeSend; Discord.User.prototype.send = safeSend; console.log("[SANDBOX] Discord READ-ONLY mode active"); } catch(e){ console.error("READ-ONLY hook failed:", e); }}

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
