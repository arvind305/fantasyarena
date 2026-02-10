const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
(async () => {
  const { data, error } = await sb.from('player_match_stats').select('*').limit(0);
  // The error or response headers might not show columns... let's try inserting a dummy
  const { error: insertErr } = await sb.from('player_match_stats').insert({
    match_id: 'test', player_id: '00000000-0000-0000-0000-000000000000'
  });
  console.log('Insert error (shows valid columns):', insertErr);

  // Check migration SQL for the table definition
  const fs = require('fs');
  const sql = fs.readFileSync(require('path').join(__dirname, 'sql', 'COMBINED_MIGRATION.sql'), 'utf8');
  const match = sql.match(/CREATE TABLE[^;]*player_match_stats[^;]*/i);
  if (match) console.log('\nTable definition:\n' + match[0]);
})();
