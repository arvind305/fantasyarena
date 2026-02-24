/**
 * Recalculate leaderboard from actual bet scores.
 * Directly updates total_score and matches_played to correct values.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function main() {
  // Get all bets with scores
  const { data: bets } = await sb.from('bets').select('user_id, match_id, score');

  // Calculate correct totals per user
  const users = {};
  for (const b of bets) {
    if (!users[b.user_id]) users[b.user_id] = { total: 0, matches: 0, lastScore: 0 };
    if (b.score !== null && b.score !== undefined) {
      users[b.user_id].total += b.score;
      users[b.user_id].matches++;
      users[b.user_id].lastScore = b.score; // not perfect but acceptable
    }
  }

  // Update leaderboard for each user
  for (const [uid, data] of Object.entries(users)) {
    const { error } = await sb
      .from('leaderboard')
      .update({
        total_score: data.total,
        matches_played: data.matches,
        last_match_score: data.lastScore,
      })
      .eq('user_id', uid)
      .eq('event_id', 't20wc_2026');
    if (error) console.error('ERROR updating', uid, ':', error.message);
  }

  // Show final leaderboard
  const { data: lb } = await sb
    .from('leaderboard')
    .select('display_name, total_score, matches_played')
    .eq('event_id', 't20wc_2026')
    .order('total_score', { ascending: false });

  console.log('=== FIXED LEADERBOARD ===');
  let rank = 1;
  for (const l of lb) {
    console.log(`  ${rank++}. ${l.display_name}: ${l.total_score} pts (${l.matches_played} matches)`);
  }
}
main();
