import pool from '../utils/db.js';
import { logger } from '../bot/utils/logger.js';

/**
 * AI Classification Pipeline for GambleCodez Drops
 * Processes RawDrops and creates PromoCandidates with AI-powered classification
 */

/**
 * Extract URLs from text using regex
 */
function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return matches.map(url => url.trim().replace(/[.,;!?]+$/, ''));
}

/**
 * Extract potential bonus codes from text
 * Enhanced with more patterns and context awareness
 */
function extractBonusCodeCandidates(text) {
  const codePatterns = [
    // Standard patterns: CODE123, BONUS456, PROMO789
    /\b[A-Z]{3,15}\d{2,10}\b/g,
    // All caps codes: BONUSCODE, PROMO2024
    /\b[A-Z]{4,20}\b/g,
    // Mixed: CODE123BONUS, BONUS2024CODE
    /\b[A-Z]+\d+[A-Z]+\b/g,
    // Codes with dashes: CODE-123, BONUS-456
    /\b[A-Z]{3,15}-?\d{2,10}\b/g,
    // Codes after keywords: "code: ABC123", "promo: XYZ789"
    /(?:code|promo|bonus|coupon)[\s:]+([A-Z0-9]{4,20})/gi,
    // Codes in quotes or brackets: "CODE123", [BONUS456]
    /["\[\(]([A-Z0-9]{4,20})["\]\)]/g,
    // Codes with separators: CODE_123, BONUS-456
    /\b[A-Z]{3,15}[_-]\d{2,10}\b/g,
  ];
  
  const candidates = new Set();
  
  // Common false positives to exclude
  const excludePatterns = [
    /^HTTP/i,
    /^HTTPS/i,
    /^WWW/i,
    /^COM$/i,
    /^NET$/i,
    /^ORG$/i,
    /^\d+$/,
  ];
  
  codePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Extract the code part (handle groups)
        const code = match.groups ? match.groups[1] || match[1] : match;
        if (!code) return;
        
        const codeUpper = code.toUpperCase().trim();
        
        // Validate length
        if (codeUpper.length < 4 || codeUpper.length > 25) return;
        
        // Exclude common false positives
        if (excludePatterns.some(exclude => exclude.test(codeUpper))) return;
        
        // Must have at least one letter and optionally numbers
        if (!/[A-Z]/.test(codeUpper)) return;
        
        candidates.add(codeUpper);
      });
    }
  });
  
  // Sort by length (shorter codes are often more likely to be real)
  return Array.from(candidates).sort((a, b) => a.length - b.length);
}

/**
 * Resolve redirector URLs (d10k, etc.) to final domain
 * Attempts to follow redirects up to 3 levels
 */
async function resolveDomain(url) {
  if (!url) return null;
  
  try {
    // Check if it's a known redirector pattern
    const redirectorPatterns = [
      /d10k\.io/i,
      /bit\.ly/i,
      /tinyurl\.com/i,
      /t\.co/i,
      /short\.link/i,
      /goo\.gl/i,
    ];
    
    const isRedirector = redirectorPatterns.some(pattern => pattern.test(url));
    
    if (isRedirector) {
      // Try to follow redirects (with timeout)
      try {
        const fetch = (await import('node-fetch')).default;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GambleCodezBot/1.0)'
          }
        });
        
        clearTimeout(timeout);
        
        if (response.ok && response.url) {
          const finalUrl = new URL(response.url);
          return finalUrl.hostname.replace(/^www\./, '');
        }
      } catch (fetchError) {
        // If fetch fails, fall back to extracting from original URL
        logger.warn(`Could not resolve redirector ${url}:`, fetchError.message);
      }
    }
    
    // Try to extract domain from URL
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (e) {
      return null;
    }
  } catch (error) {
    logger.error('Error resolving domain:', error);
    return null;
  }
}

/**
 * Guess casino name from domain or text
 * Enhanced with fuzzy matching and multiple domain patterns
 */
async function guessCasino(domain, text, affiliates) {
  if (!domain && !text) return null;
  
  // Normalize domain (remove www, protocol, paths)
  const normalizeDomain = (d) => {
    if (!d) return null;
    try {
      const url = d.startsWith('http') ? new URL(d) : new URL(`https://${d}`);
      return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return d.toLowerCase().replace(/^www\./, '').split('/')[0];
    }
  };
  
  const normalizedDomain = domain ? normalizeDomain(domain) : null;
  
  // First, try exact domain match
  if (normalizedDomain) {
    for (const affiliate of affiliates) {
      if (affiliate.resolved_domain) {
        const affiliateDomain = normalizeDomain(affiliate.resolved_domain);
        if (affiliateDomain === normalizedDomain) {
          return affiliate.name;
        }
      }
    }
  }
  
  // Then, try partial domain match (subdomain or parent domain)
  if (normalizedDomain) {
    const domainParts = normalizedDomain.split('.');
    for (const affiliate of affiliates) {
      if (affiliate.resolved_domain) {
        const affiliateDomain = normalizeDomain(affiliate.resolved_domain);
        const affiliateParts = affiliateDomain.split('.');
        
        // Check if main domain matches (e.g., stake.com matches stake.us)
        if (domainParts.length >= 2 && affiliateParts.length >= 2) {
          const mainDomain = domainParts.slice(-2).join('.');
          const affiliateMain = affiliateParts.slice(-2).join('.');
          if (mainDomain === affiliateMain) {
            return affiliate.name;
          }
        }
        
        // Check if one contains the other
        if (normalizedDomain.includes(affiliateDomain) || affiliateDomain.includes(normalizedDomain)) {
          return affiliate.name;
        }
      }
    }
  }
  
  // Try to match by name in text (case-insensitive, word boundaries)
  if (text) {
    const textLower = text.toLowerCase();
    const textWords = textLower.split(/\s+/);
    
    // First try exact name match
    for (const affiliate of affiliates) {
      const nameLower = affiliate.name.toLowerCase();
      if (textLower.includes(nameLower)) {
        return affiliate.name;
      }
    }
    
    // Then try partial name match (at least 3 characters)
    for (const affiliate of affiliates) {
      const nameLower = affiliate.name.toLowerCase();
      const nameWords = nameLower.split(/\s+/);
      
      // Check if any word from casino name appears in text
      for (const nameWord of nameWords) {
        if (nameWord.length >= 3 && textWords.some(tw => tw.includes(nameWord) || nameWord.includes(tw))) {
          return affiliate.name;
        }
      }
    }
  }
  
  return null;
}

/**
 * Guess jurisdiction based on casino or text patterns
 * Enhanced with better pattern matching and multiple jurisdiction support
 */
function guessJurisdiction(casinoName, text, affiliates) {
  if (!casinoName && !text) return null;
  
  const jurisdictions = [];
  
  // Check if casino is in affiliates and has jurisdiction info
  if (casinoName) {
    const affiliate = affiliates.find(a => a.name === casinoName);
    if (affiliate) {
      // US/Sweeps jurisdiction
      if (affiliate.jurisdiction === 'US' || affiliate.sc_allowed) {
        jurisdictions.push('USA Daily');
      }
      // Crypto jurisdiction
      if (affiliate.crypto_allowed) {
        jurisdictions.push('Crypto Daily');
      }
      // Global/Everywhere
      if (affiliate.jurisdiction === 'GLOBAL' || (!affiliate.sc_allowed && !affiliate.crypto_allowed)) {
        jurisdictions.push('Everywhere');
      }
    }
  }
  
  // Pattern matching in text (more comprehensive)
  const textLower = (text || '').toLowerCase();
  
  // USA/Sweeps patterns
  const usaPatterns = [
    'usa', 'us only', 'united states', 'sweeps', 'sweepstakes',
    'sweeps coins', 'sc casino', 'us licensed', 'us players',
    'america', 'american', 'states only'
  ];
  if (usaPatterns.some(pattern => textLower.includes(pattern))) {
    if (!jurisdictions.includes('USA Daily')) {
      jurisdictions.push('USA Daily');
    }
  }
  
  // Crypto patterns
  const cryptoPatterns = [
    'crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth',
    'solana', 'sol', 'usdt', 'usdc', 'crypto casino', 'crypto gambling',
    'blockchain', 'defi', 'web3'
  ];
  if (cryptoPatterns.some(pattern => textLower.includes(pattern))) {
    if (!jurisdictions.includes('Crypto Daily')) {
      jurisdictions.push('Crypto Daily');
    }
  }
  
  // Global/Everywhere patterns
  const globalPatterns = [
    'global', 'worldwide', 'international', 'everywhere', 'all countries',
    'no restrictions', 'anywhere'
  ];
  if (globalPatterns.some(pattern => textLower.includes(pattern))) {
    if (!jurisdictions.includes('Everywhere')) {
      jurisdictions.push('Everywhere');
    }
  }
  
  // Return first match, or default to Everywhere
  return jurisdictions.length > 0 ? jurisdictions[0] : 'Everywhere';
}

/**
 * Determine promo type based on extracted data
 */
function determinePromoType(codes, urls) {
  const hasCode = codes && codes.length > 0;
  const hasUrl = urls && urls.length > 0;
  
  if (hasCode && hasUrl) return 'hybrid';
  if (hasCode) return 'code';
  if (hasUrl) return 'url';
  return 'info_only';
}

/**
 * Generate headline from text and casino
 */
function generateHeadline(text, casino, code) {
  if (casino && code) {
    return `${casino} Bonus Code: ${code}`;
  }
  if (casino) {
    return `${casino} Promo Available`;
  }
  if (code) {
    return `Bonus Code: ${code}`;
  }
  
  // Extract first sentence or first 60 chars
  const firstSentence = text.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 0 && firstSentence.length <= 60) {
    return firstSentence;
  }
  
  return text.substring(0, 60).trim() + (text.length > 60 ? '...' : '');
}

/**
 * Generate description from text
 */
function generateDescription(text, headline) {
  // Remove headline from description if it's similar
  let desc = text.trim();
  if (headline && desc.toLowerCase().includes(headline.toLowerCase())) {
    desc = desc.replace(new RegExp(headline, 'gi'), '').trim();
  }
  
  // Take first 200 chars or first two sentences
  const sentences = desc.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length >= 2) {
    return (sentences[0] + '. ' + sentences[1] + '.').substring(0, 200);
  }
  
  return desc.substring(0, 200).trim();
}

/**
 * Calculate validity score (0-1)
 */
function calculateValidityScore(text, codes, urls, domain, casino) {
  let score = 0.0;
  
  // Has code or URL: +0.4
  if ((codes && codes.length > 0) || (urls && urls.length > 0)) {
    score += 0.4;
  }
  
  // Has both: +0.2
  if ((codes && codes.length > 0) && (urls && urls.length > 0)) {
    score += 0.2;
  }
  
  // Has resolved domain: +0.2
  if (domain) {
    score += 0.2;
  }
  
  // Has mapped casino: +0.2
  if (casino) {
    score += 0.2;
  }
  
  // Text length check (not too short, not too long)
  if (text.length >= 20 && text.length <= 500) {
    score += 0.1;
  }
  
  return Math.min(1.0, score);
}

/**
 * Check for spam patterns
 */
function detectSpam(text) {
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /[A-Z]{20,}/, // ALL CAPS
    /http.*http.*http/, // Multiple URLs
    /(free|win|click|now){3,}/i, // Spammy words repeated
  ];
  
  return spamPatterns.some(pattern => pattern.test(text));
}

/**
 * Check for duplicates (simplified - in production, use fuzzy matching)
 */
async function checkDuplicate(rawDropId, text, codes, urls) {
  // Check recent raw_drops for similar content
  const result = await pool.query(
    `SELECT id FROM raw_drops 
     WHERE id != $1 
     AND created_at > NOW() - INTERVAL '7 days'
     AND (
       raw_text = $2 
       OR raw_text LIKE $3
     )
     LIMIT 1`,
    [rawDropId, text, `%${text.substring(0, 50)}%`]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  // Check by codes
  if (codes && codes.length > 0) {
    const codeResult = await pool.query(
      `SELECT rd.id FROM raw_drops rd
       JOIN ai_classification_snapshots acs ON acs.raw_drop_id = rd.id
       WHERE rd.id != $1
       AND rd.created_at > NOW() - INTERVAL '7 days'
       AND acs.extracted_codes && $2::text[]
       LIMIT 1`,
      [rawDropId, codes]
    );
    
    if (codeResult.rows.length > 0) {
      return codeResult.rows[0].id;
    }
  }
  
  return null;
}

/**
 * Main AI classification function
 * Processes a RawDrop and creates PromoCandidate
 */
export async function classifyRawDrop(rawDropId) {
  try {
    // Get raw drop
    const rawDropResult = await pool.query(
      'SELECT * FROM raw_drops WHERE id = $1',
      [rawDropId]
    );
    
    if (rawDropResult.rows.length === 0) {
      throw new Error(`RawDrop ${rawDropId} not found`);
    }
    
    const rawDrop = rawDropResult.rows[0];
    
    // Update status to processing
    await pool.query(
      'UPDATE raw_drops SET status = $1, processed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['processing', rawDropId]
    );
    
    // Extract basic data
    const extractedUrls = extractUrls(rawDrop.raw_text);
    const extractedCodes = extractBonusCodeCandidates(rawDrop.raw_text);
    
    // Resolve domains
    const resolvedDomains = [];
    for (const url of extractedUrls) {
      const domain = await resolveDomain(url);
      if (domain) {
        resolvedDomains.push(domain);
      }
    }
    
    // Get affiliates for matching
    const affiliatesResult = await pool.query(
      'SELECT id, name, resolved_domain, jurisdiction, sc_allowed, crypto_allowed FROM affiliates_master'
    );
    const affiliates = affiliatesResult.rows;
    
    // Guess casino
    const guessedCasino = await guessCasino(
      resolvedDomains[0] || null,
      rawDrop.raw_text,
      affiliates
    );
    
    // Guess jurisdiction
    const guessedJurisdiction = guessJurisdiction(
      guessedCasino,
      rawDrop.raw_text,
      affiliates
    );
    
    // Determine if it's a promo (basic heuristic - can be enhanced with LLM)
    const isPromo = extractedCodes.length > 0 || extractedUrls.length > 0 || 
                    (rawDrop.raw_text.length > 20 && 
                     (rawDrop.raw_text.toLowerCase().includes('bonus') ||
                      rawDrop.raw_text.toLowerCase().includes('code') ||
                      rawDrop.raw_text.toLowerCase().includes('promo')));
    
    // Calculate confidence (simplified)
    let confidence = 0.5;
    if (extractedCodes.length > 0) confidence += 0.2;
    if (extractedUrls.length > 0) confidence += 0.2;
    if (guessedCasino) confidence += 0.1;
    confidence = Math.min(1.0, confidence);
    
    // Generate headline and description
    const proposedHeadline = generateHeadline(
      rawDrop.raw_text,
      guessedCasino,
      extractedCodes[0] || null
    );
    const proposedDescription = generateDescription(rawDrop.raw_text, proposedHeadline);
    
    // Calculate validity
    const validityScore = calculateValidityScore(
      rawDrop.raw_text,
      extractedCodes,
      extractedUrls,
      resolvedDomains[0] || null,
      guessedCasino
    );
    
    // Detect spam
    const isSpam = detectSpam(rawDrop.raw_text);
    
    // Check duplicates
    const duplicateOf = await checkDuplicate(
      rawDropId,
      rawDrop.raw_text,
      extractedCodes,
      extractedUrls
    );
    const isDuplicate = duplicateOf !== null;
    
    // Find mapped casino ID if casino was guessed
    let mappedCasinoId = null;
    if (guessedCasino) {
      const casinoMatch = affiliates.find(a => a.name === guessedCasino);
      if (casinoMatch) {
        mappedCasinoId = casinoMatch.id;
      }
    }
    
    // Create AI classification snapshot
    const snapshotResult = await pool.query(
      `INSERT INTO ai_classification_snapshots (
        raw_drop_id, is_promo, confidence_score, extracted_codes, extracted_urls,
        resolved_domains, guessed_casino, guessed_jurisdiction, proposed_headline,
        proposed_description, validity_score, is_spam, is_duplicate, duplicate_of_raw_drop_id,
        model_name, model_version, label, score, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        rawDropId,
        isPromo,
        confidence,
        extractedCodes,
        extractedUrls,
        resolvedDomains,
        guessedCasino,
        guessedJurisdiction,
        proposedHeadline,
        proposedDescription,
        validityScore,
        isSpam,
        isDuplicate,
        duplicateOf,
        'rule-based-v1', // Model name
        '1.0.0', // Model version
        isPromo ? 'promo' : 'non_promo', // Label
        confidence, // Score
        JSON.stringify({
          extracted_codes_count: extractedCodes.length,
          extracted_urls_count: extractedUrls.length,
          resolved_domains_count: resolvedDomains.length,
          has_casino_match: !!guessedCasino,
          has_jurisdiction: !!guessedJurisdiction,
          validity_breakdown: {
            has_code_or_url: (extractedCodes.length > 0 || extractedUrls.length > 0),
            has_both: (extractedCodes.length > 0 && extractedUrls.length > 0),
            has_domain: resolvedDomains.length > 0,
            has_casino: !!guessedCasino,
            text_length_ok: rawDrop.raw_text.length >= 20 && rawDrop.raw_text.length <= 500
          }
        })
      ]
    );
    
    const snapshot = snapshotResult.rows[0];
    
    // Only create PromoCandidate if it's a promo
    let promoCandidate = null;
    if (isPromo && !isSpam && !isDuplicate) {
      const promoType = determinePromoType(extractedCodes, extractedUrls);
      // Support multiple jurisdictions
      const jurisdictionTags = guessedJurisdiction ? [guessedJurisdiction] : [];
      
      // If casino is mapped, try to get additional jurisdiction info
      if (mappedCasinoId) {
        const casinoAffiliate = affiliates.find(a => a.id === mappedCasinoId);
        if (casinoAffiliate) {
          if (casinoAffiliate.sc_allowed && !jurisdictionTags.includes('USA Daily')) {
            jurisdictionTags.push('USA Daily');
          }
          if (casinoAffiliate.crypto_allowed && !jurisdictionTags.includes('Crypto Daily')) {
            jurisdictionTags.push('Crypto Daily');
          }
        }
      }
      
      const candidateResult = await pool.query(
        `INSERT INTO promo_candidates (
          raw_drop_id, ai_snapshot_id, headline, description, promo_type,
          bonus_code, promo_url, resolved_domain, mapped_casino_id,
          jurisdiction_tags, validity_score, is_spam, is_duplicate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          rawDropId,
          snapshot.id,
          proposedHeadline,
          proposedDescription,
          promoType,
          extractedCodes[0] || null,
          extractedUrls[0] || null,
          resolvedDomains[0] || null,
          mappedCasinoId,
          jurisdictionTags,
          validityScore,
          isSpam,
          isDuplicate
        ]
      );
      
      promoCandidate = candidateResult.rows[0];
    }
    
    // Update raw drop status
    await pool.query(
      'UPDATE raw_drops SET status = $1 WHERE id = $2',
      ['classified', rawDropId]
    );
    
    return {
      rawDrop,
      snapshot,
      promoCandidate
    };
    
  } catch (error) {
    logger.error('Error classifying raw drop:', error);
    
    // Mark as error
    await pool.query(
      'UPDATE raw_drops SET status = $1 WHERE id = $2',
      ['error', rawDropId]
    );
    
    throw error;
  }
}

/**
 * Process pending raw drops in batch
 */
export async function processPendingRawDrops(limit = 10) {
  const result = await pool.query(
    `SELECT id FROM raw_drops 
     WHERE status = 'pending' 
     ORDER BY created_at ASC 
     LIMIT $1`,
    [limit]
  );
  
  const processed = [];
  for (const row of result.rows) {
    try {
      const classification = await classifyRawDrop(row.id);
      processed.push(classification);
    } catch (error) {
      logger.error(`Error processing raw drop ${row.id}:`, error);
    }
  }
  
  return processed;
}
