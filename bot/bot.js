module.exports = (bot) => {
  const db = require('../db');
  const { parseButtons, isValidEmail, paginate } = require('./helpers');
  
  const WEBAPP_BASE_URL = process.env.WEBAPP_BASE_URL || 'https://gamblecodez.com';

  // ========================================================================
  // USER COMMANDS
  // ========================================================================

  // /start - Welcome and onboarding
  bot.command('start', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;

    // Store session (upsert)
    const existing = await db.queryOne(
      'SELECT id FROM telegram_sessions WHERE telegram_user_id = $1',
      [userId]
    );
    
    if (existing) {
      await db.query(`
        UPDATE telegram_sessions 
        SET username = $1, first_name = $2, meta = $3, updated_at = NOW()
        WHERE telegram_user_id = $4
      `, [username, firstName, JSON.stringify(ctx.from), userId]);
    } else {
      await db.query(`
        INSERT INTO telegram_sessions (telegram_user_id, username, first_name, meta, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [userId, username, firstName, JSON.stringify(ctx.from)]);
    }

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

    const channelUrl = process.env.TELEGRAM_CHANNEL_ID 
      ? process.env.TELEGRAM_CHANNEL_ID.replace('@', 'https://t.me/')
      : 'https://t.me/gamblecodez';
    
    const keyboard = [
      [{ text: '📱 Open Menu', callback_data: 'menu' }]
    ];
    
    if (process.env.TELEGRAM_CHANNEL_ID) {
      keyboard.push([{ text: '📢 Follow Channel', url: channelUrl }]);
    }
    
    if (process.env.TELEGRAM_GROUP_ID) {
      keyboard.push([{ text: '💬 Join Group', url: process.env.TELEGRAM_GROUP_ID }]);
    }

    await ctx.replyWithHTML(welcomeMsg, {
      reply_markup: {
        inline_keyboard: keyboard
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
    const adminFlags = await db.queryOne('SELECT * FROM admin_flags WHERE telegram_user_id = $1', [userId]);
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
      WHERE status = 'active' AND (tags LIKE '%faucet%' OR tags ILIKE '%faucet%')
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No faucet casinos available at the moment.');
    }

    await sendAffiliateList(ctx, affiliates, '🚰 <b>Faucet Casinos</b>\n\nCasinos with free faucets:');
  });

  // /crypto - Crypto casinos
  bot.command('crypto', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND (tags LIKE '%crypto%' OR tags ILIKE '%crypto%' OR level = 4)
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No crypto casinos available at the moment.');
    }

    await sendAffiliateList(ctx, affiliates, '💎 <b>Crypto Casinos</b>\n\nBest crypto gambling sites:');
  });

  // /sweeps - US Sweepstakes
  bot.command('sweeps', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND region = 'usa' AND (tags LIKE '%sweeps%' OR tags ILIKE '%sweeps%')
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No sweepstakes available at the moment.');
    }

    await sendAffiliateList(ctx, affiliates, '🎰 <b>US Sweepstakes Casinos</b>\n\nLegal US sweepstakes:');
  });

  // /instant - Instant redemption
  bot.command('instant', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND instant_redemption = true
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No instant redemption sites available.');
    }

    await sendAffiliateList(ctx, affiliates, '⚡ <b>Instant Redemption</b>\n\nWithdraw instantly:');
  });

  // /lootbox - Lootbox sites
  bot.command('lootbox', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND (tags LIKE '%lootbox%' OR tags ILIKE '%lootbox%')
      ORDER BY priority DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No lootbox sites available.');
    }

    await sendAffiliateList(ctx, affiliates, '📦 <b>Lootbox & Case Opening</b>\n\nBest lootbox sites:');
  });

  // /recent - Recently added
  bot.command('recent', async (ctx) => {
    const affiliates = await db.query(`
      SELECT * FROM affiliates 
      WHERE status = 'active' AND created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (affiliates.length === 0) {
      return ctx.reply('No recently added affiliates.');
    }

    await sendAffiliateList(ctx, affiliates, '🆕 <b>Recently Added</b>\n\nNew this month:');
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
      SET email = $1, consent_newsletter = true, updated_at = NOW()
      WHERE telegram_user_id = $2
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
      SET region = $1, updated_at = NOW()
      WHERE telegram_user_id = $2
    `, [region, ctx.from.id]);

    await ctx.reply(`✅ Region set to ${region.toUpperCase()}`);
  });

  // /link - Get referral link
  bot.command('link', async (ctx) => {
    const userId = ctx.from.id;
    const affiliate = await db.queryOne('SELECT * FROM affiliates WHERE telegram_user_id = $1', [userId]);

    if (!affiliate) {
      return ctx.reply('You are not registered as an affiliate yet. Contact admin to join.');
    }

    const redirectUrl = affiliate.slug 
      ? `${WEBAPP_BASE_URL}/r/${affiliate.slug}`
      : affiliate.referral_url;

    const msg = `
🔗 <b>Your Referral Links</b>

<b>${affiliate.name}</b>
${redirectUrl}

Code: <code>${affiliate.referral_code}</code>
    `.trim();

    await ctx.replyWithHTML(msg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Copy Link', url: redirectUrl }]
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

    const adminFlags = await db.queryOne('SELECT * FROM admin_flags WHERE telegram_user_id = $1', [userId]);

    if (!adminFlags || !adminFlags.is_admin) {
      return ctx.reply('⛔ You do not have admin privileges.');
    }

    if (args.length === 0) {
      return ctx.reply('Usage: /admin on OR /admin off');
    }

    const mode = args[0].toLowerCase() === 'on';

    await db.query('UPDATE admin_flags SET admin_mode = $1 WHERE telegram_user_id = $2', [mode, userId]);

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
    const adminFlags = await db.queryOne('SELECT * FROM admin_flags WHERE telegram_user_id = $1', [userId]);
    return adminFlags && adminFlags.is_admin && adminFlags.admin_mode;
  }

  // Helper function to send affiliate list with redirect links
  async function sendAffiliateList(ctx, affiliates, header) {
    if (affiliates.length === 0) {
      return ctx.reply('No affiliates found.');
    }

    // For small lists, send as formatted message
    if (affiliates.length <= 5) {
      let msg = `${header}\n\n`;
      const buttons = [];

      affiliates.forEach(a => {
        const redirectUrl = a.slug 
          ? `${WEBAPP_BASE_URL}/r/${a.slug}`
          : (a.final_redirect_url || a.referral_url);
        
        const displayName = a.icon_url 
          ? `🎰 ${a.name}`
          : `• ${a.name}`;
        
        msg += `${displayName}\n`;
        
        if (a.description) {
          msg += `<i>${a.description.substring(0, 100)}${a.description.length > 100 ? '...' : ''}</i>\n`;
        }
        
        msg += `🔗 <a href="${redirectUrl}">Visit Site</a>\n\n`;
        
        buttons.push([{ text: `🎰 ${a.name}`, url: redirectUrl }]);
      });

      await ctx.replyWithHTML(msg, {
        reply_markup: {
          inline_keyboard: buttons
        },
        disable_web_page_preview: false
      });
    } else {
      // For larger lists, send paginated
      const pageSize = 5;
      const pages = [];
      
      for (let i = 0; i < affiliates.length; i += pageSize) {
        const pageAffiliates = affiliates.slice(i, i + pageSize);
        const buttons = [];
        
        pageAffiliates.forEach(a => {
          const redirectUrl = a.slug 
            ? `${WEBAPP_BASE_URL}/r/${a.slug}`
            : (a.final_redirect_url || a.referral_url);
          
          buttons.push([{ text: `🎰 ${a.name}`, url: redirectUrl }]);
        });
        
        pages.push({
          text: `${header}\n\nPage ${Math.floor(i / pageSize) + 1} of ${Math.ceil(affiliates.length / pageSize)}`,
          buttons
        });
      }
      
      // Send first page
      await ctx.replyWithHTML(pages[0].text, {
        reply_markup: {
          inline_keyboard: pages[0].buttons
        },
        disable_web_page_preview: false
      });
    }
  }

  // ========================================================================
  // CALLBACK HANDLERS
  // ========================================================================

  bot.action('menu', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });

  // Helper function to get current Top Pick affiliate ID
  async function getCurrentTopPickAffiliateId() {
    const config = await db.queryOne(
      'SELECT affiliate_id FROM top_pick_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1'
    );
    return config?.affiliate_id || null;
  }

  // Category handlers for PostgreSQL
  const categoryHandlers = {
    top: null, // Special handler - uses top_pick_config
    sweeps: "region = 'usa' AND (tags LIKE '%sweeps%' OR tags ILIKE '%sweeps%')",
    crypto: "(tags LIKE '%crypto%' OR tags ILIKE '%crypto%' OR level = 4)",
    faucet: "(tags LIKE '%faucet%' OR tags ILIKE '%faucet%')",
    lootbox: "(tags LIKE '%lootbox%' OR tags ILIKE '%lootbox%')",
    instant: 'instant_redemption = true',
    recent: "created_at >= NOW() - INTERVAL '30 days'"
  };

  Object.keys(categoryHandlers).forEach(category => {
    bot.action(category, async (ctx) => {
      await ctx.answerCbQuery();

      let affiliates;
      
      // Special handling for Top Pick - use dynamic config
      if (category === 'top') {
        const topPickId = await getCurrentTopPickAffiliateId();
        if (topPickId) {
          affiliates = await db.query(`
            SELECT * FROM affiliates 
            WHERE id = $1 AND status = 'active'
            ORDER BY priority DESC
            LIMIT 10
          `, [topPickId]);
        } else {
          affiliates = [];
        }
      } else {
        affiliates = await db.query(`
          SELECT * FROM affiliates 
          WHERE status = 'active' AND ${categoryHandlers[category]}
          ORDER BY priority DESC
          LIMIT 10
        `);
      }

      if (affiliates.length === 0) {
        return ctx.reply('No affiliates found in this category.');
      }

      const categoryNames = {
        top: '🌟 Top Picks',
        sweeps: '🇺🇸 US Sweepstakes',
        crypto: '💎 Crypto Casinos',
        faucet: '🚰 Faucet Sites',
        lootbox: '📦 Lootbox',
        instant: '⚡ Instant Redemption',
        recent: '🆕 Recently Added'
      };

      await sendAffiliateList(ctx, affiliates, categoryNames[category] || `<b>${category.toUpperCase()}</b>`);
    });
  });

  console.log('✅ Telegram bot handlers initialized');
};
