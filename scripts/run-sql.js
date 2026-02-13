/**
 * Execute SQL on Supabase using the Management API.
 * Usage: node scripts/run-sql.js <sql-file>
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'ui', '.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node scripts/run-sql.js <sql-file>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(sqlFile), 'utf8');
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];

async function run() {
  // Try the Supabase SQL API endpoint (supabase.co/rest/v1/rpc won't work for DDL)
  // Use the postgrest RPC approach: create a temp function that runs raw SQL

  // Actually, the simplest way: use the service role key with the SQL endpoint
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });

  // Split by semicolons for multi-statement, but our function is one big CREATE OR REPLACE
  // Just send the whole thing via rpc if possible

  // Method: Use the Supabase HTTP API /sql endpoint (available on hosted Supabase)
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    console.log('SUCCESS via Management API');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
    return;
  }

  console.log('Management API returned', res.status, await res.text().then(t => t.substring(0, 300)));

  // Fallback: try the /pg endpoint directly on the project
  const res2 = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res2.ok) {
    console.log('SUCCESS via /pg endpoint');
    return;
  }
  console.log('/pg returned', res2.status);

  console.log('\n============================================');
  console.log('Could not execute SQL automatically.');
  console.log('Copy the SQL below and run it in the Supabase SQL Editor:');
  console.log('  Dashboard > SQL Editor > New query');
  console.log('  File: ' + path.resolve(sqlFile));
  console.log('============================================\n');
  console.log('--- SQL START ---');
  console.log(sql);
  console.log('--- SQL END ---');
}

run().catch(err => { console.error(err); process.exit(1); });
