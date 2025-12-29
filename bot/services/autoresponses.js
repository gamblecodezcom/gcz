import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

const STORAGE_PATH = path.resolve('bot/storage/autoresponses.json');

// Load or initialize storage
function loadStorage() {
  try {
    if (!fs.existsSync(STORAGE_PATH)) return {};
    return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
  } catch (err) {
    logger.error('Failed to load autoresponses:', err);
    return {};
  }
}

function saveStorage(data) {
  try {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    logger.error('Failed to save autoresponses:', err);
  }
}

let autoresponses = loadStorage();

// Temporary admin setup sessions
const setupSessions = new Map();

/**
 * Admin starts setup by replying to a message:
 * /reply keyword
 */
export function startReplySetup(ctx, keyword) {
  if (!ctx.message.reply_to_message) {
    return ctx.reply('❌ You must reply to a message to create an auto-response.');
  }

  const adminId = ctx.from.id.toString();
  const replied = ctx.message.reply_to_message;

  // Extract content
  const content = {
    text: replied.text || replied.caption || '',
    html: replied.entities || replied.caption_entities ? true : false,
    photo: replied.photo ? replied.photo[replied.photo.length - 1].file_id : null,
    document: replied.document ? replied.document.file_id : null,
    buttons: [],
    visibility: 'everyone', // admin-only | everyone | random
    randomChance: 100
  };

  setupSessions.set(adminId, { keyword, content });

  // Preview
  ctx.reply(
    `📝 *Auto-Response Setup Started*\nKeyword: *${keyword}*\n\n` +
    `Use the buttons below to configure.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👥 Visibility', callback_data: 'ar_visibility' },
            { text: '🔘 Add Button', callback_data: 'ar_add_button' }
          ],
          [
            { text: '💾 Save', callback_data: 'ar_save' },
            { text: '❌ Cancel', callback_data: 'ar_cancel' }
          ]
        ]
      }
    }
  );
}

/**
 * Handle inline button actions during setup
 */
export async function handleSetupAction(bot, ctx) {
  const adminId = ctx.from.id.toString();
  const session = setupSessions.get(adminId);
  if (!session) return ctx.answerCbQuery('No active setup.');

  const { keyword, content } = session;
  const action = ctx.callbackQuery.data;

  if (action === 'ar_visibility') {
    if (content.visibility === 'everyone') content.visibility = 'admin';
    else if (content.visibility === 'admin') content.visibility = 'random';
    else content.visibility = 'everyone';

    return ctx.editMessageText(
      `📝 *Auto-Response Setup*\nKeyword: *${keyword}*\nVisibility: *${content.visibility}*`,
      {
        parse_mode: 'Markdown',
        reply_markup: ctx.callbackQuery.message.reply_markup
      }
    );
  }

  if (action === 'ar_add_button') {
    ctx.answerCbQuery('Send: button text | url');
    session.awaitingButton = true;
    return;
  }

  if (action === 'ar_save') {
    autoresponses[keyword.toLowerCase()] = content;
    saveStorage(autoresponses);
    setupSessions.delete(adminId);

    return ctx.editMessageText(
      `✅ Auto-response saved for keyword: *${keyword}*`,
      { parse_mode: 'Markdown' }
    );
  }

  if (action === 'ar_cancel') {
    setupSessions.delete(adminId);
    return ctx.editMessageText('❌ Setup cancelled.');
  }
}

/**
 * Handle admin sending "button text | url"
 */
export function handleButtonInput(ctx) {
  const adminId = ctx.from.id.toString();
  const session = setupSessions.get(adminId);
  if (!session || !session.awaitingButton) return;

  const text = ctx.message.text;
  if (!text.includes('|')) {
    return ctx.reply('Format: Button Text | https://example.com');
  }

  const [label, url] = text.split('|').map(s => s.trim());
  session.content.buttons.push({ label, url });
  session.awaitingButton = false;

  ctx.reply(`🔘 Button added: ${label} → ${url}`);
}

/**
 * Trigger auto-response when keyword is detected
 */
export async function handleAutoResponse(bot, ctx) {
  if (!ctx.message || !ctx.message.text) return;

  const text = ctx.message.text.toLowerCase();
  const entry = autoresponses[text];
  if (!entry) return;

  // Visibility rules
  if (entry.visibility === 'admin' && ctx.from.id.toString() !== config.TELEGRAM_ADMIN_ID) {
    return;
  }

  if (entry.visibility === 'random') {
    if (Math.random() * 100 > entry.randomChance) return;
  }

  const opts = {
    parse_mode: entry.html ? 'HTML' : undefined,
    reply_markup: entry.buttons.length
      ? {
          inline_keyboard: [
            entry.buttons.map(b => ({ text: b.label, url: b.url }))
          ]
        }
      : undefined
  };

  if (entry.photo) {
    return bot.telegram.sendPhoto(ctx.chat.id, entry.photo, {
      caption: entry.text,
      ...opts
    });
  }

  if (entry.document) {
    return bot.telegram.sendDocument(ctx.chat.id, entry.document, {
      caption: entry.text,
      ...opts
    });
  }

  return ctx.reply(entry.text, opts);
}
