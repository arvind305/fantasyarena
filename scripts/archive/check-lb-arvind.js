const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Get ALL leaderboard entries (check for duplicates/wrong event_ids)
  const { data: lb } = await sb.from('leaderboard').select('*').order('total_score', { ascending: false });
  console.log('=== ALL LEADERBOARD ENTRIES ===');
  lb.forEach(e => {
    console.log(
      (e.display_name || '?').padEnd(22) + ' | event=' + e.event_id +
      ' | score=' + e.total_score + ' | matches=' + e.matches_played +
      ' | last=' + e.last_match_score + ' | user=' + e.user_id.slice(0,8)
    );
  });

  // Check Arvind specifically
  const arvindId = '104262282893186176547';
  const { data: arvindEntries } = await sb.from('leaderboard').select('*').eq('user_id', arvindId);
  console.log('\n=== ARVIND ENTRIES ===');
  arvindEntries.forEach(e => console.log(JSON.stringify(e, null, 2)));
})();
