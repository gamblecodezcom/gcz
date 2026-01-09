import { ROLES } from "../services/telegramRoles.js";
import { getUserRole } from "../utils/permissions.js";
import { bold, code } from "../utils/formatters.js";

export default function helpCommands(bot) {
  // ============================
  // COMMAND DEFINITIONS BY ROLE
  // ============================
  const HELP_PAGES = {
    USER: [
      {
        title: "🎰 Basic Commands",
        lines: [
          `${code("/start")} — Welcome message`,
          `${code("/help")} — Show this help booklet`,
          `${code("/stats")} — Your GCZ stats`,
          `${code("/wheel")} — Spin the wheel`,
          `${code("/raffles")} — View active raffles`,
          `${code("/giveaways")} — View active giveaways`,
          `${code("/drops")} — Latest drops`,
          `${code("/promos")} — Active promos`
        ]
      },
      {
        title: "🔥 Progress & Rewards",
        lines: [
          `${code("/missions")} — Daily missions`,
          `${code("/points")} — GCZ points`,
          `${code("/vip")} — VIP status`,
          `${code("/badges")} — Earned badges`,
          `${code("/leaderboard")} — Leaderboard`,
          `${code("/code <CODE>")} — Redeem secret code`,
          `${code("/inbox")} — Your GCZ inbox`
        ]
      }
    ],

    MOD: [
      {
        title: "🛠 Moderator Tools",
        lines: [
          `${code("/warn <id>")} — Warn a user`,
          `${code("/mute <id>")} — Mute a user`,
          `${code("/clean")} — Clean chat spam`,
          `${code("/whois <id>")} — User info`
        ]
      }
    ],

    ADMIN: [
      {
        title: "👑 Admin Commands",
        lines: [
          `${code("/broadcast <msg>")} — Send channel broadcast`,
          `${code("/announce <msg>")} — Styled announcement`,
          `${code("/services")} — Check service health`,
          `${code("/reload")} — Reload bot`,
          `${code("/restart")} — Restart all services`
        ]
      },
      {
        title: "📦 Admin Tools (Data)",
        lines: [
          `${code("/ar <keyword>")} — Create autoresponse`,
          `${code("/arlist")} — List autoresponses`,
          `${code("/ardel <keyword>")} — Delete autoresponse`
        ]
      }
    ],

    SUPERADMIN: [
      {
        title: "⚡ Super Admin",
        lines: [
          `${code("/sudo <cmd>")} — Execute privileged command`,
          `${code("/adminlog")} — View admin logs`,
          `${code("/flushcache")} — Clear system cache`
        ]
      }
    ]
  };

  // ============================
  // RENDER PAGE
  // ============================
  function renderPage(role, pageIndex) {
    const pages = getPagesForRole(role);
    const page = pages[pageIndex];

    let msg = `${bold(page.title)}\n\n`;
    page.lines.forEach((line) => (msg += `${line}\n`));

    msg += `\nPage ${pageIndex + 1} of ${pages.length}`;

    return msg;
  }

  // ============================
  // MERGE PAGES BASED ON ROLE
  // ============================
  function getPagesForRole(role) {
    const pages = [...HELP_PAGES.USER];

    if (role >= ROLES.MOD) pages.push(...HELP_PAGES.MOD);
    if (role >= ROLES.ADMIN) pages.push(...HELP_PAGES.ADMIN);
    if (role >= ROLES.SUPER_ADMIN) pages.push(...HELP_PAGES.SUPERADMIN);

    return pages;
  }

  // ============================
  // /help COMMAND
  // ============================
  bot.command("help", async (ctx) => {
    const telegramId = ctx.from.id;
    const role = await getUserRole(telegramId);

    const pages = getPagesForRole(role);
    const pageIndex = 0;

    ctx.reply(renderPage(role, pageIndex), {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "➡️ Next", callback_data: `help_next_${pageIndex}` }
          ],
          [
            { text: "❌ Close", callback_data: "help_close" }
          ]
        ]
      }
    });
  });

  // ============================
  // PAGINATION HANDLERS
  // ============================
  bot.action(/help_(next|prev)_(\d+)/, async (ctx) => {
    const telegramId = ctx.from.id;
    const role = await getUserRole(telegramId);

    const pages = getPagesForRole(role);
    const current = parseInt(ctx.match[2]);
    const direction = ctx.match[1];

    let newIndex = direction === "next" ? current + 1 : current - 1;

    if (newIndex < 0) newIndex = 0;
    if (newIndex >= pages.length) newIndex = pages.length - 1;

    await ctx.editMessageText(renderPage(role, newIndex), {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            ...(newIndex > 0
              ? [{ text: "⬅️ Back", callback_data: `help_prev_${newIndex}` }]
              : []),
            ...(newIndex < pages.length - 1
              ? [{ text: "➡️ Next", callback_data: `help_next_${newIndex}` }]
              : [])
          ],
          [{ text: "❌ Close", callback_data: "help_close" }]
        ]
      }
    });
  });

  // ============================
  // CLOSE BUTTON
  // ============================
  bot.action("help_close", async (ctx) => {
    ctx.deleteMessage().catch(() => null);
  });
}