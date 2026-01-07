import { listPendingPromos, approvePromo } from "../services/promoApproval.js";
import { getUserRole, hasRole, ROLES } from "../utils/permissions.js";

function formatPromoLine(promo) {
  const text =
    promo.clean_text ||
    promo.cleaned_text ||
    promo.content ||
    promo.raw_text ||
    "";
  const snippet = text.length > 140 ? `${text.slice(0, 140)}…` : text;
  return `#${promo.id} [${promo.channel || "unknown"}] ${snippet}`;
}

export default function approvalCommands(bot) {
  bot.command("promoqueue", async (ctx) => {
    const role = await getUserRole(ctx.from.id);
    if (!hasRole(role, ROLES.ADMIN)) {
      return ctx.reply("🚫 Admin access required.");
    }

    const promos = await listPendingPromos(5);
    if (!promos.length) {
      return ctx.reply("✅ No pending promos.");
    }

    const lines = promos.map(formatPromoLine).join("\n");
    return ctx.reply(`🗂 Pending promos:\n${lines}`);
  });

  bot.command("promoapprove", async (ctx) => {
    const role = await getUserRole(ctx.from.id);
    if (!hasRole(role, ROLES.ADMIN)) {
      return ctx.reply("🚫 Admin access required.");
    }

    const parts = ctx.message.text.split(" ").filter(Boolean);
    const promoId = parts[1] ? Number.parseInt(parts[1], 10) : NaN;

    if (!promoId) {
      return ctx.reply("Usage: /promoapprove <promo_id>");
    }

    const promo = await approvePromo(promoId, `telegram:${ctx.from.id}`);
    if (!promo) {
      return ctx.reply("❌ Promo not found or not approved.");
    }

    return ctx.reply(`✅ Approved promo #${promo.id}.`);
  });
}
