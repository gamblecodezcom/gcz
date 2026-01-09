import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { handleMessage } from './handlers/messageHandler.js';
import http from 'http';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// =====================================================
// HEALTH ENDPOINT
// =====================================================
const HEALTH_PORT = 3002;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'discord-bot',
      uptime: process.uptime(),
      ready: client.isReady()
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(HEALTH_PORT, '127.0.0.1', () => {
  console.log(`[discord] Health server listening on 127.0.0.1:${HEALTH_PORT}`);
});

// =====================================================
// READY EVENT
// =====================================================
client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Discord bot ready! Logged in as ${readyClient.user.tag}`);
  logger.info(`Connected to server: ${config.DISCORD_SERVER_ID}`);
  logger.info(
    `Monitoring channels: ${config.DISCORD_SC_LINKS_CHANNEL_ID} (links), ${config.DISCORD_SC_CODES_CHANNEL_ID} (codes)`
  );

  const guild = readyClient.guilds.cache.get(config.DISCORD_SERVER_ID);
  if (!guild) {
    logger.error(`Bot is not in server ${config.DISCORD_SERVER_ID}`);
    return;
  }

  logger.info(`Bot verified in server: ${guild.name}`);

  try {
    const linksChannel = guild.channels.cache.get(config.DISCORD_SC_LINKS_CHANNEL_ID);
    const codesChannel = guild.channels.cache.get(config.DISCORD_SC_CODES_CHANNEL_ID);

    if (linksChannel) {
      const permissions = linksChannel.permissionsFor(readyClient.user);
      if (permissions && permissions.has(['ViewChannel', 'ReadMessageHistory'])) {
        logger.info(`✓ Bot has read permissions for SC LINKS channel`);
      } else {
        logger.warn(`⚠ Bot may lack read permissions for SC LINKS channel`);
      }
    }

    if (codesChannel) {
      const permissions = codesChannel.permissionsFor(readyClient.user);
      if (permissions && permissions.has(['ViewChannel', 'ReadMessageHistory'])) {
        logger.info(`✓ Bot has read permissions for SC CODES channel`);
      } else {
        logger.warn(`⚠ Bot may lack read permissions for SC CODES channel`);
      }
    }

  } catch (err) {
    logger.error('Error validating channel permissions:', err);
  }
});

// =====================================================
// MESSAGE HANDLER
// =====================================================
client.on(Events.MessageCreate, async (message) => {
  try {
    await handleMessage(message);
  } catch (err) {
    logger.error('Message handler error:', err);
  }
});

// =====================================================
// LOGIN
// =====================================================
client.login(config.DISCORD_BOT_TOKEN).catch(err => {
  logger.error('Login failed:', err);
  process.exit(1);
});

// =====================================================
// CLEAN SHUTDOWN
// =====================================================
process.once('SIGINT', async () => {
  logger.info('SIGINT received — shutting down Discord client');
  await client.destroy();
  process.exit(0);
});

process.once('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down Discord client');
  await client.destroy();
  process.exit(0);
});
