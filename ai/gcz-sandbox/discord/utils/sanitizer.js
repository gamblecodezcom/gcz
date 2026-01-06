/**
 * STRICT DISCORD PRIVACY SANITIZER
 * - Removes ALL Discord metadata + IDs
 * - Content-only, zero user traceability
 * - Safe for storage & AI ingestion
 */

function normalize(str = '') {
  return str
    .normalize('NFKC')  // normalize unicode forms
    .replace(/\u200B/g, '') // remove zero-width chars
    .trim();
}

/**
 * Sanitize single message
 */
export function sanitizeContent(content) {
  if (!content) return '';

  let sanitized = normalize(content);

  // strip mentions (@user)
  sanitized = sanitized.replace(/<@!?\d+>/g, '');

  // strip role mentions
  sanitized = sanitized.replace(/<@&\d+>/g, '');

  // strip channel mentions
  sanitized = sanitized.replace(/<#\d+>/g, '');

  // strip custom emoji
  sanitized = sanitized.replace(/<a?:\w+:\d+>/gi, '');

  // strip message/guild links
  sanitized = sanitized.replace(
    /https?:\/\/(?:canary\.|ptb\.)?(?:discord(?:app)?\.com)\/channels\/\d+\/\d+\/\d+/gi,
    ''
  );

  // strip raw discord snowflake IDs anywhere
  sanitized = sanitized.replace(/\b\d{17,22}\b/g, '');

  // strip code-block formatting
  sanitized = sanitized.replace(/```[\s\S]*?```/g, m =>
    m.replace(/```/g, '')
  );

  // strip inline code formatting
  sanitized = sanitized.replace(/`([^`]+)`/g, '$1');

  // collapse whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized || '';
}

/**
 * Sanitize batch
 */
export function sanitizeMessageContext(messages = []) {
  return messages
    .map(m => sanitizeContent(m?.content || ''))
    .filter(Boolean);
}

/**
 * Detect promo-like content
 */
export function looksLikePromo(content) {
  if (!content) return false;

  const sanitized = sanitizeContent(content);

  if (!sanitized) return false;

  // URL = instant promo flag
  if (/https?:\/\/\S+/i.test(sanitized)) return true;

  // Strong promo patterns
  const codePatterns = [
    /\b[A-Z0-9]{4,20}\b/,                 // CODE123 / BONUS / DF42
    /(?:promo|bonus|code|coupon)\s*[:\- ]+\s*[A-Z0-9]{3,20}/i,
    /\b(use|enter|apply)\b.*\bcode\b/i,   // “use code…”
  ];

  if (codePatterns.some(r => r.test(sanitized))) return true;

  // Keyword heuristics
  const keywords = [
    'bonus',
    'promo',
    'code',
    'coupon',
    'deal',
    'offer',
    'discount',
    'redeem',
    'claim'
  ];

  const lower = sanitized.toLowerCase();

  if (keywords.some(k => lower.includes(k))) return true;

  return false;
}
