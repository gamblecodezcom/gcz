#!/usr/bin/env node
/**
 * DEGEN PROFILE MANAGEMENT TOOL
 * "ONE IDENTITY. ONE PIN. ONE CWALLET. INFINITE DEGEN."
 * 
 * Comprehensive tool for managing GambleCodez Degen Profiles:
 * - Player Identity (username, Telegram, Cwallet, jurisdiction)
 * - PIN security (4-6 digits, hashed)
 * - Linked casino accounts
 * - Crypto addresses (BTC, ETH, SOL, USDT)
 * - Icon/avatar management
 * - Activity logging
 * - Profile validation and fixes
 */

import pool from '../utils/db.js';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const params = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2).replace(/-/g, '_');
    const nextArg = args[i + 1];
    // Check if next arg exists and is not another flag
    if (nextArg && !nextArg.startsWith('--')) {
      // Handle boolean values
      if (nextArg === 'true') {
        params[key] = true;
      } else if (nextArg === 'false') {
        params[key] = false;
      } else {
        params[key] = nextArg;
      }
      i++;
    } else {
      // No value provided, default to true for flags
      params[key] = true;
    }
  }
}

// Helper functions
const log = (msg) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
};

const error = (msg) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${msg}`);
};

const hashPin = (pin) => {
  if (!pin) return null;
  return crypto.createHash('sha256').update(pin).digest('hex');
};

// Audit logging
const auditLog = async (action, resourceType, resourceId, details = {}) => {
  if (!params.audit_log) return;
  
  try {
    await pool.query(
      `INSERT INTO ${params.audit_log} (admin_user, action, resource_type, resource_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        params.super_admin ? 'goose-degen-profile' : 'system',
        action,
        resourceType,
        resourceId,
        JSON.stringify(details)
      ]
    );
  } catch (err) {
    if (params.log_errors) {
      error(`Audit log failed: ${err.message}`);
    }
  }
};

// Activity logging (for Degen Profile activity feed)
const logActivity = async (userId, activityType, title, description, metadata = {}) => {
  try {
    // Check if activity_log table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'activity_log'
      )`
    );
    
    if (!tableCheck.rows[0].exists) {
      // Table doesn't exist, skip logging
      return;
    }
    
    await pool.query(
      `INSERT INTO activity_log (user_id, activity_type, title, description, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [userId, activityType, title, description, JSON.stringify(metadata)]
    );
  } catch (err) {
    if (params.log_errors) {
      error(`Activity log failed: ${err.message}`);
    }
  }
};

// Get user from URL or create identifier
const getUserIdentifier = async (url) => {
  if (!url) return null;
  
  // Extract user ID from URL patterns
  const patterns = [
    /\/profile\?user_id=([^&]+)/,
    /\/profile\/([^\/]+)/,
    /\/dashboard\?user_id=([^&]+)/,
    /\/dashboard\/([^\/]+)/,
    /user_id=([^&]+)/,
    /\/users\/([^\/]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

// ============================================
// DEGEN IDENTITY MANAGEMENT
// ============================================

// Create or update Degen Profile identity
const setupDegenIdentity = async (userId) => {
  if (!params.create_profile && !params.update_identity) return;
  
  log(`Setting up Degen Identity for user: ${userId}`);
  
  try {
    // Check if user exists
    const existing = await pool.query(
      `SELECT * FROM users WHERE user_id = $1`,
      [userId]
    );
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    // Username
    if (params.username || params.rename) {
      const username = params.username || params.rename;
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
      await logActivity(userId, 'username_changed', 'Username Updated', `Changed username to @${username}`);
    }
    
    // Email
    if (params.email || params.profile_email) {
      const email = params.email || params.profile_email;
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    
    // Telegram
    if (params.telegram || params.profile_telegram) {
      const telegram = params.telegram || params.profile_telegram;
      updates.push(`telegram_username = $${paramIndex++}`);
      values.push(telegram.replace('@', ''));
      await logActivity(userId, 'telegram_linked', 'Telegram Linked', `Linked Telegram: @${telegram}`);
    }
    
    // Telegram ID (if provided)
    if (params.telegram_id) {
      updates.push(`telegram_id = $${paramIndex++}`);
      values.push(params.telegram_id);
    }
    
    // Cwallet ID
    if (params.cwallet || params.profile_cwallet) {
      const cwallet = params.cwallet || params.profile_cwallet;
      updates.push(`cwallet_id = $${paramIndex++}`);
      values.push(cwallet);
      await logActivity(userId, 'cwallet_updated', 'Cwallet Updated', 'Updated Cwallet ID');
    }
    
    // Jurisdiction (US, NON_US, GLOBAL)
    if (params.jurisdiction) {
      const validJurisdictions = ['US', 'NON_US', 'GLOBAL'];
      if (validJurisdictions.includes(params.jurisdiction.toUpperCase())) {
        updates.push(`jurisdiction = $${paramIndex++}`);
        values.push(params.jurisdiction.toUpperCase());
      } else {
        error(`Invalid jurisdiction: ${params.jurisdiction}. Must be US, NON_US, or GLOBAL`);
      }
    }
    
    if (existing.rows.length > 0) {
      // Update existing user
      if (updates.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);
        
        await pool.query(
          `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
          values
        );
        log(`✓ Degen Identity updated successfully`);
        await auditLog('degen_identity_updated', 'user', userId, {
          fields: updates.filter(u => !u.includes('updated_at'))
        });
      }
    } else {
      // Create new user
      log(`Creating new Degen Profile: ${userId}`);
      
      const pinHash = (params.pin_4 || params.pin_6 || params.profile_pin_4 || params.profile_pin_6)
        ? hashPin(params.pin_4 || params.pin_6 || params.profile_pin_4 || params.profile_pin_6)
        : null;
      
      const insertValues = [
        userId,
        params.username || params.rename || null,
        params.email || params.profile_email || null,
        params.telegram || params.profile_telegram ? (params.telegram || params.profile_telegram).replace('@', '') : null,
        params.telegram_id || null,
        params.cwallet || params.profile_cwallet || null,
        pinHash,
        params.jurisdiction || null
      ];
      
      await pool.query(
        `INSERT INTO users (
          user_id, username, email, telegram_username, telegram_id, 
          cwallet_id, pin_hash, jurisdiction, created_at, updated_at
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        insertValues
      );
      
      log(`✓ Degen Profile created successfully`);
      await auditLog('degen_profile_created', 'user', userId);
      await logActivity(userId, 'profile_created', 'Profile Created', 'Degen Profile initialized');
    }
  } catch (err) {
    if (params.log_errors) {
      error(`Degen Identity setup failed: ${err.message}`);
    }
    throw err;
  }
};

// ============================================
// PIN SECURITY MANAGEMENT
// ============================================

// Set or update PIN
const managePin = async (userId) => {
  if (!params.set_pin && !params.update_pin) return;
  
  log(`Managing PIN for user: ${userId}`);
  
  try {
    const user = await pool.query(
      `SELECT pin_hash FROM users WHERE user_id = $1`,
      [userId]
    );
    
    if (user.rows.length === 0) {
      throw new Error(`User ${userId} not found`);
    }
    
    const pin = params.set_pin || params.update_pin || params.pin_4 || params.pin_6 || params.profile_pin_4 || params.profile_pin_6;
    
    if (!pin) {
      error('PIN required for set-pin or update-pin operations');
      return;
    }
    
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      error('PIN must be 4-6 digits');
      return;
    }
    
    const pinHash = hashPin(pin);
    const hasExistingPin = !!user.rows[0].pin_hash;
    
    // If updating, verify old PIN
    if (params.update_pin && hasExistingPin && params.old_pin) {
      const oldPinHash = hashPin(params.old_pin);
      if (oldPinHash !== user.rows[0].pin_hash) {
        error('Invalid old PIN');
        return;
      }
    }
    
    await pool.query(
      `UPDATE users SET pin_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [pinHash, userId]
    );
    
    log(`✓ PIN ${hasExistingPin ? 'updated' : 'set'} successfully`);
    await auditLog(hasExistingPin ? 'pin_updated' : 'pin_set', 'user', userId);
    await logActivity(userId, hasExistingPin ? 'pin_changed' : 'pin_set', 'PIN Updated', 'PIN security updated');
  } catch (err) {
    if (params.log_errors) {
      error(`PIN management failed: ${err.message}`);
    }
    throw err;
  }
};

// ============================================
// LINKED CASINO ACCOUNTS
// ============================================

// Link a casino account
const linkCasinoAccount = async (userId) => {
  if (!params.link_site) return;
  
  log(`Linking casino account for user: ${userId}`);
  
  try {
    const siteId = params.site_id;
    const identifierType = params.identifier_type || 'username';
    const identifierValue = params.identifier_value;
    
    if (!siteId || !identifierValue) {
      error('site-id and identifier-value required for link-site');
      return;
    }
    
    if (!['username', 'email', 'player_id'].includes(identifierType)) {
      error('identifier-type must be username, email, or player_id');
      return;
    }
    
    // Verify site exists
    const siteCheck = await pool.query(
      `SELECT id, name, slug FROM affiliates_master WHERE id = $1 OR slug = $1`,
      [siteId]
    );
    
    if (siteCheck.rows.length === 0) {
      error(`Site not found: ${siteId}`);
      return;
    }
    
    const site = siteCheck.rows[0];
    
    // Insert or update linked site
    await pool.query(
      `INSERT INTO user_linked_sites (user_id, site_id, identifier_type, identifier_value, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, site_id) 
       DO UPDATE SET 
         identifier_type = EXCLUDED.identifier_type,
         identifier_value = EXCLUDED.identifier_value,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, site.id.toString(), identifierType, identifierValue]
    );
    
    log(`✓ Linked account to ${site.name} as ${identifierType}: ${identifierValue}`);
    await auditLog('casino_account_linked', 'user', userId, { siteId: site.id, siteName: site.name, identifierType, identifierValue });
    await logActivity(userId, 'account_linked', 'Account Linked', `Linked account to ${site.name}`, { siteId: site.id, siteName: site.name });
  } catch (err) {
    if (params.log_errors) {
      error(`Link casino account failed: ${err.message}`);
    }
    throw err;
  }
};

// Unlink a casino account
const unlinkCasinoAccount = async (userId) => {
  if (!params.unlink_site) return;
  
  log(`Unlinking casino account for user: ${userId}`);
  
  try {
    const siteId = params.site_id;
    
    if (!siteId) {
      error('site-id required for unlink-site');
      return;
    }
    
    const result = await pool.query(
      `DELETE FROM user_linked_sites WHERE user_id = $1 AND site_id = $2`,
      [userId, siteId]
    );
    
    if (result.rowCount === 0) {
      log(`No linked account found for site: ${siteId}`);
      return;
    }
    
    log(`✓ Unlinked account from site: ${siteId}`);
    await auditLog('casino_account_unlinked', 'user', userId, { siteId });
    await logActivity(userId, 'account_unlinked', 'Account Unlinked', `Unlinked account from site ${siteId}`);
  } catch (err) {
    if (params.log_errors) {
      error(`Unlink casino account failed: ${err.message}`);
    }
    throw err;
  }
};

// ============================================
// CRYPTO ADDRESSES
// ============================================

// Update crypto addresses
const updateCryptoAddresses = async (userId) => {
  if (!params.update_crypto_addresses) return;
  
  log(`Updating crypto addresses for user: ${userId}`);
  
  try {
    // Check if crypto_addresses table exists, if not create it
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'crypto_addresses'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      log('Creating crypto_addresses table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS crypto_addresses (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          btc_address TEXT,
          eth_address TEXT,
          sol_address TEXT,
          usdt_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
      log('✓ crypto_addresses table created');
    }
    
    // Insert or update crypto addresses
    await pool.query(
      `INSERT INTO crypto_addresses (user_id, btc_address, eth_address, sol_address, usdt_address, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         btc_address = COALESCE(EXCLUDED.btc_address, crypto_addresses.btc_address),
         eth_address = COALESCE(EXCLUDED.eth_address, crypto_addresses.eth_address),
         sol_address = COALESCE(EXCLUDED.sol_address, crypto_addresses.sol_address),
         usdt_address = COALESCE(EXCLUDED.usdt_address, crypto_addresses.usdt_address),
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        params.btc_address || null,
        params.eth_address || null,
        params.sol_address || null,
        params.usdt_address || null
      ]
    );
    
    log(`✓ Crypto addresses updated`);
    await auditLog('crypto_addresses_updated', 'user', userId);
    await logActivity(userId, 'crypto_addresses_updated', 'Crypto Addresses Updated', 'Updated crypto wallet addresses');
  } catch (err) {
    if (params.log_errors) {
      error(`Update crypto addresses failed: ${err.message}`);
    }
    throw err;
  }
};

// ============================================
// ICON/AVATAR MANAGEMENT
// ============================================

// Fix icon loading and setup
const setupIcon = async (userId) => {
  if (!params.setup_icon && !params.fix_icon_load) return;
  
  log(`Setting up icon for user: ${userId}`);
  
  try {
    // Check if icon columns exist
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'users' AND column_name IN ('icon_url', 'icon_style', 'icon_fallback')`
    );
    
    const existingColumns = result.rows.map(r => r.column_name);
    
    if (!existingColumns.includes('icon_url')) {
      log('Adding icon columns to users table...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS icon_url TEXT,
        ADD COLUMN IF NOT EXISTS icon_style TEXT DEFAULT 'default',
        ADD COLUMN IF NOT EXISTS icon_fallback TEXT
      `);
      log('✓ Icon columns added');
    }
    
    // Update icon settings
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (params.icon_url) {
      updates.push(`icon_url = $${paramIndex++}`);
      values.push(params.icon_url);
    }
    
    if (params.icon_style) {
      const validStyles = ['default', 'hex', 'circle', 'square'];
      if (validStyles.includes(params.icon_style)) {
        updates.push(`icon_style = $${paramIndex++}`);
        values.push(params.icon_style);
      } else {
        error(`Invalid icon_style: ${params.icon_style}. Must be: ${validStyles.join(', ')}`);
      }
    }
    
    if (params.icon_fallback) {
      updates.push(`icon_fallback = $${paramIndex++}`);
      values.push(params.icon_fallback);
    } else if (params.fallback_logic) {
      // Apply default fallback
      updates.push(`icon_fallback = COALESCE(icon_fallback, $${paramIndex++})`);
      values.push('/icon-192.png');
    }
    
    if (updates.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${paramIndex}`,
        values
      );
      log(`✓ Icon settings updated`);
    }
    
    await auditLog('icon_setup', 'user', userId, {
      icon_url: params.icon_url,
      icon_style: params.icon_style,
      icon_fallback: params.icon_fallback || (params.fallback_logic ? '/icon-192.png' : null)
    });
  } catch (err) {
    if (params.log_errors) {
      error(`Icon setup failed: ${err.message}`);
    }
    throw err;
  }
};

// ============================================
// CSS UPGRADE
// ============================================

// Upgrade CSS for Degen Profile components
const upgradeCSS = async () => {
  if (!params.css_upgrade) return;
  
  log('Upgrading CSS for Degen Profile components...');
  
  const cssPath = join(__dirname, '../frontend/src/index.css');
  if (!existsSync(cssPath)) {
    error('CSS file not found');
    return;
  }
  
  try {
    let css = readFileSync(cssPath, 'utf8');
    
    // Add Degen Profile icon loading improvements
    if (!css.includes('/* Degen Profile Icon Loading */')) {
      const iconCSS = `
/* Degen Profile Icon Loading */
.profile-icon {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 0.3s ease;
}

.profile-icon.loading {
  opacity: 0.5;
}

.profile-icon.error {
  background-image: var(--icon-fallback, url('/icon-192.png'));
}

.profile-icon[data-style="hex"] {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.profile-icon[data-style="circle"] {
  border-radius: 50%;
}

.profile-icon[data-style="square"] {
  border-radius: 0;
}

/* Degen Profile Neon Effects */
.border-surge-green {
  animation: borderSurgeGreen 1s ease-out;
}

@keyframes borderSurgeGreen {
  0% { border-color: transparent; }
  50% { border-color: #00FF85; box-shadow: 0 0 20px rgba(0, 255, 133, 0.6); }
  100% { border-color: transparent; }
}
`;
      css += iconCSS;
      writeFileSync(cssPath, css);
      log('✓ CSS upgraded with Degen Profile styles');
    }
  } catch (err) {
    if (params.log_errors) {
      error(`CSS upgrade failed: ${err.message}`);
    }
  }
};

// ============================================
// VALIDATION & DIAGNOSTICS
// ============================================

// Validate Degen Profile completeness
const validateDegenProfile = async (userId) => {
  if (!params.validate_profile) return;
  
  log(`Validating Degen Profile for user: ${userId}`);
  
  try {
    // Check if icon columns exist
    const columnCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'users' AND column_name IN ('icon_url', 'icon_style')`
    );
    const hasIconColumns = columnCheck.rows.length > 0;
    const iconColumns = columnCheck.rows.map(r => r.column_name);
    
    // Build SELECT query based on available columns
    const baseColumns = [
      'user_id', 'username', 'email', 'telegram_username', 'telegram_id',
      'cwallet_id', 'pin_hash', 'jurisdiction'
    ];
    const selectColumns = hasIconColumns 
      ? [...baseColumns, ...iconColumns]
      : baseColumns;
    
    const result = await pool.query(
      `SELECT ${selectColumns.join(', ')}
       FROM users WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      error(`User ${userId} not found`);
      return;
    }
    
    const user = result.rows[0];
    const issues = [];
    const warnings = [];
    const stats = {
      hasUsername: !!user.username,
      hasEmail: !!user.email,
      hasTelegram: !!(user.telegram_username || user.telegram_id),
      hasCwallet: !!user.cwallet_id,
      hasPin: !!user.pin_hash,
      hasJurisdiction: !!user.jurisdiction,
      hasIcon: hasIconColumns ? !!user.icon_url : false
    };
    
    // Critical issues
    if (!user.pin_hash) {
      issues.push('PIN not set (required for sensitive actions)');
    }
    
    if (!user.cwallet_id) {
      issues.push('Cwallet ID not set (required for raffle participation)');
    }
    
    if (!user.telegram_username && !user.email) {
      issues.push('No authentication method (Telegram or email)');
    }
    
    // Warnings
    if (!user.username) {
      warnings.push('Username not set (affects profile display)');
    }
    
    if (!user.jurisdiction) {
      warnings.push('Jurisdiction not set (affects badge display)');
    }
    
    // Get linked sites count (if table exists)
    try {
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_linked_sites'
        )`
      );
      if (tableCheck.rows[0].exists) {
        const linkedSitesResult = await pool.query(
          `SELECT COUNT(*) as count FROM user_linked_sites WHERE user_id = $1`,
          [userId]
        );
        stats.linkedCasinos = parseInt(linkedSitesResult.rows[0].count) || 0;
      } else {
        stats.linkedCasinos = 0;
      }
    } catch (err) {
      stats.linkedCasinos = 0;
    }
    
    // Get activity log count (if table exists)
    try {
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'activity_log'
        )`
      );
      if (tableCheck.rows[0].exists) {
        const activityResult = await pool.query(
          `SELECT COUNT(*) as count FROM activity_log WHERE user_id = $1`,
          [userId]
        );
        stats.activityCount = parseInt(activityResult.rows[0].count) || 0;
      } else {
        stats.activityCount = 0;
      }
    } catch (err) {
      stats.activityCount = 0;
    }
    
    log('');
    log('=== Degen Profile Validation ===');
    log(`User ID: ${userId}`);
    log('');
    log('Status:');
    log(`  Username: ${stats.hasUsername ? '✓' : '✗'}`);
    log(`  Email: ${stats.hasEmail ? '✓' : '✗'}`);
    log(`  Telegram: ${stats.hasTelegram ? '✓' : '✗'}`);
    log(`  Cwallet: ${stats.hasCwallet ? '✓' : '✗'}`);
    log(`  PIN: ${stats.hasPin ? '✓' : '✗'}`);
    log(`  Jurisdiction: ${stats.hasJurisdiction ? '✓' : '✗'}`);
    if (hasIconColumns) {
      log(`  Icon: ${stats.hasIcon ? '✓' : '✗'}`);
    } else {
      log(`  Icon: N/A (columns not present)`);
    }
    log(`  Linked Casinos: ${stats.linkedCasinos}`);
    log(`  Activity Log Entries: ${stats.activityCount}`);
    log('');
    
    if (issues.length > 0) {
      log('Issues:');
      issues.forEach(issue => log(`  ✗ ${issue}`));
      log('');
    }
    
    if (warnings.length > 0) {
      log('Warnings:');
      warnings.forEach(warning => log(`  ⚠ ${warning}`));
      log('');
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      log('✓ Degen Profile is complete and valid!');
    }
    
    log('================================');
    
    await auditLog('profile_validated', 'user', userId, { issues, warnings, stats });
  } catch (err) {
    if (params.log_errors) {
      error(`Profile validation failed: ${err.message}`);
    }
    throw err;
  }
};

// ============================================
// MAIN EXECUTION
// ============================================

const main = async () => {
  try {
    log('🌌 DEGEN PROFILE MANAGEMENT TOOL 🌌');
    log('"ONE IDENTITY. ONE PIN. ONE CWALLET. INFINITE DEGEN."');
    log('');
    
    let userId = null;
    
    // Get user ID from various sources
    if (params.user_id) {
      userId = params.user_id;
    } else if (params.url) {
      userId = await getUserIdentifier(params.url);
      if (!userId && params.create_profile) {
        userId = `user_${crypto.createHash('md5').update(params.url).digest('hex').substring(0, 8)}`;
      }
    } else if (params.create_profile) {
      // Generate user ID from email or telegram
      if (params.email || params.profile_email) {
        const email = params.email || params.profile_email;
        userId = `email_${crypto.createHash('md5').update(email).digest('hex').substring(0, 8)}`;
      } else if (params.telegram || params.profile_telegram) {
        const telegram = params.telegram || params.profile_telegram;
        userId = `tg_${telegram.replace('@', '')}`;
      } else {
        error('Cannot create profile: need user-id, url, email, or telegram username');
        process.exit(1);
      }
    }
    
    if (!userId) {
      error('No user identifier found. Provide --user-id, --url, or profile creation parameters.');
      process.exit(1);
    }
    
    log(`Target User ID: ${userId}`);
    log('');
    
    // Execute operations in order
    
    // 1. CSS Upgrade (if needed)
    if (params.css_upgrade) {
      await upgradeCSS();
    }
    
    // 2. Setup Degen Identity
    if (params.create_profile || params.update_identity) {
      await setupDegenIdentity(userId);
    }
    
    // 3. Manage PIN
    if (params.set_pin || params.update_pin) {
      await managePin(userId);
    }
    
    // 4. Setup Icon
    if (params.setup_icon || params.fix_icon_load) {
      await setupIcon(userId);
    }
    
    // 5. Link Casino Account
    if (params.link_site) {
      await linkCasinoAccount(userId);
    }
    
    // 6. Unlink Casino Account
    if (params.unlink_site) {
      await unlinkCasinoAccount(userId);
    }
    
    // 7. Update Crypto Addresses
    if (params.update_crypto_addresses) {
      await updateCryptoAddresses(userId);
    }
    
    // 8. Validate Profile
    if (params.validate_profile) {
      await validateDegenProfile(userId);
    }
    
    log('');
    log('=== Operation Summary ===');
    log(`User ID: ${userId}`);
    if (params.create_profile || params.update_identity) log('✓ Degen Identity managed');
    if (params.set_pin || params.update_pin) log('✓ PIN managed');
    if (params.setup_icon || params.fix_icon_load) log('✓ Icon setup');
    if (params.link_site) log('✓ Casino account linked');
    if (params.unlink_site) log('✓ Casino account unlinked');
    if (params.update_crypto_addresses) log('✓ Crypto addresses updated');
    if (params.css_upgrade) log('✓ CSS upgraded');
    if (params.validate_profile) log('✓ Profile validated');
    log('========================');
    log('');
    log('✨ Degen Profile operation completed! ✨');
    
  } catch (err) {
    error(`Operation failed: ${err.message}`);
    if (params.log_errors) {
      console.error(err.stack);
    }
    
    try {
      await auditLog('degen_profile_error', 'system', 'goose', {
        error: err.message,
        stack: params.log_errors ? err.stack : undefined
      });
    } catch (auditErr) {
      // Ignore audit errors
    }
    
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (err) {
      // Ignore pool close errors
    }
  }
};

main();
