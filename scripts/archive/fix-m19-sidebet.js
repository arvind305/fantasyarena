/**
 * Fix wc_m19 side bet: answer should be "Yes" (19.3 overs = 20th over)
 * Then re-score via idempotent RPC.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCH_ID = 'wc_m19';
const SIDE_BET_ID = 'c197816a-752f-444b-9153-57485e8f319f';

(async () => {
  // Step 1: Fix side bet answer
  console.log('Step 1: Update side bet answer to "Yes"...');
  const { error: sbErr } = await sb.from('side_bets').update({ correct_answer: 'Yes' }).eq('side_bet_id', SIDE_BET_ID);
  if (sbErr) { console.log('ERROR:', sbErr.message); return; }
  console.log('  OK');

  // Step 2: Set match back to LOCKED for RPC
  console.log('Step 2: Set match to LOCKED for re-scoring...');
  await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', MATCH_ID);
  console.log('  OK');

  // Step 3: Re-score via idempotent RPC
  console.log('Step 3: Re-score via RPC...');
  const { data: sr, error: sErr } = await sb.rpc('calculate_match_scores', { p_match_id: MATCH_ID, p_event_id: 't20wc_2026' });
  if (sErr) { console.log('ERROR:', sErr.message); return; }
  console.log('  ' + JSON.stringify(sr));

  // Step 4: Set SCORED
  console.log('Step 4: Set SCORED...');
  await sb.from('match_config').update({ status: 'SCORED' }).eq('match_id', MATCH_ID);
  console.log('  OK');

  // Step 5: Verify bet scores
  console.log('\n--- BET SCORES (after fix) ---');
  const { data: bets } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', MATCH_ID)
    .order('score', { ascending: false });
  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name');
  const nameMap = {};
  for (const l of (lb || [])) nameMap[l.user_id] = l.display_name;

  console.log('User'.padEnd(22) + '| Score  | Winner | Runs  | Players | Side  ');
  console.log('-'.repeat(75));
  for (const b of (bets || [])) {
    const name = nameMap[b.user_id] || b.user_id.substring(0, 12);
    console.log(
      name.padEnd(22) + '| ' +
      String(b.score ?? 'null').padStart(6) + ' | ' +
      String(b.winner_points ?? 0).padStart(6) + ' | ' +
      String(b.total_runs_points ?? 0).padStart(5) + ' | ' +
      String(b.player_pick_points ?? 0).padStart(7) + ' | ' +
      String(b.side_bet_points ?? 0).padStart(5)
    );
  }

  // Step 6: Verify leaderboard
  console.log('\n=== LEADERBOARD ===');
  const { data: lbFull } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false })
    .limit(10);
  (lbFull || []).forEach(r => {
    console.log((r.display_name || '?').padEnd(22) + 'score=' + String(r.total_score).padStart(6) + ' matches=' + r.matches_played);
  });
})();
