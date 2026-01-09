import { getUserBadges } from "../services/badges.js";
import { bold } from "../utils/formatters.js";

const BADGE_LABELS = {
  "SPIN_10": "10 Wheel Spins",
  "SPIN_100": "100 Wheel Spins",
  "ENTRIES_100": "100 Raffle Entries",
  "ENTRIES_1000": "1,000 Raffle Entries",
  "GIVEAWAY_WIN_1": "First Giveaway Win",
  "STREAK_7": "7‑Day Streak",
  "STREAK_30": "30‑Day Streak",
  "AFFILIATE_10": "Visited 10 Sites",
  "VIP_BRONZE": "VIP Bronze",
  "VIP_SILVER": "VIP Silver",
  "VIP_GOLD": "VIP Gold"
};

export default function badgesCommands(bot) {
  bot.command("badges", async (ctx) => {
    const telegramId = ctx.from.id;
    const badges = await getUserBadges(telegramId);

    if (!badges || badges.length === 0) {
      return ctx.reply("🏅 You don't have any badges yet.\nKeep playing to earn some!");
    }

    let msg = "🏅 *Your Badges*\n\n";

    for (const badge of badges) {
      const label = BADGE_LABELS[badge.badge_code] || badge.badge_code;
      msg += `• ${bold(label)} (${new Date(badge.earned_at).toLocaleDateString()})\n`;
    }

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}