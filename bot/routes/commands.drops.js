import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { getUserProfile } from '../utils/storage.js';
import fetch from 'node-fetch';

const ADMIN_ID = config.TELEGRAM_ADMIN_ID?.toString();
const API_BASE_URL = config.API_BASE_URL || 'https://gamblecodez.com';

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
      const data = await response.json();

      if (!data.promos || data.promos.length === 0) {
        return ctx.reply('📭 No drops available at the moment. Check back soon!');
      }

      let message = '🔥 *Latest Drops*\n\n';
      data.promos.slice(0, 10).forEach((promo, index) => {
        message += `${index + 1}. *${promo.headline}*\n`;
        if (promo.description) {
          message += `   ${promo.description.substring(0, 100)}${promo.description.length > 100 ? '...' : ''}\n`;
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

      await ctx.reply(message, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
      logger.error('Error fetching latest drops:', error);
      ctx.reply('❌ Error fetching drops. Please try again later.');
    }
  });

  // /usa - Get USA Daily drops
  bot.command('usa', async (ctx) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drops/public?jurisdiction=USA Daily&limit=10`);
      const data = await response.json();

      if (!data.promos || data.promos.length === 0) {
        return ctx.reply('📭 No USA Daily drops available at the moment.');
      }

      let message = '🇺🇸 *USA Daily Drops*\n\n';
      data.promos.forEach((promo, index) => {
        message += `${index + 1}. *${promo.headline}*\n`;
        if (promo.bonus_code) {
          message += `   🎟️ \`${promo.bonus_code}\`\n`;
        }
        if (promo.promo_url) {
          message += `   🔗 [Link](${promo.promo_url})\n`;
        }
        message += '\n';
      });

      await ctx.reply(message, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
      logger.error('Error fetching USA drops:', error);
      ctx.reply('❌ Error fetching drops. Please try again later.');
    }
  });

  // /crypto - Get Crypto Daily drops
  bot.command('crypto', async (ctx) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drops/public?jurisdiction=Crypto Daily&limit=10`);
      const data = await response.json();

      if (!data.promos || data.promos.length === 0) {
        return ctx.reply('📭 No Crypto Daily drops available at the moment.');
      }

      let message = '₿ *Crypto Daily Drops*\n\n';
      data.promos.forEach((promo, index) => {
        message += `${index + 1}. *${promo.headline}*\n`;
        if (promo.bonus_code) {
          message += `   🎟️ \`${promo.bonus_code}\`\n`;
        }
        if (promo.promo_url) {
          message += `   🔗 [Link](${promo.promo_url})\n`;
        }
        message += '\n';
      });

      await ctx.reply(message, { parse_mode: 'Markdown', disable_web_page_preview: true });
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

      // First, get all casinos to find matching one
      const casinosResponse = await fetch(`${API_BASE_URL}/api/sites`);
      const casinosData = await casinosResponse.json();
      const casino = casinosData.sites?.find(s => 
        s.name.toLowerCase().includes(casinoName.toLowerCase())
      );

      if (!casino) {
        return ctx.reply(`❌ Casino "${casinoName}" not found.`);
      }

      const response = await fetch(`${API_BASE_URL}/api/drops/public?casino_id=${casino.id}&limit=10`);
      const data = await response.json();

      if (!data.promos || data.promos.length === 0) {
        return ctx.reply(`📭 No drops available for ${casino.name} at the moment.`);
      }

      let message = `🎰 *${casino.name} Drops*\n\n`;
      data.promos.forEach((promo, index) => {
        message += `${index + 1}. *${promo.headline}*\n`;
        if (promo.bonus_code) {
          message += `   🎟️ \`${promo.bonus_code}\`\n`;
        }
        if (promo.promo_url) {
          message += `   🔗 [Link](${promo.promo_url})\n`;
        }
        message += '\n';
      });

      await ctx.reply(message, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
      logger.error('Error fetching casino drops:', error);
      ctx.reply('❌ Error fetching drops. Please try again later.');
    }
  });

  // Handle promo submissions via DM or group message
  bot.on('text', async (ctx) => {
    // Only process if it's a DM or group message (not a command)
    if (ctx.message.text.startsWith('/')) {
      return;
    }

    // Check if message contains URLs or looks like a promo
    const text = ctx.message.text;
    const hasUrl = /https?:\/\/.+/i.test(text);
    const hasCode = /\b[A-Z]{3,15}\d{2,10}\b/i.test(text) || /\b[A-Z]{4,20}\b/i.test(text);
    const isPromoLike = text.toLowerCase().includes('bonus') || 
                       text.toLowerCase().includes('code') || 
                       text.toLowerCase().includes('promo');

    // Only submit if it looks like a promo
    if (!hasUrl && !hasCode && !isPromoLike) {
      return;
    }

    // Determine source
    const isDM = ctx.chat.type === 'private';
    const source = isDM ? 'telegram_dm' : 'telegram_group';

    try {
      const response = await fetch(`${API_BASE_URL}/api/drops/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: source,
          source_channel_id: ctx.chat.id.toString(),
          source_user_id: ctx.from.id.toString(),
          source_username: ctx.from.username || ctx.from.first_name,
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
        await ctx.reply('❌ Error submitting promo. Please try again later.');
      }
    } catch (error) {
      logger.error('Error submitting promo via Telegram:', error);
      // Don't spam user with errors
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
      const response = await fetch(`${API_BASE_URL}/api/drops/promo-candidates?status=pending&limit=5`);
      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        return ctx.reply('📭 No pending promo candidates to review.');
      }

      for (const candidate of data.candidates) {
        let message = `📋 *Promo Candidate #${candidate.id}*\n\n`;
        message += `*Headline:* ${candidate.headline}\n`;
        if (candidate.description) {
          message += `*Description:* ${candidate.description}\n`;
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
        message += `*Confidence:* ${(candidate.confidence_score * 100).toFixed(0)}%\n\n`;
        message += `*Raw Text:*\n${candidate.raw_text.substring(0, 200)}${candidate.raw_text.length > 200 ? '...' : ''}`;

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
        await ctx.reply(`\n📊 Showing ${data.candidates.length} of ${data.total} pending candidates.`);
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
        const response = await fetch(`${API_BASE_URL}/api/drops/promo-candidates/${candidateId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          }
        });

        if (response.ok) {
          await ctx.answerCbQuery('✅ Promo approved!');
          await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n✅ *APPROVED*');
        } else {
          await ctx.answerCbQuery('❌ Error approving promo');
        }
      } else if (action === 'deny') {
        await ctx.answerCbQuery('Please provide a reason in the admin panel');
        await ctx.reply('To deny a promo, please use the admin panel to provide a reason.');
      } else if (action === 'nonpromo') {
        const response = await fetch(`${API_BASE_URL}/api/drops/promo-candidates/${candidateId}/mark-non-promo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          }
        });

        if (response.ok) {
          await ctx.answerCbQuery('✅ Marked as non-promo');
          await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n🚫 *MARKED AS NON-PROMO*');
        } else {
          await ctx.answerCbQuery('❌ Error marking as non-promo');
        }
      } else {
        await ctx.answerCbQuery('Please use the admin panel for this action');
      }
    } catch (error) {
      logger.error('Error handling admin action:', error);
      await ctx.answerCbQuery('❌ Error processing action');
    }
  });
}
