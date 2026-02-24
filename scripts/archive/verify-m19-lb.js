require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Check leaderboard columns first
  const { data: lb } = await sb.from('leaderboard').select('*').limit(5).order('total_score', { ascending: false });
  if (lb && lb.length > 0) {
    console.log('Leaderboard columns:', Object.keys(lb[0]));
    console.log('\n=== LEADERBOARD ===');
    lb.forEach(r => {
      const name = r.display_name || r.user_name || r.user_id?.slice(0, 12) || '?';
      console.log(name.padEnd(22) + 'score=' + String(r.total_score).padStart(6) + ' matches=' + r.matches_played);
    });
  } else {
    console.log('Leaderboard empty or error');
  }
})();
