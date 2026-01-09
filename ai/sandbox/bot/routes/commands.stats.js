import fetch from "node-fetch";

export function setupStatsCommands(bot) {
  bot.command("stats", async (ctx) => {
    const userId = ctx.from.id.toString();

    try {
      const res = await fetch(`https://gamblecodez.com/api/stats/${userId}`);
      const data = await res.json();

      ctx.reply(
        `📊 *Your Stats*\n\n` +
        `Entries: ${data.entries}\n` +
        `Wins: ${data.wins}\n` +
        `Raffles Joined: ${data.raffles}\n` +
        `Last Win: ${data.lastWin || "None"}`
      );
    } catch (err) {
      ctx.reply("❌ Failed to fetch stats.");
    }
  });

  bot.command("raffle_stats", async (ctx) => {
    const id = ctx.message.text.split(" ")[1];
    if (!id) return ctx.reply("Usage: /raffle_stats <raffleId>");

    try {
      const res = await fetch(`https://gamblecodez.com/api/raffles/${id}/stats`);
      const data = await res.json();

      ctx.reply(
        `📈 *Raffle Stats*\n\n` +
        `ID: ${id}\n` +
        `Entries: ${data.entries}\n` +
        `Unique Users: ${data.uniqueUsers}\n` +
        `Status: ${data.status}`
      );
    } catch (err) {
      ctx.reply("❌ Failed to fetch raffle stats.");
    }
  });
}
