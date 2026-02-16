/**
 * Reset last_match_score to 0 for users who didn't bet on the most recently scored match.
 * Usage: node scripts/fix-stale-last-score.js [match_id]
 * Default: wc_m27 (last scored match)
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const matchId = process.argv[2] || 'wc_m27';

(async () => {
  const { data: bets } = await sb.from('bets').select('user_id').eq('match_id', matchId);
  const bettors = new Set((bets || []).map(b => b.user_id));
  console.log('Bettors on ' + matchId + ': ' + bettors.size);

  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name, last_match_score');
  const stale = (lb || []).filter(r => !bettors.has(r.user_id) && r.last_match_score !== 0);

  if (stale.length === 0) {
    console.log('No stale last_match_score values found.');
    return;
  }

  console.log('Users with stale last_match_score:');
  for (const r of stale) {
    console.log('  ' + r.display_name + ': ' + r.last_match_score + ' → 0');
    await sb.from('leaderboard').update({ last_match_score: 0 }).eq('user_id', r.user_id);
  }
  console.log('Reset ' + stale.length + ' users.');
})();
