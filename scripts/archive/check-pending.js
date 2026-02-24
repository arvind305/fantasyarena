const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data } = await sb.from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .in('status', ['LOCKED', 'OPEN'])
    .order('match_id');
  if (!data || data.length === 0) {
    console.log('No LOCKED or OPEN matches — all caught up!');
  } else {
    data.forEach(m => console.log(`${m.match_id}: ${m.team_a} vs ${m.team_b} — ${m.status} (lock: ${m.lock_time})`));
  }
})();
