/**
 * install-group-trigger.js
 * Executes the 014_fix_groups_schema.sql migration against Supabase
 * to install the group score sync trigger.
 *
 * Usage:
 *   node scripts/install-group-trigger.js --db-password YOUR_DB_PASSWORD
 *   node scripts/install-group-trigger.js --access-token YOUR_SUPABASE_ACCESS_TOKEN
 *
 * Or set environment variables:
 *   DB_PASSWORD=xxx node scripts/install-group-trigger.js
 *   SUPABASE_ACCESS_TOKEN=xxx node scripts/install-group-trigger.js
 *
 * To find your DB password:
 *   Supabase Dashboard > Project Settings > Database > Database password
 *
 * To create an access token:
 *   https://supabase.com/dashboard/account/tokens
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('Missing REACT_APP_SUPABASE_URL in .env');
  process.exit(1);
}

// Parse CLI arguments
const args = process.argv.slice(2);
let dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;
let accessToken = process.env.SUPABASE_ACCESS_TOKEN;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--db-password' && args[i + 1]) {
    dbPassword = args[++i];
  } else if (args[i] === '--access-token' && args[i + 1]) {
    accessToken = args[++i];
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log('Usage:');
    console.log('  node scripts/install-group-trigger.js --db-password YOUR_DB_PASSWORD');
    console.log('  node scripts/install-group-trigger.js --access-token YOUR_SUPABASE_ACCESS_TOKEN');
    console.log('');
    console.log('Find your DB password:');
    console.log('  Supabase Dashboard > Project Settings > Database > Database password');
    console.log('');
    console.log('Generate an access token:');
    console.log('  https://supabase.com/dashboard/account/tokens');
    process.exit(0);
  }
}

// Extract project ref from URL
const ref = new URL(SUPABASE_URL).hostname.split('.')[0];

// Read the SQL file
const sqlFile = path.join(__dirname, 'sql', '014_fix_groups_schema.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('=== Installing Group Score Sync Trigger ===');
console.log('Project ref:', ref);
console.log('SQL file:', sqlFile);
console.log('SQL length:', sql.length, 'chars');
console.log('');

// Method 1: Supabase Management API with access token
async function tryManagementAPI() {
  if (!accessToken) return false;

  console.log('[Management API] Executing SQL...');
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('SUCCESS via Management API!');
      if (data && Array.isArray(data)) {
        data.forEach((result, i) => {
          if (result.rows && result.rows.length > 0) {
            console.log(`  Statement ${i + 1}: ${result.rows.length} rows affected`);
          }
        });
      }
      return true;
    }
    const text = await res.text();
    console.log(`Management API returned ${res.status}: ${text}`);
    return false;
  } catch (err) {
    console.log(`Management API failed: ${err.message}`);
    return false;
  }
}

// Method 2: Direct PostgreSQL connection with DB password
async function tryDirectPg() {
  if (!dbPassword) return false;

  const { Client } = require('pg');
  console.log('[Direct PG] Connecting to db.' + ref + '.supabase.co:5432...');

  const client = new Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('Connected!');
    console.log('Executing migration SQL...');
    await client.query(sql);
    console.log('SUCCESS via direct PostgreSQL connection!');
    await client.end();
    return true;
  } catch (err) {
    console.log(`Direct PG failed: ${err.message}`);
    try { await client.end(); } catch (e) { /* ignore */ }

    // Also try pooler if direct fails
    const regions = ['ap-south-1', 'us-east-1', 'eu-west-1'];
    for (const region of regions) {
      console.log(`[Pooler] Trying ${region}...`);
      const poolClient = new Client({
        host: `aws-0-${region}.pooler.supabase.com`,
        port: 5432,
        database: 'postgres',
        user: `postgres.${ref}`,
        password: dbPassword,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

      try {
        await poolClient.connect();
        console.log('Connected via pooler!');
        await poolClient.query(sql);
        console.log('SUCCESS via pooler!');
        await poolClient.end();
        return true;
      } catch (poolErr) {
        console.log(`Pooler (${region}) failed: ${poolErr.message}`);
        try { await poolClient.end(); } catch (e) { /* ignore */ }
      }
    }
    return false;
  }
}

async function main() {
  if (!dbPassword && !accessToken) {
    console.log('ERROR: No credentials provided.\n');
    console.log('You need to provide either a database password or Supabase access token.\n');
    console.log('Usage:');
    console.log('  node scripts/install-group-trigger.js --db-password YOUR_DB_PASSWORD');
    console.log('  node scripts/install-group-trigger.js --access-token YOUR_SUPABASE_ACCESS_TOKEN');
    console.log('');
    console.log('Where to find these:');
    console.log(`  DB Password:    https://supabase.com/dashboard/project/${ref}/settings/database`);
    console.log('  Access Token:   https://supabase.com/dashboard/account/tokens');
    console.log('');
    console.log('Or run the SQL manually:');
    console.log(`  1. Go to: https://supabase.com/dashboard/project/${ref}/sql/new`);
    console.log('  2. Paste the contents of: ' + sqlFile);
    console.log('  3. Click "Run"');
    process.exit(1);
  }

  // Try Management API first (if access token provided)
  if (accessToken && await tryManagementAPI()) {
    console.log('\n=== Migration installed successfully! ===');
    console.log('Run "node scripts/verify-group-sync.js" to verify.');
    return;
  }

  // Try direct PG connection (if DB password provided)
  if (dbPassword && await tryDirectPg()) {
    console.log('\n=== Migration installed successfully! ===');
    console.log('Run "node scripts/verify-group-sync.js" to verify.');
    return;
  }

  console.log('\n====================================');
  console.log('COULD NOT EXECUTE SQL');
  console.log('====================================');
  console.log('The provided credentials did not work.');
  console.log('');
  console.log('Please run the SQL manually in the Supabase SQL Editor:');
  console.log(`  1. Go to: https://supabase.com/dashboard/project/${ref}/sql/new`);
  console.log('  2. Paste the contents of: ' + sqlFile);
  console.log('  3. Click "Run"');
  process.exit(1);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
