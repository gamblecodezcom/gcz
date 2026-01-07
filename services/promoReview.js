import fetch from "node-fetch";
import logger from "../utils/logger.js";

function normalizeText(text) {
  return String(text || "").trim();
}

function detectPromoType(text) {
  const urlMatch = text.match(/https?:\/\/\S+/i);
  if (urlMatch) return "url";

  const codeMatch = text.match(/\b[A-Z0-9]{6,12}\b/);
  if (codeMatch) return "code";

  return "unknown";
}

function heuristicReview(text) {
  const normalized = normalizeText(text);
  const promoType = detectPromoType(normalized);

  if (!normalized || normalized.length < 5) {
    return {
      decision: "likely_spam",
      confidence: 0.1,
      type: promoType,
      cleaned_text: null,
      reason: "empty_or_short",
      mode: "heuristic",
    };
  }

  const hasUrl = promoType === "url";
  const hasCode = promoType === "code";
  const confidence = hasUrl || hasCode ? 0.78 : 0.35;

  return {
    decision: hasUrl || hasCode ? "likely_valid" : "uncertain",
    confidence,
    type: promoType,
    cleaned_text: null,
    reason: hasUrl || hasCode ? "pattern_match" : "no_pattern",
    mode: "heuristic",
  };
}

async function aiReview(text) {
  const endpoint = process.env.PROMO_AI_REVIEW_URL;
  if (!endpoint) {
    return null;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`AI review failed (${response.status})`);
    }

    const data = await response.json();
    return {
      decision: data.decision || "uncertain",
      confidence: Number.isFinite(data.confidence)
        ? Number(data.confidence)
        : 0.5,
      type: data.type || detectPromoType(text),
      cleaned_text: data.cleaned_text || null,
      reason: data.reason || "ai_review",
      mode: "ai",
      raw: data,
    };
  } catch (err) {
    logger.warn("promo-review", "AI review unavailable; using fallback", err);
    return null;
  }
}

export async function reviewPromo(text) {
  const normalized = normalizeText(text);
  const aiResult = await aiReview(normalized);
  if (aiResult) return aiResult;
  return heuristicReview(normalized);
}

export function shouldAutoApprove(review) {
  const enabled = process.env.PROMO_AUTO_APPROVE === "true";
  const minConfidence = Number.parseFloat(
    process.env.PROMO_AUTO_APPROVE_MIN_CONF || "0.85"
  );

  return (
    enabled &&
    review.decision === "likely_valid" &&
    review.confidence >= minConfidence
  );
}
