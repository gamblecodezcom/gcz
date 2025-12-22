const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

// Auto-resolve DB path from known locations
let db;
const dbPaths = ['../db', '../backend/database', '../api/db'];
for (const p of dbPaths) {
  try {
    db = require(p);
    break;
  } catch (_) {}
}
if (!db) {
  console.error(chalk.red('❌ Could not find database module in known paths.'));
  process.exit(1);
}

async function runMigrations() {
  console.log(chalk.blue('🔄 Starting DB migrations...'));

  const sqlDir = path.join(__dirname, '../sql');
  if (!fs.existsSync(sqlDir)) {
    console.error(chalk.red(`❌ SQL directory not found: ${sqlDir}`));
    process.exit(1);
  }

  const files = fs.readdirSync(sqlDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(chalk.yellow(`↪ Executing ${file}...`));
    const filePath = path.join(sqlDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const stmt of statements) {
      try {
        await db.query(stmt);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(chalk.red(`   ❌ Error in ${file}: ${error.message}`));
          throw error;
        }
      }
    }
    console.log(chalk.green(`✅ ${file} completed`));
  }

  console.log(chalk.greenBright('✅ All migrations completed successfully\n'));
  if (typeof db.close === 'function') await db.close();
  process.exit(0);
}

runMigrations().catch(err => {
  console.error(chalk.red('❌ Migration failed:'), err.message || err);
  process.exit(1);
});
