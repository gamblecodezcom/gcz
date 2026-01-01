import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { handleMessage } from './handlers/messageHandler.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Discord bot ready! Logged in as ${readyClient.user.tag}`);
  logger.info(`Connected to server: ${config.DISCORD_SERVER_ID}`);
  logger.info(`Monitoring channels: ${config.DISCORD_SC_LINKS_CHANNEL_ID} (links), ${config.DISCORD_SC_CODES_CHANNEL_ID} (codes)`);
  
  // Verify bot is in the correct server
  const guild = readyClient.guilds.cache.get(config.DISCORD_SERVER_ID);
  if (!guild) {
    logger.error(`Bot is not in server ${config.DISCORD_SERVER_ID}`);
    return;
  }
  
  logger.info(`Bot verified in server: ${guild.name}`);
  
  // Verify bot has read permissions for both channels
  try {
    const linksChannel = guild.channels.cache.get(config.DISCORD_SC_LINKS_CHANNEL_ID);
    const codesChannel = guild.channels.cache.get(config.DISCORD_SC_CODES_CHANNEL_ID);
    
    if (linksChannel) {
      const permissions = linksChannel.permissionsFor(readyClient.user);
      if (permissions && permissions.has(['ViewChannels', 'ReadMessageHistory'])) {
        logger.info(`✓ Bot has read permissions for SC LINKS channel`);
      } else {
        logger.warn(`⚠ Bot may lack read permissions for SC LINKS channel`);
      }
    } else {
      logger.warn(`⚠ SC LINKS channel not found (ID: ${config.DISCORD_SC_LINKS_CHANNEL_ID})`);
    }
    
    if (codesChannel) {
      const permissions = codesChannel.permissionsFor(readyClient.user);
      if (permissions && permissions.has(['ViewChannels', 'ReadMessageHistory'])) {
        logger.info(`✓ Bot has read permissions for SC CODES channel`);
      } else {
        logger.warn(`⚠ Bot may lack read permissions for SC CODES channel`);
      }
    } else {
      logger.warn(`⚠ SC CODES channel not found (ID: ${config.DISCORD_SC_CODES_CHANNEL_ID})`);
    }
  } catch (error) {
    logger.error(`Error verifying channel permissions: ${error.message}`);
  }
});

client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Only process messages in the configured channels
  const channelId = message.channel.id;
  if (channelId !== config.DISCORD_SC_LINKS_CHANNEL_ID && 
      channelId !== config.DISCORD_SC_CODES_CHANNEL_ID) {
    return;
  }

  // Determine channel type
  const channel = channelId === config.DISCORD_SC_LINKS_CHANNEL_ID ? 'links' : 'codes';

  try {
    await handleMessage(message, channel);
  } catch (error) {
    logger.error('Error handling Discord message:', error);
  }
});

client.on(Events.Error, (error) => {
  logger.error('Discord client error:', error);
});

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('Shutting down Discord bot...');
  client.destroy();
  process.exit(0);
});

process.once('SIGTERM', () => {
  logger.info('Shutting down Discord bot...');
  client.destroy();
  process.exit(0);
});

// Start bot
async function start() {
  try {
    await client.login(config.DISCORD_BOT_TOKEN);
    logger.info('Discord bot login successful');
  } catch (error) {
    logger.error('Failed to start Discord bot:', error);
    process.exit(1);
  }
}

start();

export { client };
