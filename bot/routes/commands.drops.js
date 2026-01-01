import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { getUserProfile } from '../utils/storage.js';
import fetch from 'node-fetch';

const ADMIN_ID = config.TELEGRAM_ADMIN_ID?.toString();
const API_BASE_URL = config.API_BASE_URL || 'https://gamblecodez.com';

// Simple in-memory rate limit for promo intake (per user)
const promoCooldownMs = 3000;
const lastPromoSubmission = new Map();

/**
 * Safe JSON parsing with logging
 */
async function safeJson(response, contextLabel = 'API') {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    logger.error(`${contextLabel} JSON parse error:`, { error: err, body: text });
    throw new Error(`${contextLabel} returned invalid JSON`);
  }
}

/**
 * Truncate text safely for Telegram
 */
function truncate(text, max = 200) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.substring(0, max) + '...';
}

/**
 * Setup Drops-related commands for Telegram bot
 */
export function setupDropsCommands(bot) {
  // ============================================
  // USER COMMANDS
  // ============================================

  // /latest - Get latest drops
  bot.command('latest', async (ctx) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drops/public?limit=10`);

      if (!response.ok) {
        logger.error('Latest drops API error:', response.status, response.statusText);
        return ctx.reply('❌ Error fetching drops. Please try again later.');
      }

      const data = await safeJson(response, 'Latest drops');

      if (!data.promos || data.promos.length === 0) {
        return ctx.reply('📭 No drops available at the moment. Check back soon!');
      }

      let message = '🔥 *Latest Drops*\n\n';
      data.promos.slice(0, 10).forEach((promo, index) => {
        message += `${index + 1}. *${promo.headline || 'Untitled Drop'}*\n`;

        if (promo.description) {
          message += `   ${truncate(promo.description, 140)}\n`;
        }
        if (promo.bonus_code) {
          message += `   🎟️ Code: \`${promo.bonus_code}\`\n`;
        }
        if (promo.promo_url) {
          message += `   🔗 [Link](${promo.promo_url})\n`;
        }
        if (promo.jurisdiction_tags && promo.jurisdiction_tags.length > 0) {
          message += `   📍 ${promo.jurisdiction_tags.join(', ')}\n`;
        }
        message += '\n';
      });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      logger.error('Error fetching latest drops:', error);
      ctx.reply('❌ Error fetching drops. Please try again later.');
    }
  });

  // /usa - Get USA Daily drops
  bot.command('usa', async (ctx) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/drops/public?jurisdiction=USA Daily&limit=10`
      );

      if (!response.ok) {
        logger.error('USA drops API error:', response.status, response.statusText);
        return ctx.reply('❌ Error fetching drops. Please try again later.');
      }

      const data = await safeJson(response, 'USA drops');

      if (!data.promos || data.promos.length === 0) {
        return ctx.reply('📭 No USA Daily drops available at the moment.');
      }

      let message = '🇺🇸 *USA Daily Drops*\n\n';
      data.promos.forEach((promo, index) => {
        message += `${index + 1}. *${promo.headline || 'Untitled Drop'}*\n`;
        if (promo.bonus_code) {
          message += `   🎟️ \`${promo.bonus_code}\`\n`;
        }
        if (promo.promo_url) {
          message += `   🔗 [Link](${promo.promo_url})\n`;
        }
        message += '\n';
      });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      logger.error('Error fetching USA drops:', error);
      ctx.reply('❌ Error fetching drops. Please try again later.');
    }
  });

  // /crypto - Get Crypto Daily drops
  bot.command('crypto', async (ctx) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/drops/public?jurisdiction=Crypto Daily&limit=10`
      );

      if (!response.ok) {
        logger.error('Crypto drops API error:', response.status, response.statusText);
        return ctx.reply('❌ Error fetching drops. Please try again later.');
      }

      const data = await safeJson(response, 'Crypto drops');

      if (!data.promos || data.promos.length === 0) {
        return ctx.reply('📭 No Crypto Daily drops available at the moment.');
      }

      let message = '₿ *Crypto Daily Drops*\n\n';
      data.promos.forEach((promo, index) => {
        message += `${index + 1}. *${promo.headline || 'Untitled Drop'}*\n`;
        if (promo.bonus_code) {
          message += `   🎟️ \`${promo.bonus_code}\`\n`;
        }
        if (promo.promo_url) {
          message += `   🔗 [Link](${promo.promo_url})\n`;
        }
        message += '\n';
      });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      logger.error('Error fetching crypto drops:', error);
      ctx.reply('❌ Error fetching drops. Please try again later.');
    }
  });

  // /casino <name> - Get drops for specific casino
  bot.command('casino', async (ctx) => {
    try {
      const parts = ctx.message.text.split(' ');
      if (parts.length < 2) {
        return ctx.reply('Usage: /casino <casino_name>\nExample: /casino Stake');
      }

      const casinoName = parts.slice(1).join(' ');

      const casinosResponse = await fetch(`${API_BASE_URL}/api/sites`);
      if (!casinosResponse.ok) {
        logger.error('Casino list API error:', casinosResponse.status, casinosResponse.statusText);
        return ctx.reply('❌ Error fetching casino list. Please try again later.');
      }

      const casinosData = await safeJson(casinosResponse, 'Casino list');

      const casino = casinosData.sites?.find((s) =>
        s.name.toLowerCase().includes(casinoName.toLowerCase())
      );

      if (!casino) {
        return ctx.reply(`❌ Casino "${casinoName}" not found.`);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/drops/public?casino_id=${casino.id}&limit=10`
      );

      if (!response.ok) {
        logger.error('Casino drops API error:', response.status, response.statusText);
        return ctx.reply('❌ Error fetching drops. Please try again later.');
      }

      const data = await safeJson(response, 'Casino drops');

      if (!data.promos || data.promos.length === 0) {
        return ctx.reply(`📭 No drops available for ${casino.name} at the moment.`);
      }

      let message = `🎰 *${casino.name} Drops*\n\n`;
      data.promos.forEach((promo, index) => {
        message += `${index + 1}. *${promo.headline || 'Untitled Drop'}*\n`;
        if (promo.bonus_code) {
          message += `   🎟️ \`${promo.bonus_code}\`\n`;
        }
        if (promo.promo_url) {
          message += `   🔗 [Link](${promo.promo_url})\n`;
        }
        message += '\n';
      });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      logger.error('Error fetching casino drops:', error);
      ctx.reply('❌ Error fetching drops. Please try again later.');
    }
  });

  // ============================================
  // PROMO SUBMISSION INTAKE
  // ============================================

  bot.on('text', async (ctx) => {
    // Ignore commands
    if (ctx.message.text.startsWith('/')) return;

    const text = ctx.message.text || '';
    const lower = text.toLowerCase();

    const hasUrl = /https?:\/\/\S+/i.test(text);
    const hasCode =
      /\b[A-Z]{3,15}\d{2,10}\b/.test(text) ||
      /\b[A-Z0-9]{4,20}\b/.test(text);
    const isPromoLike =
      lower.includes('bonus') ||
      lower.includes('code') ||
      lower.includes('promo') ||
      lower.includes('free') ||
      lower.includes('freespin') ||
      lower.includes('welcome');

    // Only submit if it looks like a promo
    if (!hasUrl && !hasCode && !isPromoLike) return;

    const now = Date.now();
    const key = ctx.from.id.toString();
    const last = lastPromoSubmission.get(key) || 0;

    // Basic per-user cooldown
    if (now - last < promoCooldownMs) {
      return; // silently ignore spammy repeats
    }
    lastPromoSubmission.set(key, now);

    const isDM = ctx.chat.type === 'private';
    const source = isDM ? 'telegram_dm' : 'telegram_group';

    try {
      const response = await fetch(`${API_BASE_URL}/api/drops/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          source_channel_id: ctx.chat.id.toString(),
          source_user_id: ctx.from.id.toString(),
          source_username: ctx.from.username || `${ctx.from.first_name || ''}`.trim() || 'unknown',
          raw_text: text,
          metadata: {
            telegram_message_id: ctx.message.message_id,
            telegram_chat_type: ctx.chat.type
          }
        }),
      });

      if (response.ok) {
        await ctx.reply('✅ Thanks! Your promo submission has been received and will be reviewed.');
      } else {
        logger.error('Promo intake API error:', response.status, response.statusText);
        // Don’t spam users with backend details
        await ctx.reply('❌ Error submitting promo. Please try again later.');
      }
    } catch (error) {
      logger.error('Error submitting promo via Telegram:', error);
      // Silent on user side to avoid noise on transient errors
    }
  });

  // ============================================
  // ADMIN COMMANDS
  // ============================================

  // /drops_review - Admin gets pending promo candidates
  bot.command('drops_review', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (userId !== ADMIN_ID) {
      return ctx.reply('❌ Admin only command.');
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/drops/promo-candidates?status=pending&limit=5`
      );

      if (!response.ok) {
        logger.error('Promo candidates API error:', response.status, response.statusText);
        return ctx.reply('❌ Error fetching candidates. Please try again later.');
      }

      const data = await safeJson(response, 'Promo candidates');

      if (!data.candidates || data.candidates.length === 0) {
        return ctx.reply('📭 No pending promo candidates to review.');
      }

      for (const candidate of data.candidates) {
        let message = `📋 *Promo Candidate #${candidate.id}*\n\n`;
        message += `*Headline:* ${candidate.headline || 'Untitled'}\n`;
        if (candidate.description) {
          message += `*Description:* ${truncate(candidate.description, 260)}\n`;
        }
        if (candidate.bonus_code) {
          message += `*Code:* \`${candidate.bonus_code}\`\n`;
        }
        if (candidate.promo_url) {
          message += `*URL:* ${candidate.promo_url}\n`;
        }
        if (candidate.mapped_casino_name) {
          message += `*Casino:* ${candidate.mapped_casino_name}\n`;
        }
        if (candidate.jurisdiction_tags && candidate.jurisdiction_tags.length > 0) {
          message += `*Jurisdiction:* ${candidate.jurisdiction_tags.join(', ')}\n`;
        }
        message += `*Source:* ${candidate.source} (${candidate.source_username || 'unknown'})\n`;
        if (typeof candidate.confidence_score === 'number') {
          message += `*Confidence:* ${(candidate.confidence_score * 100).toFixed(0)}%\n\n`;
        } else {
          message += '\n';
        }
        message += `*Raw Text:*\n${truncate(candidate.raw_text, 400)}`;

        const keyboard = {
          inline_keyboard: [
            [
              { text: '✅ Approve', callback_data: `drops_approve_${candidate.id}` },
              { text: '✏️ Edit & Approve', callback_data: `drops_edit_${candidate.id}` }
            ],
            [
              { text: '❌ Deny', callback_data: `drops_deny_${candidate.id}` },
              { text: '🚫 Mark Non-Promo', callback_data: `drops_nonpromo_${candidate.id}` }
            ],
            [
              { text: '🏷️ Tag Casino', callback_data: `drops_tag_casino_${candidate.id}` },
              { text: '📍 Tag Jurisdiction', callback_data: `drops_tag_jurisdiction_${candidate.id}` }
            ],
            [
              { text: '🔗 Open in Admin Panel', url: `${API_BASE_URL}/admin/drops?candidate=${candidate.id}` }
            ]
          ]
        };

        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
          disable_web_page_preview: true
        });
      }

      if (data.total > data.candidates.length) {
        await ctx.reply(`📊 Showing ${data.candidates.length} of ${data.total} pending candidates.`);
      }
    } catch (error) {
      logger.error('Error fetching promo candidates:', error);
      ctx.reply('❌ Error fetching candidates. Please try again later.');
    }
  });

  // Handle callback queries for admin actions
  bot.action(/^drops_(approve|deny|nonpromo|edit|tag_casino|tag_jurisdiction)_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id.toString();
    if (userId !== ADMIN_ID) {
      return ctx.answerCbQuery('❌ Admin only action.');
    }

    const action = ctx.match[1];
    const candidateId = ctx.match[2];

    try {
      if (action === 'approve') {
        const response = await fetch(
          `${API_BASE_URL}/api/drops/promo-candidates/${candidateId}/approve`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId
            }
          }
        );

        if (response.ok) {
          await ctx.answerCbQuery('✅ Promo approved!');
          // Some messages may be Markdown; keep it simple and append a note
          const original = ctx.callbackQuery.message.text || ctx.callbackQuery.message.caption || '';
          await ctx.editMessageText(`${original}\n\n✅ APPROVED`);
        } else {
          await ctx.answerCbQuery('❌ Error approving promo');
        }
      } else if (action === 'deny') {
        await ctx.answerCbQuery('Provide reason in admin panel');
        await ctx.reply('To deny a promo, please use the admin panel to provide a reason.');
      } else if (action === 'nonpromo') {
        const response = await fetch(
          `${API_BASE_URL}/api/drops/promo-candidates/${candidateId}/mark-non-promo`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId
            }
          }
        );

        if (response.ok) {
          await ctx.answerCbQuery('✅ Marked as non-promo');
          const original = ctx.callbackQuery.message.text || ctx.callbackQuery.message.caption || '';
          await ctx.editMessageText(`${original}\n\n🚫 MARKED AS NON-PROMO`);
        } else {
          await ctx.answerCbQuery('❌ Error marking as non-promo');
        }
      } else {
        await ctx.answerCbQuery('Use the admin panel for this action');
      }
    } catch (error) {
      logger.error('Error handling admin action:', error);
      await ctx.answerCbQuery('❌ Error processing action');
    }
  });
}
