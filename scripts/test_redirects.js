#!/usr/bin/env node
/**
 * Redirect Testing Script
 * 
 * Tests all non-blacklisted affiliate redirects to ensure they resolve correctly.
 * 
 * Usage: node scripts/test_redirects.js
 */

require('dotenv').config();
const db = require('../db');
const axios = require('axios');
const { URL } = require('url');

// Configuration
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 10000;
const USER_AGENT = 'GambleCodez-Redirect-Tester/1.0';

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
 * Test a single redirect URL
 */
async function testRedirect(url, slug) {
  const results = {
    slug,
    url,
    status: 'unknown',
    httpStatus: null,
    finalUrl: null,
    redirectChain: [],
    error: null,
    domain: extractDomain(url),
    timestamp: new Date().toISOString()
  };

  try {
    const response = await axios.get(url, {
      maxRedirects: MAX_REDIRECTS,
      timeout: TIMEOUT_MS,
      validateStatus: () => true, // Don't throw on any status
      headers: {
        'User-Agent': USER_AGENT
      },
      // Track redirects
      maxRedirects: MAX_REDIRECTS,
      // Don't follow redirects automatically - we want to see the chain
    });

    results.httpStatus = response.status;
    results.finalUrl = response.request.res.responseUrl || url;

    // Check if final URL is different from original
    if (results.finalUrl !== url) {
      results.redirectChain.push({
        from: url,
        to: results.finalUrl
      });
    }

    // Determine status
    if (response.status >= 200 && response.status < 400) {
      results.status = 'success';
    } else if (response.status >= 400 && response.status < 500) {
      results.status = 'client_error';
    } else if (response.status >= 500) {
      results.status = 'server_error';
    } else {
      results.status = 'unknown_status';
    }

  } catch (error) {
    results.status = 'error';
    results.error = error.message;
    
    if (error.code === 'ECONNREFUSED') {
      results.status = 'connection_refused';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      results.status = 'timeout';
    } else if (error.code === 'ENOTFOUND') {
      results.status = 'dns_error';
    }
  }

  return results;
}

/**
 * Validate domain safety (basic check)
 */
function isDomainSafe(domain) {
  if (!domain) return false;
  
  // Basic blacklist of known bad domains (expand as needed)
  const blacklist = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'malicious.example.com'
  ];
  
  return !blacklist.some(bad => domain.includes(bad));
}

/**
 * Main testing function
 */
async function testAllRedirects() {
  console.log('🔍 Starting redirect testing...\n');

  try {
    // Get all non-blacklisted affiliates
    const affiliates = await db.query(`
      SELECT id, slug, name, referral_url, final_redirect_url, status, icon_url
      FROM affiliates
      WHERE status != 'banned'
      ORDER BY name ASC
    `);

    if (affiliates.length === 0) {
      console.log('⚠️  No active affiliates found.');
      return;
    }

    console.log(`📊 Testing ${affiliates.length} affiliate(s)...\n`);

    const results = [];
    const summary = {
      total: affiliates.length,
      success: 0,
      error: 0,
      client_error: 0,
      server_error: 0,
      timeout: 0,
      connection_refused: 0,
      dns_error: 0,
      unsafe_domain: 0
    };

    // Test each affiliate
    for (const affiliate of affiliates) {
      const testUrl = affiliate.final_redirect_url || affiliate.referral_url;
      
      if (!testUrl) {
        console.log(`⚠️  ${affiliate.slug || affiliate.name}: No URL to test`);
        results.push({
          slug: affiliate.slug,
          name: affiliate.name,
          status: 'no_url',
          error: 'No redirect URL configured'
        });
        summary.error++;
        continue;
      }

      const domain = extractDomain(testUrl);
      if (!isDomainSafe(domain)) {
        console.log(`🚫 ${affiliate.slug || affiliate.name}: Unsafe domain - ${domain}`);
        results.push({
          slug: affiliate.slug,
          name: affiliate.name,
          status: 'unsafe_domain',
          domain,
          url: testUrl
        });
        summary.unsafe_domain++;
        continue;
      }

      process.stdout.write(`Testing ${affiliate.slug || affiliate.name}... `);
      const testResult = await testRedirect(testUrl, affiliate.slug);
      testResult.name = affiliate.name;
      results.push(testResult);

      // Update summary
      if (testResult.status === 'success') {
        summary.success++;
        console.log('✅');
      } else {
        summary[testResult.status] = (summary[testResult.status] || 0) + 1;
        console.log(`❌ (${testResult.status})`);
      }

      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tested: ${summary.total}`);
    console.log(`✅ Success: ${summary.success}`);
    console.log(`❌ Errors: ${summary.error}`);
    console.log(`🔴 Client errors (4xx): ${summary.client_error}`);
    console.log(`🔴 Server errors (5xx): ${summary.server_error}`);
    console.log(`⏱️  Timeouts: ${summary.timeout}`);
    console.log(`🔌 Connection refused: ${summary.connection_refused}`);
    console.log(`🌐 DNS errors: ${summary.dns_error}`);
    console.log(`🚫 Unsafe domains: ${summary.unsafe_domain}`);
    console.log('='.repeat(60) + '\n');

    // Print detailed results for failures
    const failures = results.filter(r => r.status !== 'success' && r.status !== 'no_url');
    if (failures.length > 0) {
      console.log('❌ FAILED REDIRECTS:\n');
      failures.forEach(result => {
        console.log(`  • ${result.slug || result.name}:`);
        console.log(`    Status: ${result.status}`);
        console.log(`    URL: ${result.url}`);
        if (result.httpStatus) {
          console.log(`    HTTP Status: ${result.httpStatus}`);
        }
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
        console.log('');
      });
    }

    // Optionally save results to database
    // You could create a redirect_health table to track this over time
    console.log('💾 Results logged to console. Consider saving to database for historical tracking.\n');

  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run if called directly
if (require.main === module) {
  testAllRedirects()
    .then(() => {
      console.log('✅ Testing complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAllRedirects, testRedirect };
