require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Find unscored bets on scored matches
  const scoredMatches = ['wc_m1', 'wc_m2', 'wc_m3', 'wc_m4', 'wc_m5', 'wc_m6', 'wc_m7'];
  
  const { data: unscored } = await sb.from('bets')
    .select('bet_id, user_id, match_id, created_at')
    .in('match_id', scoredMatches)
    .is('score', null);

  if (!unscored || unscored.length === 0) {
    console.log('No unscored bets on scored matches. All good!');
    return;
  }

  // Get user names
  const { data: users } = await sb.from('users').select('user_id, display_name');
  const nameMap = {};
  for (const u of (users || [])) nameMap[u.user_id] = u.display_name;

  console.log('=== UNSCORED BETS ON SCORED MATCHES ===');
  console.log('Count:', unscored.length);
  for (const b of unscored) {
    const name = nameMap[b.user_id] || 'Unknown';
    console.log(' ', b.match_id.padEnd(8), name.padEnd(22), 'created:', b.created_at);
  }

  // Also check: how many bets on wc_m8 and wc_m9
  console.log('\n=== UPCOMING MATCH BETS ===');
  for (const mid of ['wc_m8', 'wc_m9']) {
    const { data: bets } = await sb.from('bets').select('bet_id').eq('match_id', mid);
    console.log(mid + ':', (bets || []).length, 'bets');
  }
})();
