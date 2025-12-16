const fs = require('fs');
const path = require('path');
const db = require('../api/db');

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  const sqlDir = path.join(__dirname, '../sql');
  const files = fs.readdirSync(sqlDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`   Executing ${file}...`);
    const filePath = path.join(sqlDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await db.query(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error(`   ❌ Error in ${file}:`, error.message);
          throw error;
        }
      }
    }
    console.log(`   ✅ ${file} completed`);
  }

  console.log('✅ All migrations completed successfully');
  await db.close();
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
