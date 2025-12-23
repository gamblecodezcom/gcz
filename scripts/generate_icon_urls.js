#!/usr/bin/env node
/**
 * Icon URL Generation Script
 * 
 * Generates icon URLs for all affiliates using Google favicon API.
 * Can be run to populate icon_urls for existing affiliates or regenerate them.
 * 
 * Usage: 
 *   node scripts/generate_icon_urls.js           # Generate for all affiliates missing icons
 *   node scripts/generate_icon_urls.js --force    # Regenerate all icon URLs
 *   node scripts/generate_icon_urls.js --id=123   # Generate for specific affiliate ID
 */

require('dotenv').config();
const db = require('../db');
const { URL } = require('url');

// Configuration
const GOOGLE_FAVICON_API = 'https://www.google.com/s2/favicons?domain={domain}&sz=64';

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

/**
 * Generate icon URL from domain
 */
function generateIconUrl(domain) {
  if (!domain) return null;
  return GOOGLE_FAVICON_API.replace('{domain}', domain);
}

/**
 * Main generation function
 */
async function generateIconUrls(options = {}) {
  const { force = false, affiliateId = null } = options;

  console.log('🎨 Starting icon URL generation...\n');

  try {
    let sql = 'SELECT id, name, slug, referral_url, final_redirect_url, icon_url FROM affiliates';
    const params = [];

    if (affiliateId) {
      sql += ' WHERE id = $1';
      params.push(affiliateId);
    } else if (!force) {
      sql += ' WHERE icon_url IS NULL OR icon_url = \'\'';
    }

    sql += ' ORDER BY name ASC';

    const affiliates = await db.query(sql, params);

    if (affiliates.length === 0) {
      console.log('✅ No affiliates need icon URL generation.');
      return;
    }

    console.log(`📊 Processing ${affiliates.length} affiliate(s)...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const affiliate of affiliates) {
      const url = affiliate.final_redirect_url || affiliate.referral_url;
      
      if (!url) {
        console.log(`⚠️  ${affiliate.slug || affiliate.name}: No URL available`);
        errorCount++;
        continue;
      }

      const domain = extractDomain(url);
      if (!domain) {
        console.log(`⚠️  ${affiliate.slug || affiliate.name}: Could not extract domain from ${url}`);
        errorCount++;
        continue;
      }

      const iconUrl = generateIconUrl(domain);
      
      try {
        await db.query(
          'UPDATE affiliates SET icon_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [iconUrl, affiliate.id]
        );
        console.log(`✅ ${affiliate.slug || affiliate.name}: ${iconUrl}`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${affiliate.slug || affiliate.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${affiliates.length}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  affiliateId: null
};

const idArg = args.find(arg => arg.startsWith('--id='));
if (idArg) {
  options.affiliateId = parseInt(idArg.split('=')[1]);
}

// Run if called directly
if (require.main === module) {
  generateIconUrls(options)
    .then(() => {
      console.log('✅ Icon URL generation complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Icon URL generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateIconUrls, generateIconUrl, extractDomain };
