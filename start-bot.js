// Import bot - it will auto-start via startBot() in client.js
import bot from './bot/client.js';

// Graceful shutdown handlers (bot/client.js already has these, but keeping for compatibility)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
