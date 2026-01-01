import fetch from 'node-fetch';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { sanitizeContent, sanitizeMessageContext, looksLikePromo } from '../utils/sanitizer.js';

/**
 * Fetch message context (5 before and 5 after) from Discord channel
 */
async function fetchMessageContext(message, beforeCount = 5, afterCount = 5) {
  try {
    const channel = message.channel;
    
    // Fetch messages before the current message
    const messagesBefore = [];
    try {
      const fetchedBefore = await channel.messages.fetch({ 
        limit: beforeCount + 10, // Fetch extra to account for bot messages
        before: message.id 
      });
      
      // Filter out bot messages and limit to beforeCount
      for (const msg of fetchedBefore.values()) {
        if (!msg.author.bot && messagesBefore.length < beforeCount) {
          messagesBefore.unshift(msg); // Add to beginning to maintain chronological order
        }
      }
    } catch (err) {
      logger.debug(`Error fetching messages before: ${err.message}`);
    }
    
    // For messages after, we need to fetch newer messages
    // Note: Discord.js doesn't have a direct "after" parameter, so we'll fetch recent messages
    // and filter. This is less efficient but necessary.
    const messagesAfter = [];
    try {
      // Fetch recent messages and find ones after our message
      const fetchedRecent = await channel.messages.fetch({ 
        limit: 50 // Fetch a batch to find messages after
      });
      
      // Find messages that come after our message (newer timestamp)
      const messageTimestamp = message.createdTimestamp;
      const afterMessages = Array.from(fetchedRecent.values())
        .filter(msg => 
          msg.createdTimestamp > messageTimestamp && 
          !msg.author.bot &&
          msg.id !== message.id
        )
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp) // Sort chronologically
        .slice(0, afterCount);
      
      messagesAfter.push(...afterMessages);
    } catch (err) {
      logger.debug(`Error fetching messages after: ${err.message}`);
    }
    
    return {
      before: messagesBefore,
      after: messagesAfter
    };
  } catch (error) {
    logger.error(`Error fetching message context: ${error.message}`);
    return { before: [], after: [] };
  }
}

export async function handleMessage(message, channel) {
  // PRIVACY ENFORCEMENT: Never log or store Discord metadata
  const content = message.content.trim();
  
  logger.info(`Processing message from Discord channel ${channel}`);

  // Validate content
  if (!content || content.length === 0) {
    logger.warn('Empty message content, skipping');
    return;
  }

  // Sanitize content immediately (strip Discord metadata)
  const sanitizedContent = sanitizeContent(content);
  
  if (!sanitizedContent || sanitizedContent.length === 0) {
    logger.warn('Message content empty after sanitization, skipping');
    return;
  }

  // For links channel, validate URL
  if (channel === 'links') {
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(sanitizedContent)) {
      logger.warn(`Invalid URL in links channel (sanitized content)`);
      // Optionally send a DM to the user
      try {
        await message.author.send('⚠️ The SC LINKS channel requires a valid URL. Your message was not processed.');
      } catch (err) {
        // User may have DMs disabled
        logger.debug('Could not send DM to user');
      }
      return;
    }
    
    // For links channel: simple submission with sanitized content only
    await submitToIntake(sanitizedContent, channel, null);
    try {
      await message.react('✅');
    } catch (err) {
      logger.debug('Could not react to message');
    }
    return;
  }

  // For codes channel: AI-driven promo detection with context
  if (channel === 'codes') {
    // Fetch context messages (5 before, 5 after)
    const context = await fetchMessageContext(message, 5, 5);
    
    // Sanitize all context messages (strip Discord metadata)
    const sanitizedBefore = sanitizeMessageContext(context.before);
    const sanitizedAfter = sanitizeMessageContext(context.after);
    
    // Check if current message looks like a promo
    const isPromoLike = looksLikePromo(sanitizedContent);
    
    // Also check context for promo-like content
    const contextHasPromo = [
      ...sanitizedBefore,
      ...sanitizedAfter
    ].some(msg => looksLikePromo(msg));
    
    if (isPromoLike || contextHasPromo) {
      // Submit with context
      await submitToIntake(sanitizedContent, channel, {
        messages_before: sanitizedBefore,
        messages_after: sanitizedAfter
      });
      
      try {
        await message.react('✅');
      } catch (err) {
        logger.debug('Could not react to message');
      }
    } else {
      logger.debug('Message does not appear to be a promo, skipping');
    }
    return;
  }
}

/**
 * Submit sanitized content to intake API
 * PRIVACY: Never sends Discord metadata (usernames, user IDs, channel names, etc.)
 */
async function submitToIntake(sanitizedContent, channelType, context = null) {
  const apiUrl = `${config.PROMO_INTAKE_API_URL}/api/drops/intake`;
  
  try {
    const payload = {
      source: 'discord',
      source_channel_id: channelType, // Only channel type, not actual Discord channel ID
      source_user_id: 'discord_user', // Generic identifier, not actual Discord user ID
      source_username: null, // NEVER store Discord usernames
      raw_text: sanitizedContent, // Only sanitized content
      metadata: context ? {
        // Only include sanitized context, no Discord metadata
        messages_before: context.messages_before || [],
        messages_after: context.messages_after || []
      } : {}
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    logger.info(`Successfully created raw drop #${data.raw_drop.id} from ${channelType} channel`);

  } catch (error) {
    logger.error(`Failed to submit raw drop: ${error.message}`);
    throw error;
  }
}
