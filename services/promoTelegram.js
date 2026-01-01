import { Telegraf } from 'telegraf';
import { logger } from '../bot/utils/logger.js';

let telegramBot = null;

export function initializeTelegramBot(botInstance) {
  telegramBot = botInstance;
}

export async function distributePromoToTelegram(promo) {
  if (!telegramBot) {
    logger.warn('Telegram bot not initialized, cannot distribute promo');
    return false;
  }

  try {
    const channelId = process.env.TELEGRAM_DAILIES_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID;
    
    if (!channelId) {
      logger.error('TELEGRAM_DAILIES_CHANNEL_ID not configured');
      return false;
    }

    // Build message
    let message = promo.clean_text || promo.content;
    
    // Add affiliate link if available
    if (promo.affiliate_id && promo.affiliate_url) {
      const affiliateBaseUrl = process.env.AFFILIATE_BASE_URL || 'https://gamblecodez.com';
      const affiliatePath = process.env.AFFILIATE_DEFAULT_REDIRECT || '/redirect';
      const affiliateLink = `${affiliateBaseUrl}${affiliatePath}/${promo.affiliate_name || promo.affiliate_id}`;
      
      message += `\n\n🔗 Not yet signed up? ${affiliateLink}`;
    }

    // Send to Telegram channel
    await telegramBot.telegram.sendMessage(channelId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    });

    logger.info(`Promo #${promo.id} distributed to Telegram channel ${channelId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to distribute promo to Telegram: ${error.message}`);
    return false;
  }
}

// Set up global handler for promo approval
export function setupPromoHandler() {
  global.promoApprovedHandler = async (promo) => {
    await distributePromoToTelegram(promo);
  };
}
