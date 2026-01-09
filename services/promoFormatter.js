import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import logger from "../utils/logger.js";
import { normalizePromo } from "./promoCanonical.js";

const RULES_PATH = "/var/www/html/gcz/ai/shared/promo_rules.json";

const DEFAULT_RULES = {
  cta_phrases: ["Claim now", "Join here", "Grab the bonus", "Play now"],
  affiliate: {
    base_url: "https://gamblecodez.com",
    redirect_path: "/redirect",
    cta_template: "🔗 Not yet signed up? {affiliate_link}",
  },
  templates: [
    "🎁 {headline}\n{description}\n\n💎 Code: {code}\n🔗 {url}\n\n{cta}",
    "🎁 {headline}\n{description}\n\n🔗 {url}\n\n{cta}",
    "🎁 {headline}\n{description}\n\n💎 Code: {code}\n\n{cta}",
    "{description}\n\n{cta}",
  ],
  regex: {
    code: "\\b[A-Z0-9]{4,20}\\b",
    url: "https?://[^\\s]+",
  },
};

let cachedRules = null;
let cachedMtime = 0;

function loadRules() {
  try {
    const stat = fs.statSync(RULES_PATH);
    if (cachedRules && stat.mtimeMs === cachedMtime) {
      return cachedRules;
    }
    const raw = fs.readFileSync(RULES_PATH, "utf8");
    cachedRules = JSON.parse(raw);
    cachedMtime = stat.mtimeMs;
    return cachedRules;
  } catch (err) {
    return DEFAULT_RULES;
  }
}

function extractCode(text, rules) {
  const pattern = rules?.regex?.code || DEFAULT_RULES.regex.code;
  const match = String(text || "").match(new RegExp(pattern, "i"));
  return match ? match[0].trim() : "";
}

function extractUrl(text, rules) {
  const pattern = rules?.regex?.url || DEFAULT_RULES.regex.url;
  const match = String(text || "").match(new RegExp(pattern, "i"));
  if (!match) return "";
  return match[0].replace(/[.,;!?]+$/, "");
}

function pickCta(rules) {
  const phrases = rules?.cta_phrases?.length ? rules.cta_phrases : DEFAULT_RULES.cta_phrases;
  return phrases[0] || "Claim now";
}

function buildAffiliateLink(promo, rules) {
  if (promo?.affiliate_link) return promo.affiliate_link;
  const affiliateId = promo?.affiliate_id;
  const affiliateName = promo?.affiliate_name || promo?.affiliate_slug;
  const baseUrl = rules?.affiliate?.base_url || DEFAULT_RULES.affiliate.base_url;
  const redirectPath = rules?.affiliate?.redirect_path || DEFAULT_RULES.affiliate.redirect_path;
  const target = affiliateName || affiliateId;
  if (!target) return "";
  return `${baseUrl}${redirectPath}/${target}`;
}

function renderTemplate(template, data) {
  let rendered = template;
  Object.entries(data).forEach(([key, value]) => {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, "g"), value || "");
  });
  return rendered
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function selectTemplate(rules, hasCode, hasUrl) {
  const templates = rules?.templates?.length ? rules.templates : DEFAULT_RULES.templates;
  for (const template of templates) {
    if (template.includes("{code}") && !hasCode) continue;
    if (template.includes("{url}") && !hasUrl) continue;
    return template;
  }
  return templates[templates.length - 1];
}

function buildFallback(promo, affiliateLink) {
  const rules = loadRules();
  const canonical = normalizePromo(promo);
  const baseText = canonical.description || promo.clean_text || promo.content || promo.raw_text || "";
  const headline = canonical.title || promo.headline || promo.title || promo.casino_name || "Promo Update";
  const description = canonical.description || baseText;
  const code = canonical.bonus_code || promo.bonus_code || extractCode(baseText, rules);
  const url = canonical.promo_url || promo.promo_url || extractUrl(baseText, rules);
  const ctaPhrase = promo.cta || pickCta(rules);

  const link = affiliateLink || buildAffiliateLink(promo, rules);
  const ctaTemplate = rules?.affiliate?.cta_template || DEFAULT_RULES.affiliate.cta_template;
  const cta = link ? renderTemplate(ctaTemplate, { affiliate_link: link, cta: ctaPhrase }) : ctaPhrase;

  const parts = [];
  if (headline) parts.push(`🎯 ${headline}`);
  if (canonical.casino_name) parts.push(`🏰 ${canonical.casino_name}`);
  if (description) parts.push(description);
  if (code) parts.push(`💎 Code: ${code}`);
  if (url) parts.push(`🔗 ${url}`);
  if (link) parts.push(`⚡ Quick Signup: ${link}`);
  if (canonical.expiry) parts.push(`⏳ Expires: ${canonical.expiry}`);
  if (cta) parts.push(cta);

  return parts.filter(Boolean).join("\n\n");
}

async function formatWithAi(promo, affiliateLink) {
  const endpoint = process.env.PROMO_AI_FORMAT_URL;
  if (!endpoint) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const canonical = normalizePromo(promo);
    const payload = {
      content: promo.content || promo.clean_text || promo.raw_text || canonical.description || "",
      headline: promo.headline || promo.title || canonical.title || "",
      description: promo.description || canonical.description || "",
      bonus_code: promo.bonus_code || canonical.bonus_code || "",
      promo_url: promo.promo_url || canonical.promo_url || "",
      affiliate_link: affiliateLink || "",
      affiliate_name: promo.affiliate_name || canonical.casino_name || "",
      affiliate_id: promo.affiliate_id || "",
    };

    const headers = { "Content-Type": "application/json" };
    if (process.env.GCZ_CONTROL_KEY) {
      headers["x-gcz-key"] = process.env.GCZ_CONTROL_KEY;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI format failed (${response.status})`);
    }

    const data = await response.json();
    if (data?.message) {
      return data.message;
    }
    if (data?.text) {
      return data.text;
    }
    return null;
  } catch (err) {
    logger.warn("promo-formatter", "AI format unavailable; using fallback", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function formatPromoMessage(promo, affiliateLink = "") {
  const aiMessage = await formatWithAi(promo, affiliateLink);
  if (aiMessage) {
    return { message: aiMessage, mode: "ai" };
  }

  const fallback = buildFallback(promo, affiliateLink);
  return { message: fallback, mode: "fallback" };
}

export function loadPromoRules() {
  return loadRules();
}
