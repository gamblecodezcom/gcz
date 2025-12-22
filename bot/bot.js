module.exports = (bot) => {
  const db = require('../api/db');
  const { parseButtons, isValidEmail, paginate } = require('./helpers');

  // ========================================================================
  // USER COMMANDS
  // ========================================================================

  // /start - Welcome and onboarding
  bot.command('start', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;

    // Store session
    await db.query(`
      INSERT INTO telegram_sessions (telegram_user_id, username, first_name, meta)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username = ?, first_name = ?, updated_at = NOW()
    `, [userId, username, firstName, JSON.stringify(ctx.from), username, firstName]);

    const welcomeMsg = `
🎰 <b>Welcome to GambleCodez!</b>

Your gateway to the best casino, crypto, and sweepstakes sites.

<i>Quick start:</i>
• Browse by category with /menu
• Find faucet casinos: /faucet
• Explore crypto sites: /crypto
• US sweepstakes: /sweeps

Need help? Type /help anytime.
    `.trim();

    await ctx.replyWithHTML(welcomeMsg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 Open Menu', callback_data: 'menu' }],
          [{ text: '📢 Follow Channel', url: process.env.TELEGRAM_CHANNEL_ID.replace('@', 'https://t.me/') }],
          [{ text: '💬 Join Group', url: 'https://t.me/+grouplink' }]
        ]
      }
    });
  });

  // /menu - Browse categories
  bot.command('menu', async (ctx) => {
    await showMainMenu(ctx);
  });

  // /help - Command help
  bot.command('help', async (ctx) => {
    const userId = ctx.from.id;
    const adminFlags = await db.queryOne('SELECT * FROM admin_flags WHERE telegram_user_id = ?', [userId]);
    const isAdmin = adminFlags && adminFlags.is_admin;

    let helpMsg = `
📚 <b>GambleCodez Bot Commands</b>

<b>Browse & Search:</b>
/menu - Browse all categories
/categories - View category list
/faucet - Faucet casinos
/crypto - Crypto gambling
/sweeps - US Sweepstakes
/instant - Instant redemption
/lootbox - Lootbox & cases
/recent - Recently added

<b>Your Account:</b>
/subscribe - Newsletter opt-in
/region - Switch US/Non-US view
/link - Get your referral links
    `.trim();

    if (isAdmin) {
      helpMsg += `

<b>Admin Commands:</b>
/admin on|off - Toggle admin mode
/broadcast - Send broadcast message
/responses - Manage auto-responses
/affiliates - Manage affiliates
/stats - View statistics
/featureflags - Toggle features
/reload - Reload services
      `.trim();
    }

    await ctx.replyWithHTML(helpMsg);
  });

  // /faucet - Faucet casinos
  bot.command('faucet', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND tags LIKE '%faucet%'
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No faucet casinos available at the moment.');
    }

    let msg = '🚰 <b>Faucet Casinos</b>\n\nCasinos with free faucets:\n\n';
    affiliates.forEach(a => {
      msg += `• <b>${a.name}</b>\n  ${a.referral_url}\n\n`;
    });

    await ctx.replyWithHTML(msg);
  });

  // /crypto - Crypto casinos
  bot.command('crypto', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND (tags LIKE '%crypto%' OR level = 4)
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No crypto casinos available at the moment.');
    }

    let msg = '💎 <b>Crypto Casinos</b>\n\nBest crypto gambling sites:\n\n';
    affiliates.forEach(a => {
      msg += `• <b>${a.name}</b>\n  ${a.referral_url}\n\n`;
    });

    await ctx.replyWithHTML(msg);
  });

  // /sweeps - US Sweepstakes
  bot.command('sweeps', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND region = 'usa' AND tags LIKE '%sweeps%'
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No sweepstakes available at the moment.');
    }

    let msg = '🎰 <b>US Sweepstakes Casinos</b>\n\nLegal US sweepstakes:\n\n';
    affiliates.forEach(a => {
      msg += `• <b>${a.name}</b>\n  ${a.referral_url}\n\n`;
    });

    await ctx.replyWithHTML(msg);
  });

  // /instant - Instant redemption
  bot.command('instant', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND instant_redemption = 1
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No instant redemption sites available.');
    }

    let msg = '⚡ <b>Instant Redemption</b>\n\nWithdraw instantly:\n\n';
    affiliates.forEach(a => {
      msg += `• <b>${a.name}</b>\n  ${a.referral_url}\n\n`;
    });

    await ctx.replyWithHTML(msg);
  });

  // /lootbox - Lootbox sites
  bot.command('lootbox', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND tags LIKE '%lootbox%'
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No lootbox sites available.');
    }

    let msg = '📦 <b>Lootbox & Case Opening</b>\n\nBest lootbox sites:\n\n';
    affiliates.forEach(a => {
      msg += `• <b>${a.name}</b>\n  ${a.referral_url}\n\n`;
    });

    await ctx.replyWithHTML(msg);
  });

  // /recent - Recently added
  bot.command('recent', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No recently added affiliates.');
    }

    let msg = '🆕 <b>Recently Added</b>\n\nNew this month:\n\n';
    affiliates.forEach(a => {
      msg += `• <b>${a.name}</b>\n  ${a.referral_url}\n\n`;
    });

    await ctx.replyWithHTML(msg);
  });

  // /subscribe - Newsletter
  bot.command('subscribe', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);

    if (args.length === 0) {
      return ctx.reply('Please provide your email: /subscribe your@email.com');
    }

    const email = args[0];
    if (!isValidEmail(email)) {
      return ctx.reply('Invalid email address. Please try again.');
    }

    await db.query(`
      UPDATE telegram_sessions 
      SET email = ?, consent_newsletter = 1 
      WHERE telegram_user_id = ?
    `, [email, ctx.from.id]);

    await ctx.reply('✅ Subscribed to newsletter! You\'ll receive updates and exclusive promos.');
  });

  // /region - Switch region
  bot.command('region', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);

    if (args.length === 0) {
      return ctx.reply('Usage: /region us OR /region nonus');
    }

    const region = args[0].toLowerCase() === 'us' ? 'us' : 'nonus';

    await db.query(`
      UPDATE telegram_sessions 
      SET region = ?
      WHERE telegram_user_id = ?
    `, [region, ctx.from.id]);

    await ctx.reply(`✅ Region set to ${region.toUpperCase()}`);
  });

  // /link - Get referral link
  bot.command('link', async (ctx) => {
    const userId = ctx.from.id;
    const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE telegram_user_id = ?', [userId]);

    if (!affiliate) {
      return ctx.reply('You are not registered as an affiliate yet. Contact admin to join.');
    }

    const msg = `
🔗 <b>Your Referral Links</b>

<b>${affiliate.name}</b>
${affiliate.referral_url}

Code: <code>${affiliate.referral_code}</code>
    `.trim();

    await ctx.replyWithHTML(msg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Copy Link', url: affiliate.referral_url }]
        ]
      }
    });
  });

  // ========================================================================
  // ADMIN COMMANDS
  // ========================================================================

  // /admin - Toggle admin mode
  bot.command('admin', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ').slice(1);

    const adminFlags = await db.queryOne('SELECT * FROM admin_flags WHERE telegram_user_id = ?', [userId]);

    if (!adminFlags || !adminFlags.is_admin) {
      return ctx.reply('⛔ You do not have admin privileges.');
    }

    if (args.length === 0) {
      return ctx.reply('Usage: /admin on OR /admin off');
    }

    const mode = args[0].toLowerCase() === 'on' ? 1 : 0;

    await db.query('UPDATE admin_flags SET admin_mode = ? WHERE telegram_user_id = ?', [mode, userId]);

    await ctx.reply(`✅ Admin mode ${mode ? 'enabled' : 'disabled'}`);
  });

  // /stats - View statistics
  bot.command('stats', async (ctx) => {
    if (!await isAdminWithMode(ctx.from.id)) {
      return ctx.reply('⛔ Admin mode required. Use /admin on');
    }

    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM affiliates) as total_affiliates,
        (SELECT COUNT(*) FROM affiliates WHERE status = 'active') as active_affiliates,
        (SELECT COUNT(*) FROM conversions) as total_conversions,
        (SELECT SUM(revenue) FROM affiliates) as total_revenue
    `);

    const msg = `
📊 <b>GambleCodez Statistics</b>

<b>Affiliates:</b> ${stats.total_affiliates} (${stats.active_affiliates} active)
<b>Conversions:</b> ${stats.total_conversions}
<b>Revenue:</b> $${parseFloat(stats.total_revenue || 0).toFixed(2)}
    `.trim();

    await ctx.replyWithHTML(msg);
  });

  // ========================================================================
  // HELPERS
  // ========================================================================

  async function showMainMenu(ctx) {
    const msg = `
📋 <b>GambleCodez Categories</b>

Browse our curated selection:

🌟 Top Picks
🇺🇸 US Sweepstakes
💎 Crypto Casinos
🚰 Faucet Sites
📦 Lootbox
⚡ Instant Redemption
🆕 Recently Added

Use buttons below or type commands like /faucet
    `.trim();

    await ctx.replyWithHTML(msg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌟 Top Picks', callback_data: 'top' }],
          [{ text: '🇺🇸 US Sweeps', callback_data: 'sweeps' }, { text: '💎 Crypto', callback_data: 'crypto' }],
          [{ text: '🚰 Faucet', callback_data: 'faucet' }, { text: '📦 Lootbox', callback_data: 'lootbox' }],
          [{ text: '⚡ Instant', callback_data: 'instant' }, { text: '🆕 Recent', callback_data: 'recent' }]
        ]
      }
    });
  }

  async function isAdminWithMode(userId) {
    const adminFlags = await db.queryOne('SELECT * FROM admin_flags WHERE telegram_user_id = ?', [userId]);
    return adminFlags && adminFlags.is_admin && adminFlags.admin_mode;
  }

  // ========================================================================
  // CALLBACK HANDLERS
  // ========================================================================

  bot.action('menu', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });

  // Handle category callbacks
  const categoryHandlers = {
    top: 'is_top_pick = 1',
    sweeps: "region = 'usa' AND tags LIKE '%sweeps%'",
    crypto: "(tags LIKE '%crypto%' OR level = 4)",
    faucet: "tags LIKE '%faucet%'",
    lootbox: "tags LIKE '%lootbox%'",
    instant: 'instant_redemption = 1',
    recent: 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
  };

  Object.keys(categoryHandlers).forEach(category => {
    bot.action(category, async (ctx) => {
      await ctx.answerCbQuery();

      const affiliates = await db.query(`
        SELECT * FROM affiliates 
        WHERE status = 'active' AND ${categoryHandlers[category]}
        ORDER BY priority DESC
        LIMIT 10
      `);

      if (affiliates.length === 0) {
        return ctx.reply('No affiliates found in this category.');
      }

      let msg = `<b>${category.toUpperCase()}</b>\n\n`;
      affiliates.forEach(a => {
        msg += `• <b>${a.name}</b>\n  ${a.referral_url}\n\n`;
      });

      await ctx.replyWithHTML(msg);
    });
  });

  console.log('✅ Telegram bot handlers initialized');
};
