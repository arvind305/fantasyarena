require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function main() {
  // Get all scored matches
  const { data: scoredMatches } = await sb
    .from('match_config')
    .select('match_id')
    .eq('status', 'SCORED');
  console.log('Scored matches:', scoredMatches.map(m => m.match_id).sort());
  console.log('Count:', scoredMatches.length);

  // Get all bets with scores
  const { data: bets } = await sb
    .from('bets')
    .select('user_id, match_id, score');

  // Calculate correct totals per user
  const users = {};
  for (const b of bets) {
    if (!users[b.user_id]) users[b.user_id] = { total: 0, matches: 0, byMatch: {} };
    if (b.score !== null && b.score !== undefined) {
      users[b.user_id].total += b.score;
      users[b.user_id].matches++;
      users[b.user_id].byMatch[b.match_id] = b.score;
    }
  }

  // Get display names
  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name, total_score, matches_played').eq('event_id', 't20wc_2026');
  const nameMap = {};
  for (const l of lb) nameMap[l.user_id] = l;

  console.log('\n=== CORRECT vs CURRENT LEADERBOARD ===');
  for (const [uid, data] of Object.entries(users).sort((a, b) => b[1].total - a[1].total)) {
    const current = nameMap[uid];
    const name = current ? current.display_name : uid.substring(0, 12);
    const scoreOk = current && current.total_score === data.total ? 'OK' : 'MISMATCH';
    const matchOk = current && current.matches_played === data.matches ? 'OK' : 'MISMATCH';
    console.log(`  ${name}: correct=${data.total}pts/${data.matches}matches | current=${current?.total_score}pts/${current?.matches_played}matches | score:${scoreOk} matches:${matchOk}`);
  }
}
main();
