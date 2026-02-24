/**
 * Check all bets for key format mismatches (V1 vs V2)
 * V1 format: "wc_m17_winner" / "NEP"
 * V2 format: "q_wc_m17_winner" / "opt_wc_m17_winner_teamA"
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const { data: bets } = await sb.from('bets').select('user_id, match_id, answers, score');
  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name');
  const nameMap = {};
  for (const l of (lb || [])) nameMap[l.user_id] = l.display_name;

  let v1Count = 0;
  let v2Count = 0;
  const v1Bets = [];

  for (const b of (bets || [])) {
    if (!b.answers) continue;
    const keys = Object.keys(b.answers);
    const hasV1Key = keys.some(k => !k.startsWith('q_'));
    const hasV2Key = keys.some(k => k.startsWith('q_'));

    if (hasV1Key) {
      v1Count++;
      v1Bets.push(b);
    }
    if (hasV2Key) v2Count++;
  }

  console.log('Total bets with answers:', (bets || []).filter(b => b.answers && Object.keys(b.answers).length > 0).length);
  console.log('V1 format (no q_ prefix):', v1Count);
  console.log('V2 format (q_ prefix):', v2Count);

  console.log('\n=== V1 FORMAT BETS ===');
  for (const b of v1Bets) {
    const name = nameMap[b.user_id] || b.user_id.substring(0, 12);
    console.log(name.padEnd(22) + ' | ' + b.match_id.padEnd(10) + ' | scored: ' + String(b.score ?? 'null').padStart(6) + ' | keys: ' + JSON.stringify(Object.keys(b.answers)) + ' | values: ' + JSON.stringify(Object.values(b.answers)));
  }

  // Check: for scored V1 bets, did the winner/runs get credit?
  console.log('\n=== SCORED V1 BETS — DID THEY GET WINNER/RUNS POINTS? ===');
  const scoredV1 = v1Bets.filter(b => b.score !== null);
  for (const b of scoredV1) {
    const { data: bet } = await sb.from('bets')
      .select('winner_points, total_runs_points, player_pick_points, side_bet_points')
      .eq('user_id', b.user_id)
      .eq('match_id', b.match_id)
      .single();
    const name = nameMap[b.user_id] || b.user_id.substring(0, 12);
    console.log(name.padEnd(22) + ' | ' + b.match_id.padEnd(10) +
      ' | winner: ' + (bet?.winner_points ?? '?') +
      ' | runs: ' + (bet?.total_runs_points ?? '?') +
      ' | players: ' + (bet?.player_pick_points ?? '?') +
      ' | side: ' + (bet?.side_bet_points ?? '?') +
      ' | total: ' + b.score);
  }
})();
