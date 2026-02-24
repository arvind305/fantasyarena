require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Get all user display names
  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name');
  const names = {};
  for (const u of (lb || [])) names[u.user_id] = u.display_name;

  for (const mid of ['wc_m42', 'wc_m43']) {
    console.log(`\n=== ${mid} ===`);
    const { data: bets } = await sb.from('bets')
      .select('user_id, score, winner_points, player_pick_points, side_bet_points, side_bet_answers')
      .eq('match_id', mid);

    if (!bets || bets.length === 0) {
      console.log('  No bets found');
      continue;
    }

    for (const b of bets) {
      const name = names[b.user_id] || b.user_id;
      console.log(`  ${name}: total=${b.score} | winner=${b.winner_points} player=${b.player_pick_points} side=${b.side_bet_points}`);
      console.log(`    side_bet_answers: ${JSON.stringify(b.side_bet_answers)}`);
    }

    // Who DIDN'T bet
    const betUserIds = bets.map(b => b.user_id);
    const allUsers = Object.keys(names);
    const missing = allUsers.filter(u => !betUserIds.includes(u));
    if (missing.length > 0) {
      console.log(`  \n  Users who did NOT bet on ${mid}:`);
      for (const u of missing) console.log(`    - ${names[u]}`);
    }
  }
}
main().catch(console.error);
