import { getUserRole } from "../utils/permissions.js";
import { TelegramRoles } from "../services/telegramRoles.js";
import { bold } from "../utils/formatters.js";

export default function menuCommands(bot) {
  bot.command("menu", async (ctx) => {
    const telegramId = ctx.from.id;
    const role = await getUserRole(telegramId);

    const msg =
`📟 *GambleCodez Command Menu*  
Your degen control panel.  
Tap a button and run it up.`;

    // ============================
    // BASE USER BUTTONS
    // ============================
    const keyboard = [
      [
        { text: "🎰 Wheel", callback_data: "menu_wheel" },
        { text: "🎟️ Raffles", callback_data: "menu_raffles" }
      ],
      [
        { text: "🎉 Giveaways", callback_data: "menu_giveaways" },
        { text: "📦 Drops", callback_data: "menu_drops" }
      ],
      [
        { text: "🎁 Promos", callback_data: "menu_promos" },
        { text: "🔥 Daily", callback_data: "menu_daily" }
      ],
      [
        { text: "🛠 Missions", callback_data: "menu_missions" },
        { text: "💎 Points", callback_data: "menu_points" }
      ],
      [
        { text: "👑 VIP", callback_data: "menu_vip" },
        { text: "🏅 Badges", callback_data: "menu_badges" }
      ],
      [
        { text: "📬 Inbox", callback_data: "menu_inbox" },
        { text: "📊 Stats", callback_data: "menu_stats" }
      ],
      [
        { text: "📚 Help", callback_data: "menu_help" }
      ]
    ];

    // ============================
    // MOD BUTTONS
    // ============================
    if (role >= TelegramRoles.LEVELS.MOD) {
      keyboard.push([
        { text: "🛠 Mod Tools", callback_data: "menu_mod" }
      ]);
    }

    // ============================
    // ADMIN BUTTONS
    // ============================
    if (role >= TelegramRoles.LEVELS.ADMIN) {
      keyboard.push([
        { text: "👑 Admin Panel", callback_data: "menu_admin" }
      ]);
    }

    // ============================
    // SUPER ADMIN BUTTONS
    // ============================
    if (role >= TelegramRoles.LEVELS.SUPER_ADMIN) {
      keyboard.push([
        { text: "⚡ Super Admin", callback_data: "menu_superadmin" }
      ]);
    }

    ctx.reply(msg, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboard }
    });
  });

  // ============================
  // CALLBACK HANDLERS
  // ============================
  const redirect = (cmd) => async (ctx) => {
    ctx.answerCbQuery();
    ctx.deleteMessage().catch(() => null);
    ctx.telegram.sendMessage(ctx.chat.id, `/${cmd}`);
  };

  bot.action("menu_wheel", redirect("wheel"));
  bot.action("menu_raffles", redirect("raffles"));
  bot.action("menu_giveaways", redirect("giveaways"));
  bot.action("menu_drops", redirect("drops"));
  bot.action("menu_promos", redirect("promos"));
  bot.action("menu_daily", redirect("daily"));
  bot.action("menu_missions", redirect("missions"));
  bot.action("menu_points", redirect("points"));
  bot.action("menu_vip", redirect("vip"));
  bot.action("menu_badges", redirect("badges"));
  bot.action("menu_inbox", redirect("inbox"));
  bot.action("menu_stats", redirect("stats"));
  bot.action("menu_help", redirect("help"));

  // Role‑specific redirects
  bot.action("menu_mod", redirect("help"));        // replace with /modpanel later
  bot.action("menu_admin", redirect("help"));      // replace with /adminpanel later
  bot.action("menu_superadmin", redirect("help")); // replace with /superpanel later
}