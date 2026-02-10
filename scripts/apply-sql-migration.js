const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node apply-sql-migration.js <sql-file>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(sqlFile), 'utf8');

async function runSQL() {
  // Try the Supabase REST SQL endpoint
  const url = SUPABASE_URL + '/rest/v1/rpc/';

  // Method 1: Try pg-meta query endpoint
  console.log('Attempting to execute SQL via Supabase...');
  console.log('SQL length: ' + sql.length + ' chars');

  try {
    const res = await fetch(SUPABASE_URL + '/pg/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ query: sql })
    });

    if (res.ok) {
      const data = await res.json();
      console.log('SUCCESS via /pg/query');
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log('/pg/query returned ' + res.status + ': ' + await res.text());
  } catch (e) {
    console.log('/pg/query failed:', e.message);
  }

  // Method 2: Try direct SQL via the management-like endpoint
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: sql
    });
    console.log('REST /v1/ returned ' + res.status);
  } catch (e) {
    console.log('REST /v1/ failed:', e.message);
  }

  // Method 3: Use supabase-js rpc to call a helper if it exists
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  try {
    const { data, error } = await sb.rpc('exec_sql', { sql_text: sql });
    if (!error) {
      console.log('SUCCESS via exec_sql RPC');
      console.log(data);
      return;
    }
    console.log('exec_sql RPC error:', error.message);
  } catch (e) {
    console.log('exec_sql RPC failed:', e.message);
  }

  console.log('\n====================================');
  console.log('Could not execute SQL automatically.');
  console.log('Please run the SQL manually in the Supabase SQL Editor:');
  console.log('  Dashboard > SQL Editor > New query');
  console.log('  File: ' + path.resolve(sqlFile));
  console.log('====================================');
}

runSQL();
