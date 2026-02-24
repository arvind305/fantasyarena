require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Check leaderboard
  const { data: lb, error: lbErr } = await sb.from('leaderboard')
    .select('*')
    .eq('tournament_id', 't20wc_2026')
    .order('total_score', { ascending: false });
  if (lbErr) console.log('LB Error:', lbErr.message);
  console.log('=== LEADERBOARD ===');
  (lb || []).forEach(r => console.log(
    (r.display_name || r.user_id.slice(0, 12)).padEnd(22) +
    'score=' + String(r.total_score).padStart(6) +
    ' matches=' + r.matches_played
  ));

  // Check match status
  const { data: mc } = await sb.from('match_config').select('match_id,status').eq('match_id', 'wc_m19');
  console.log('\nMatch status:', mc);

  // Double check bet scores
  const { data: bets } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', 'wc_m19')
    .order('score', { ascending: false });
  console.log('\nBet scores for wc_m19:');
  bets.forEach(b => {
    console.log(
      b.user_id.slice(0, 8) +
      ' total=' + b.score +
      ' winner=' + b.winner_points +
      ' runs=' + b.total_runs_points +
      ' players=' + b.player_pick_points +
      ' side=' + b.side_bet_points
    );
  });

  // Sanity: check that scores make sense
  // Winner: ZIM — nobody bet ZIM (all got 0 winner points)
  // Side bet: No — 3 got +1000, 1 got -1000
  console.log('\nSanity checks:');
  const allWinnerZero = bets.every(b => b.winner_points === 0);
  console.log('All winner=0 (nobody picked ZIM):', allWinnerZero);
  const sidePositive = bets.filter(b => b.side_bet_points === 1000).length;
  const sideNegative = bets.filter(b => b.side_bet_points === -1000).length;
  console.log('Side bet: ' + sidePositive + ' correct (+1000), ' + sideNegative + ' wrong (-1000)');
})();
