const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const { data, error } = await sb.from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .or('team_a.eq.IRE,team_b.eq.IRE,team_a.eq.ZIM,team_b.eq.ZIM')
    .order('match_id');

  if (error) { console.error('Error:', error); return; }

  console.log('IRE/ZIM matches:');
  data.forEach(m => {
    console.log(`${m.match_id} | ${m.team_a} vs ${m.team_b} | status: ${m.status} | lock: ${m.lock_time}`);
  });
})();
