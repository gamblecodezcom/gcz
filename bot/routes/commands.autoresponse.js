import path from 'path';
import { Telegraf } from 'telegraf';
import { fileURLToPath } from 'url';
import { setupAutoResponseCommands } from '../services/commands.autoresponse.js';

// Resolve __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to JSON storage file (for validation/debug, not used here directly)
const storagePath = path.resolve(__dirname, '../storage/autoresponses.json');

export default function (bot) {
  if (!(bot instanceof Telegraf)) {
    throw new Error('Bot instance invalid');
  }

  try {
    setupAutoResponseCommands(bot);
    // Logger will be available after import, but this is early initialization
    console.log('[OK] AutoResponse commands loaded');
  } catch (err) {
    console.error('[FAIL] AutoResponse command setup error:', err.message);
    throw err; // Re-throw to prevent silent failures
  }
}