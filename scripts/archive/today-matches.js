const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Find all matches around today
  const { data, error } = await sb.from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .in('status', ['OPEN', 'LOCKED', 'DRAFT'])
    .order('lock_time');

  if (error) { console.error(error); return; }

  console.log('Non-scored matches:');
  data.forEach(m => {
    console.log(`${m.match_id} | ${m.team_a} vs ${m.team_b} | ${m.status} | lock: ${m.lock_time}`);
  });

  // Also check what bets exist for wc_m32
  const { data: bets32, error: e32 } = await sb.from('bets')
    .select('bet_id, user_id, match_id')
    .eq('match_id', 'wc_m32');
  console.log(`\nBets on wc_m32 (IRE vs ZIM): ${bets32 ? bets32.length : 0}`);

  // Find NZ vs CAN match
  const { data: nzcan } = await sb.from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .or('and(team_a.eq.NZ,team_b.eq.CAN),and(team_a.eq.CAN,team_b.eq.NZ)');
  console.log('\nNZ vs CAN matches:');
  nzcan.forEach(m => console.log(`${m.match_id} | ${m.team_a} vs ${m.team_b} | ${m.status} | lock: ${m.lock_time}`));

  // Check match_results and player_match_stats for the NZ vs CAN match
  if (nzcan.length > 0) {
    const mid = nzcan.find(m => m.status === 'LOCKED')?.match_id || nzcan[0].match_id;
    const { data: results } = await sb.from('match_results').select('*').eq('match_id', mid);
    console.log(`\nmatch_results for ${mid}: ${results ? results.length : 0} rows`);

    const { data: pms } = await sb.from('player_match_stats').select('*').eq('match_id', mid);
    console.log(`player_match_stats for ${mid}: ${pms ? pms.length : 0} rows`);

    // Check match config details
    const { data: cfg } = await sb.from('match_config').select('*').eq('match_id', mid).single();
    console.log(`\nMatch config for ${mid}:`, JSON.stringify(cfg, null, 2));
  }
})();
