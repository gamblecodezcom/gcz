import { getLeaderboard } from "../services/progress.js";
import { bold, code } from "../utils/formatters.js";

export default function leaderboardCommands(bot) {
  bot.command("leaderboard", async (ctx) => {
    const list = await getLeaderboard(20);

    if (!list || list.length === 0) {
      return ctx.reply("📊 No leaderboard data yet.");
    }

    let msg = "📊 *Leaderboard* (Top 20 by entries)\n\n";

    list.forEach((user, index) => {
      const rank = index + 1;
      const name =
        user.display_name ||
        user.username ||
        `ID ${user.telegram_id}`;

      msg += `${rank}. ${bold(name)} — ${user.total_entries} entries, ${user.total_spins} spins\n`;
    });

    msg += `\nUse ${code("/stats")} to view your stats.`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}