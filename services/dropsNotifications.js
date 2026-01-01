import pool from '../utils/db.js';
import { logger } from '../bot/utils/logger.js';

/**
 * Drops Notification Service
 * Handles sending notifications for new drop promos via Telegram, Email, and Push
 */

/**
 * Get users who should receive drop notifications
 */
async function getNotificationRecipients(jurisdictionTags = []) {
  try {
    let query = `
      SELECT DISTINCT
        u.user_id,
        u.email,
        u.telegram_id,
        uns.drops_enabled,
        uns.drops_telegram,
        uns.drops_email,
        uns.drops_push,
        uns.drops_frequency
      FROM users u
      LEFT JOIN user_notification_settings uns ON u.user_id = uns.user_id
      WHERE (uns.drops_enabled IS NULL OR uns.drops_enabled = true)
        AND (
          uns.drops_telegram = true OR
          uns.drops_email = true OR
          uns.drops_push = true
        )
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('Error getting notification recipients:', error);
    return [];
  }
}

/**
 * Format drop promo for notification
 */
function formatDropNotification(promo) {
  const parts = [];
  
  if (promo.headline) {
    parts.push(`🎯 ${promo.headline}`);
  }
  
  if (promo.description) {
    parts.push(`\n${promo.description}`);
  }
  
  if (promo.bonus_code) {
    parts.push(`\n\n💎 Bonus Code: \`${promo.bonus_code}\``);
  }
  
  if (promo.promo_url) {
    parts.push(`\n🔗 ${promo.promo_url}`);
  }
  
  if (promo.casino_name) {
    parts.push(`\n🏰 ${promo.casino_name}`);
  }
  
  if (promo.jurisdiction_tags && promo.jurisdiction_tags.length > 0) {
    parts.push(`\n📍 ${promo.jurisdiction_tags.join(', ')}`);
  }
  
  if (promo.quick_signup_url) {
    parts.push(`\n⚡ Quick Signup: ${promo.quick_signup_url}`);
  }
  
  return parts.join('');
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(userId, telegramId, promo) {
  try {
    // Import telegram bot client
    const { default: bot } = await import('../bot/client.js');
    
    if (!bot || !telegramId) {
      return false;
    }
    
    const message = formatDropNotification(promo);
    
    await bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });
    
    // Log notification sent
    await pool.query(
      `INSERT INTO drop_notifications_sent (
        drop_promo_id, user_id, channel, meta
      ) VALUES ($1, $2, $3, $4)`,
      [
        promo.id,
        userId,
        'telegram',
        JSON.stringify({ telegram_id: telegramId })
      ]
    );
    
    return true;
  } catch (error) {
    logger.error(`Error sending Telegram notification to ${userId}:`, error);
    return false;
  }
}

/**
 * Send Email notification
 */
async function sendEmailNotification(userId, email, promo) {
  try {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just log it
    logger.info(`Would send email to ${email} for promo ${promo.id}`);
    
    // Log notification sent
    await pool.query(
      `INSERT INTO drop_notifications_sent (
        drop_promo_id, user_id, channel, meta
      ) VALUES ($1, $2, $3, $4)`,
      [
        promo.id,
        userId,
        'email',
        JSON.stringify({ email })
      ]
    );
    
    return true;
  } catch (error) {
    logger.error(`Error sending email notification to ${userId}:`, error);
    return false;
  }
}

/**
 * Send Push notification
 */
async function sendPushNotification(userId, promo) {
  try {
    // TODO: Integrate with push notification service (FCM, OneSignal, etc.)
    // For now, just log it
    logger.info(`Would send push notification to ${userId} for promo ${promo.id}`);
    
    // Log notification sent
    await pool.query(
      `INSERT INTO drop_notifications_sent (
        drop_promo_id, user_id, channel, meta
      ) VALUES ($1, $2, $3, $4)`,
      [
        promo.id,
        userId,
        'push',
        JSON.stringify({})
      ]
    );
    
    return true;
  } catch (error) {
    logger.error(`Error sending push notification to ${userId}:`, error);
    return false;
  }
}

/**
 * Send notifications for a new drop promo
 */
export async function notifyNewDrop(promoId) {
  try {
    // Get the full promo details
    const promoResult = await pool.query(
      `SELECT 
        dp.*,
        am.name as casino_name, am.icon_url as casino_logo, am.slug as casino_slug
      FROM drop_promos dp
      LEFT JOIN affiliates_master am ON dp.mapped_casino_id = am.id
      WHERE dp.id = $1 AND dp.status = 'active'`,
      [promoId]
    );
    
    if (promoResult.rows.length === 0) {
      logger.warn(`Promo ${promoId} not found or not active`);
      return;
    }
    
    const promo = promoResult.rows[0];
    
    // Get recipients
    const recipients = await getNotificationRecipients(promo.jurisdiction_tags || []);
    
    logger.info(`Sending drop notifications to ${recipients.length} users for promo ${promoId}`);
    
    // Send notifications based on user preferences
    const results = {
      telegram: 0,
      email: 0,
      push: 0,
      errors: 0
    };
    
    for (const recipient of recipients) {
      try {
        // Check frequency settings (instant, daily, weekly)
        if (recipient.drops_frequency === 'daily') {
          // Check if we already sent today
          const lastSent = await pool.query(
            `SELECT sent_at FROM drop_notifications_sent
             WHERE user_id = $1 AND channel = 'telegram'
             AND sent_at > NOW() - INTERVAL '24 hours'
             LIMIT 1`,
            [recipient.user_id]
          );
          
          if (lastSent.rows.length > 0) {
            continue; // Skip if already sent today
          }
        }
        
        // Send Telegram
        if (recipient.drops_telegram && recipient.telegram_id) {
          const sent = await sendTelegramNotification(
            recipient.user_id,
            recipient.telegram_id,
            promo
          );
          if (sent) results.telegram++;
          else results.errors++;
        }
        
        // Send Email
        if (recipient.drops_email && recipient.email) {
          const sent = await sendEmailNotification(
            recipient.user_id,
            recipient.email,
            promo
          );
          if (sent) results.email++;
          else results.errors++;
        }
        
        // Send Push
        if (recipient.drops_push) {
          const sent = await sendPushNotification(
            recipient.user_id,
            promo
          );
          if (sent) results.push++;
          else results.errors++;
        }
        
        // Update last sent timestamp
        await pool.query(
          `UPDATE user_notification_settings
           SET drops_last_sent = CURRENT_TIMESTAMP
           WHERE user_id = $1`,
          [recipient.user_id]
        );
        
      } catch (error) {
        logger.error(`Error sending notification to ${recipient.user_id}:`, error);
        results.errors++;
      }
    }
    
    logger.info(`Drop notifications sent: ${JSON.stringify(results)}`);
    return results;
    
  } catch (error) {
    logger.error('Error in notifyNewDrop:', error);
    throw error;
  }
}

/**
 * Send notifications for featured drops (higher priority)
 */
export async function notifyFeaturedDrop(promoId) {
  // Same as notifyNewDrop but with higher priority/urgency
  return notifyNewDrop(promoId);
}
