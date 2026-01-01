/**
 * Discord Content Sanitizer
 * Strips ALL Discord metadata to enforce privacy requirements
 */

/**
 * Sanitize message content - removes Discord-specific metadata
 * @param {string} content - Raw message content
 * @returns {string} - Sanitized content
 */
export function sanitizeContent(content) {
  if (!content) return '';
  
  let sanitized = content.trim();
  
  // Remove Discord user mentions (@user)
  sanitized = sanitized.replace(/<@!?\d+>/g, '');
  
  // Remove Discord role mentions (@role)
  sanitized = sanitized.replace(/<@&\d+>/g, '');
  
  // Remove Discord channel mentions (#channel)
  sanitized = sanitized.replace(/<#\d+>/g, '');
  
  // Remove Discord custom emoji (<:name:id>)
  sanitized = sanitized.replace(/<:\w+:\d+>/g, '');
  
  // Remove Discord animated emoji (<a:name:id>)
  sanitized = sanitized.replace(/<a:\w+:\d+>/g, '');
  
  // Remove Discord message links (discord.com/channels/...)
  sanitized = sanitized.replace(/https?:\/\/(?:discord\.com|discordapp\.com)\/channels\/\d+\/\d+\/\d+/gi, '');
  
  // Clean up extra whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Sanitize an array of messages (for context)
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Array of sanitized message content strings
 */
export function sanitizeMessageContext(messages) {
  return messages
    .map(msg => sanitizeContent(msg.content || ''))
    .filter(content => content.length > 0);
}

/**
 * Check if content contains a promo code pattern
 * @param {string} content - Message content
 * @returns {boolean} - True if content looks like a promo
 */
export function looksLikePromo(content) {
  if (!content) return false;
  
  const sanitized = sanitizeContent(content);
  
  // Check for URL patterns
  const urlPattern = /https?:\/\/.+/i;
  if (urlPattern.test(sanitized)) return true;
  
  // Check for code patterns
  const codePatterns = [
    /\b[A-Z]{3,15}\d{2,10}\b/,
    /\b[A-Z]{4,20}\b/,
    /(?:code|promo|bonus|coupon)[\s:]+([A-Z0-9]{4,20})/i,
  ];
  
  if (codePatterns.some(pattern => pattern.test(sanitized))) return true;
  
  // Check for promo-related keywords
  const promoKeywords = ['bonus', 'code', 'promo', 'coupon', 'deal', 'offer', 'discount'];
  const lowerContent = sanitized.toLowerCase();
  if (promoKeywords.some(keyword => lowerContent.includes(keyword))) return true;
  
  return false;
}
