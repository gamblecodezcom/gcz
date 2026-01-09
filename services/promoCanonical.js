import { URL } from "url";

const CODE_REGEX = /\b[A-Z0-9]{4,20}\b/;
const URL_REGEX = /https?:\/\/[^\s]+/i;

export function extractCode(text = "") {
  const match = String(text).match(CODE_REGEX);
  return match ? match[0].trim() : "";
}

export function extractUrl(text = "") {
  const match = String(text).match(URL_REGEX);
  if (!match) return "";
  return match[0].replace(/[.,;!?]+$/, "");
}

function normalizeText(text) {
  return String(text || "").trim();
}

function cleanTitle(text) {
  if (!text) return "";
  const firstLine = String(text).split("\n")[0].trim();
  const withoutUrl = firstLine.replace(URL_REGEX, "").trim();
  if (withoutUrl.length <= 120) return withoutUrl;
  return `${withoutUrl.slice(0, 117).trimEnd()}...`;
}

function coerceTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  if (typeof tags === "string") {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function normalizeAffiliateUrl(url) {
  if (!url) return "";
  try {
    return new URL(url).toString();
  } catch {
    return String(url).trim();
  }
}

export function normalizePromo(promo = {}) {
  const description =
    promo.description ||
    promo.content ||
    promo.raw_text ||
    promo.clean_text ||
    promo.cleaned_text ||
    "";
  const title = cleanTitle(promo.title || promo.headline || promo.clean_text || description);
  const casinoName =
    promo.casino_name ||
    promo.affiliate_name ||
    promo.site ||
    promo.casino ||
    "";
  const affiliateUrl = normalizeAffiliateUrl(
    promo.affiliate_url ||
      promo.quick_signup_url ||
      promo.affiliate_link ||
      ""
  );
  const expiry =
    promo.expiry ||
    promo.expires_at ||
    promo.expiresAt ||
    promo.updated_at ||
    "";
  const tags = coerceTags(promo.tags || promo.jurisdiction_tags);
  const source = promo.source || "manual";
  const promoUrl =
    promo.promo_url ||
    promo.url ||
    extractUrl(description);
  const bonusCode =
    promo.bonus_code ||
    promo.code ||
    extractCode(description);

  return {
    casino_name: casinoName,
    affiliate_url: affiliateUrl,
    title,
    description: normalizeText(description),
    expiry,
    tags,
    source,
    promo_url: promoUrl,
    bonus_code: bonusCode,
  };
}

export function buildRequiredLines(canonical, affiliateLink) {
  const lines = [];
  if (canonical?.title) {
    lines.push(`🎯 ${canonical.title}`);
  }
  if (canonical?.casino_name) {
    lines.push(`🏰 ${canonical.casino_name}`);
  }
  if (affiliateLink) {
    lines.push(`⚡ Quick Signup: ${affiliateLink}`);
  }
  if (canonical?.expiry) {
    lines.push(`⏳ Expires: ${canonical.expiry}`);
  }
  return lines;
}

export function ensureRequiredFields(message, canonical, affiliateLink) {
  let output = String(message || "").trim();
  const lines = buildRequiredLines(canonical, affiliateLink);
  if (!output) {
    return lines.join("\n");
  }

  const lower = output.toLowerCase();
  const missing = [];
  lines.forEach((line) => {
    if (!lower.includes(line.toLowerCase())) {
      missing.push(line);
    }
  });

  if (missing.length) {
    output = `${output}\n\n${missing.join("\n")}`;
  }

  return output;
}
