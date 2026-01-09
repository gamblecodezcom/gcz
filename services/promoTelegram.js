import { Telegraf } from 'telegraf';
import { logger } from '../bot/utils/logger.js';
import { formatPromoMessage } from './promoFormatter.js';
import { normalizePromo, ensureRequiredFields } from './promoCanonical.js';

let telegramBot = null;

export function initializeTelegramBot(botInstance) {
  telegramBot = botInstance;
}

export async function distributePromoToTelegram(promo) {
  if (!telegramBot) {
    logger.warn('Telegram bot not initialized, cannot distribute promo');
    return { ok: false, error: 'telegram_not_initialized' };
  }

  try {
    const channelId = process.env.TELEGRAM_DAILIES_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID;
    
    if (!channelId) {
      logger.error('TELEGRAM_DAILIES_CHANNEL_ID not configured');
      return { ok: false, error: 'missing_channel_id' };
    }

    // Build message (AI + fallback rules)
    let affiliateLink = '';
    const canonical = normalizePromo(promo);
    
    // Add affiliate link if available
    if (canonical.affiliate_url) {
      affiliateLink = canonical.affiliate_url;
    } else if (promo.affiliate_id) {
      const affiliateBaseUrl = process.env.AFFILIATE_BASE_URL || 'https://gamblecodez.com';
      const affiliatePath = process.env.AFFILIATE_DEFAULT_REDIRECT || '/redirect';
      affiliateLink = `${affiliateBaseUrl}${affiliatePath}/${promo.affiliate_name || promo.affiliate_id}`;
    }

    const formatted = await formatPromoMessage(promo, affiliateLink);
    let message = formatted?.message || promo.clean_text || promo.content || canonical.description;
    message = ensureRequiredFields(message, canonical, affiliateLink);

    if (!message) {
      logger.error("Promo message empty; aborting send", {
        promo_id: promo.id,
        mode: formatted?.mode || "unknown",
      });
      return { ok: false, error: 'empty_message' };
    }

    // Send to Telegram channel
    const sent = await telegramBot.telegram.sendMessage(channelId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    });

    logger.info(`Promo #${promo.id} distributed to Telegram channel ${channelId}`);
    return {
      ok: true,
      chatId: sent?.chat?.id,
      messageId: sent?.message_id,
      mode: formatted?.mode || 'fallback',
    };
  } catch (error) {
    logger.error(`Failed to distribute promo to Telegram: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

// Set up global handler for promo approval
export function setupPromoHandler() {
  global.promoApprovedHandler = async (promo) => {
    await distributePromoToTelegram(promo);
  };
}
