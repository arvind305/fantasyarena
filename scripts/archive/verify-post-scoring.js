require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // 1. Check all 3 matches are SCORED
  const { data: configs } = await sb.from('match_config')
    .select('match_id, status')
    .in('match_id', ['wc_m28', 'wc_m29', 'wc_m30']);
  console.log('=== Match Status ===');
  for (const c of configs) console.log('  ' + c.match_id + ': ' + c.status);

  // 2. Check player_match_stats counts
  for (const mid of ['wc_m28', 'wc_m29', 'wc_m30']) {
    const { data } = await sb.from('player_match_stats').select('player_id').eq('match_id', mid);
    console.log('  ' + mid + ' player_match_stats: ' + (data?.length || 0) + ' rows');
  }

  // 3. Check side bets have correct_answer set
  const { data: sbs } = await sb.from('side_bets')
    .select('match_id, correct_answer')
    .in('match_id', ['wc_m28', 'wc_m29', 'wc_m30']);
  console.log('\n=== Side Bet Answers ===');
  for (const s of sbs) console.log('  ' + s.match_id + ': ' + s.correct_answer);

  // 4. Check match_results exist
  const { data: results } = await sb.from('match_results')
    .select('match_id, winner, total_runs, man_of_match')
    .in('match_id', ['wc_m28', 'wc_m29', 'wc_m30']);
  console.log('\n=== Match Results ===');
  for (const r of results) console.log('  ' + r.match_id + ': winner=' + r.winner + ' total=' + r.total_runs + ' MoM=' + r.man_of_match);

  // 5. Check all bets are scored (score is not null)
  const { data: bets } = await sb.from('bets')
    .select('match_id, user_id, score, is_locked')
    .in('match_id', ['wc_m28', 'wc_m29', 'wc_m30']);
  console.log('\n=== Bets Scored ===');
  let unscoredCount = 0;
  for (const b of bets) {
    if (b.score === null) unscoredCount++;
  }
  console.log('  Total bets: ' + bets.length + ', Unscored: ' + unscoredCount + ', All locked: ' + bets.every(b => b.is_locked));

  // 6. Check leaderboard top 5
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played, rank')
    .order('total_score', { ascending: false })
    .limit(5);
  console.log('\n=== Leaderboard Top 5 ===');
  for (const r of lb) console.log('  #' + r.rank + ' ' + r.display_name.padEnd(20) + r.total_score + ' pts (' + r.matches_played + ' matches)');

  console.log('\nVERIFICATION COMPLETE');
})();
