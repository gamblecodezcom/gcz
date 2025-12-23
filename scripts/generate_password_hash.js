#!/usr/bin/env node
/**
 * Password Hash Generator
 * 
 * Generates a bcrypt hash for the admin password.
 * 
 * Usage: 
 *   node scripts/generate_password_hash.js <password>
 *   node scripts/generate_password_hash.js "your-password-here"
 */

const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.error('❌ Error: Password required');
  console.log('\nUsage: node scripts/generate_password_hash.js <password>');
  console.log('Example: node scripts/generate_password_hash.js "MySecurePassword123"');
  process.exit(1);
}

// Generate hash with salt rounds (10 is default, good balance of security and speed)
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('\n✅ Password hash generated:\n');
  console.log(hash);
  console.log('\n📝 Add this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
});
