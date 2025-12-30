import fetch from 'node-fetch';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export async function handleMessage(message, channel) {
  const content = message.content.trim();
  const submittedBy = message.author.id;
  const username = message.author.username;
  const channelName = message.channel.name;

  logger.info(`Processing message from ${username} in ${channelName} channel`);

  // Validate content
  if (!content || content.length === 0) {
    logger.warn('Empty message content, skipping');
    return;
  }

  // For links channel, validate URL
  if (channel === 'links') {
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(content)) {
      logger.warn(`Invalid URL in links channel: ${content}`);
      // Optionally send a DM to the user
      try {
        await message.author.send('⚠️ The SC LINKS channel requires a valid URL. Your message was not processed.');
      } catch (err) {
        // User may have DMs disabled
        logger.debug('Could not send DM to user');
      }
      return;
    }
  }

  // Submit to backend API (new Drops ecosystem)
  const apiUrl = `${config.PROMO_INTAKE_API_URL}/api/drops/intake`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'discord',
        source_channel_id: message.channel.id,
        source_user_id: submittedBy,
        source_username: username,
        raw_text: content,
        metadata: {
          discord_guild_id: message.guild?.id,
          discord_channel_name: channelName,
          discord_message_id: message.id
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    logger.info(`Successfully created raw drop #${data.raw_drop.id}`);

    // Optionally react to the message to confirm processing
    try {
      await message.react('✅');
    } catch (err) {
      logger.debug('Could not react to message');
    }

  } catch (error) {
    logger.error(`Failed to submit raw drop: ${error.message}`);
    
    // Optionally notify the user
    try {
      await message.react('❌');
    } catch (err) {
      logger.debug('Could not react to message');
    }
  }
}
