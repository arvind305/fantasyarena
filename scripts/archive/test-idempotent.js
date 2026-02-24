/**
 * Test that the scoring RPC is now idempotent.
 * Re-scores wc_m15 and verifies the leaderboard doesn't change.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('=== BEFORE re-score of wc_m15 ===');
  const { data: lb1 } = await sb
    .from('leaderboard')
    .select('display_name, total_score, rank, user_id')
    .eq('event_id', 't20wc_2026')
    .order('rank');

  for (const r of lb1) {
    console.log('  #' + r.rank, r.display_name.padEnd(22), r.total_score + ' pts');
  }

  console.log('\nRe-scoring wc_m15...');
  const { data, error } = await sb.rpc('calculate_match_scores', {
    p_match_id: 'wc_m15',
    p_event_id: 't20wc_2026',
  });

  if (error) {
    console.error('RPC error:', error.message);
    process.exit(1);
  }
  console.log('RPC result:', JSON.stringify(data));

  console.log('\n=== AFTER re-score of wc_m15 (should be identical) ===');
  const { data: lb2 } = await sb
    .from('leaderboard')
    .select('display_name, total_score, rank, user_id')
    .eq('event_id', 't20wc_2026')
    .order('rank');

  let allMatch = true;
  for (let i = 0; i < lb2.length; i++) {
    const before = lb1.find(r => r.user_id === lb2[i].user_id);
    const after = lb2[i];
    const scoreMatch = before && before.total_score === after.total_score;
    const rankMatch = before && before.rank === after.rank;
    const ok = scoreMatch && rankMatch;
    if (!ok) allMatch = false;

    const status = ok ? 'OK' : 'MISMATCH (was ' + (before ? before.total_score : '?') + ' pts, rank ' + (before ? before.rank : '?') + ')';
    console.log('  #' + after.rank, after.display_name.padEnd(22), after.total_score + ' pts', status);
  }

  console.log();
  if (allMatch) {
    console.log('PASS: Leaderboard is identical after re-score. Idempotent scoring works.');
  } else {
    console.log('FAIL: Leaderboard changed after re-score. The RPC is still not idempotent.');
  }
})();
