import { Telegraf } from 'telegraf';

/**
 * Auto-response command loader
 * Clean, safe, and non-looping.
 */
export function setupAutoResponseCommands(bot) {
  if (!(bot instanceof Telegraf)) {
    throw new Error('Bot instance invalid');
  }

  /**
   * Auto-response trigger:
   * - Ignores bot messages
   * - Ignores commands (/start, /help, etc.)
   * - Ignores its own replies
   * - Only fires on normal user text
   * - Prevents infinite loops in groups
   */
  bot.on('text', async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text) return;

    // Ignore commands
    if (text.startsWith('/')) return;

    // Ignore bot messages
    if (ctx.from?.is_bot) return;

    // Ignore replies to the bot
    if (ctx.message?.reply_to_message?.from?.is_bot) return;

    // Optional: Only trigger on promo-like messages
    const lower = text.toLowerCase();
    const looksPromo =
      lower.includes('bonus') ||
      lower.includes('code') ||
      lower.includes('promo') ||
      lower.includes('free') ||
      lower.includes('spin') ||
      /https?:\/\/\S+/i.test(text);

    if (!looksPromo) return;

    await ctx.reply("Auto-response is active.");
  });

  console.log('[OK] AutoResponse commands loaded');
}