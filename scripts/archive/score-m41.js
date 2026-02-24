/**
 * Score wc_m41: NZ vs PAK (Super 8, Group 1)
 * Result: ABANDONED — no ball bowled (rain)
 *
 * All bettors get 0 points. No winner, no runs, no player stats, no side bets resolved.
 * Match questions are disabled so the RPC skips all scoring categories.
 */
require('dotenv').config({path:'ui/.env'});
require('dotenv').config();
const {createClient} = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MATCH_ID = 'wc_m41';
const EVENT_ID = 't20wc_2026';

async function run() {
  console.log('=== SCORING wc_m41: NZ vs PAK — ABANDONED ===\n');

  // Step 1: Save match results (no winner, no runs)
  console.log('Step 1: Saving match results (abandoned)...');
  const { error: resErr } = await supabase
    .from('match_results')
    .upsert({
      match_id: MATCH_ID,
      winner: null,
      total_runs: null,
      side_bet_answers: null,
      man_of_match: null,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'match_id' });
  if (resErr) { console.error('Error saving results:', resErr); return; }
  console.log('  Match result saved (winner=null, runs=null)');

  // Step 2: Disable match questions so RPC skips winner & runs scoring
  console.log('\nStep 2: Disabling match questions...');
  const { error: mqErr } = await supabase
    .from('match_questions')
    .update({ status: 'disabled' })
    .eq('match_id', MATCH_ID);
  if (mqErr) { console.error('Error disabling questions:', mqErr); return; }
  console.log('  Match questions disabled');

  // Step 3: Lock the match
  console.log('\nStep 3: Locking match...');
  await supabase.from('match_config').update({ status: 'LOCKED' }).eq('match_id', MATCH_ID);
  console.log('  Match status → LOCKED');

  // No player stats to insert (no cricket played)
  // No side bet correct_answers to set (can't resolve them)

  // Step 4: Run scoring RPC
  console.log('\nStep 4: Triggering scoring RPC...');
  const { data: ppData, error: ppErr } = await supabase.rpc('calculate_all_player_points', { p_match_id: MATCH_ID });
  if (ppErr) { console.error('Error calculating player points:', ppErr); return; }
  console.log('  Player points:', JSON.stringify(ppData));

  const { data: scoreData, error: scoreErr } = await supabase.rpc('calculate_match_scores', {
    p_match_id: MATCH_ID,
    p_event_id: EVENT_ID,
  });
  if (scoreErr) { console.error('Error scoring:', scoreErr); return; }
  console.log('  Scoring result:', JSON.stringify(scoreData));

  // Step 5: Verify all bets got 0
  console.log('\nStep 5: Verifying scores...');
  const { data: users } = await supabase.from('users').select('user_id, display_name');
  const uMap = {};
  users.forEach(u => { uMap[u.user_id] = u.display_name; });

  const { data: bets } = await supabase
    .from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', MATCH_ID);

  let allZero = true;
  console.log('\n  User                  | W    | R    | PP   | SB   | Total');
  console.log('  ' + '-'.repeat(65));
  for (const b of bets) {
    const name = uMap[b.user_id] || b.user_id;
    console.log(`  ${name.padEnd(22)} | ${String(b.winner_points).padStart(4)} | ${String(b.total_runs_points).padStart(4)} | ${String(b.player_pick_points).padStart(4)} | ${String(b.side_bet_points).padStart(4)} | ${b.score}`);
    if (b.score !== 0) allZero = false;
  }

  console.log(`\n  All scores zero: ${allZero ? 'YES' : 'NO — PROBLEM!'}`);

  // Step 6: Show leaderboard
  console.log('\n=== LEADERBOARD ===');
  const { data: lb } = await supabase
    .from('leaderboard')
    .select('user_id, total_score, rank')
    .eq('event_id', EVENT_ID)
    .order('rank');

  lb.forEach(r => {
    console.log(`  ${String(r.rank).padStart(2)}. ${(uMap[r.user_id] || r.user_id).padEnd(22)} ${r.total_score}`);
  });

  console.log('\nDone!');
}

run().catch(console.error);
