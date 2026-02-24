/**
 * Set side bet correct answers for m42 and m43, then re-score both matches.
 *
 * m42 side bets:
 *   ffc04215: "What will the first innings total be?" → "121-150" (ENG scored 146)
 *   250391aa: "How many wickets will fall in the match?" → "15+" (19 wickets)
 *
 * m43 side bets (skip 536e9c71 — users didn't bet on it):
 *   0f475bc8: "What will the powerplay score of the first innings be?" → "36-50" (RSA PP = 41)
 *   334b00f7: "How many boundaries (4s+6s) will be hit in the match?" → "41+" (42 boundaries)
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const toIST = (d) => new Date(d).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
});

async function main() {
  // === M42 side bets ===
  console.log('=== wc_m42: Setting side bet answers ===');

  const m42Answers = [
    { id: 'ffc04215-d821-4d17-8536-a277bd608aa3', answer: '121-150', q: 'First innings total' },
    { id: '250391aa-eb5d-42cd-8fff-41bceb8f1d92', answer: '15+', q: 'Wickets in match' },
  ];

  for (const a of m42Answers) {
    const { error } = await sb.from('side_bets')
      .update({ correct_answer: a.answer })
      .eq('side_bet_id', a.id);
    if (error) console.error(`  ERROR setting ${a.q}:`, error.message);
    else console.log(`  ${a.q} → "${a.answer}"`);
  }

  // === M43 side bets (skip 536e9c71) ===
  console.log('\n=== wc_m43: Setting side bet answers ===');

  const m43Answers = [
    { id: '0f475bc8-64a5-4119-86e7-9bf1f9b7db2b', answer: '36-50', q: 'Powerplay score' },
    { id: '334b00f7-c313-4d00-b613-6e5f62625145', answer: '41+', q: 'Boundaries in match' },
  ];

  for (const a of m43Answers) {
    const { error } = await sb.from('side_bets')
      .update({ correct_answer: a.answer })
      .eq('side_bet_id', a.id);
    if (error) console.error(`  ERROR setting ${a.q}:`, error.message);
    else console.log(`  ${a.q} → "${a.answer}"`);
  }

  // === Re-score both matches (idempotent — safe to re-run) ===
  console.log('\n=== Re-scoring wc_m42 ===');
  const { data: r42, error: e42 } = await sb.rpc('calculate_match_scores', {
    p_match_id: 'wc_m42',
    p_event_id: 't20wc_2026'
  });
  if (e42) console.error('  ERROR:', e42.message);
  else console.log('  Result:', JSON.stringify(r42));

  console.log('\n=== Re-scoring wc_m43 ===');
  const { data: r43, error: e43 } = await sb.rpc('calculate_match_scores', {
    p_match_id: 'wc_m43',
    p_event_id: 't20wc_2026'
  });
  if (e43) console.error('  ERROR:', e43.message);
  else console.log('  Result:', JSON.stringify(r43));

  // === Verify side bet points ===
  console.log('\n=== Verification: wc_m42 bet scores ===');
  const { data: b42 } = await sb.from('bets')
    .select('user_id, score, winner_points, player_pick_points, side_bet_points, side_bet_answers')
    .eq('match_id', 'wc_m42');
  for (const b of (b42 || [])) {
    console.log(`  ${b.user_id.slice(0,10)}...: total=${b.score} | winner=${b.winner_points} player=${b.player_pick_points} side=${b.side_bet_points}`);
    console.log(`    answers: ${JSON.stringify(b.side_bet_answers)}`);
  }

  console.log('\n=== Verification: wc_m43 bet scores ===');
  const { data: b43 } = await sb.from('bets')
    .select('user_id, score, winner_points, player_pick_points, side_bet_points, side_bet_answers')
    .eq('match_id', 'wc_m43');
  for (const b of (b43 || [])) {
    console.log(`  ${b.user_id.slice(0,10)}...: total=${b.score} | winner=${b.winner_points} player=${b.player_pick_points} side=${b.side_bet_points}`);
    console.log(`    answers: ${JSON.stringify(b.side_bet_answers)}`);
  }

  // === Final leaderboard ===
  console.log('\n=== Updated Leaderboard (Top 15) ===');
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false })
    .limit(15);
  for (let i = 0; i < (lb || []).length; i++) {
    console.log(`  #${i+1} ${lb[i].display_name}: ${lb[i].total_score} pts (${lb[i].matches_played} matches)`);
  }
}

main().catch(console.error);
