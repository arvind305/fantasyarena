/**
 * Score wc_m34: RSA vs UAE — South Africa won by 6 wickets
 *
 * UAE 122/6 (20 ov) vs RSA 123/4 (13.2 ov)
 * Total runs: 245. MoM: Corbin Bosch (3/12)
 * Side bet: "Who will be the Man of the Match?" → "Batsmen 7-11 (either side)" (Bosch bats 7+)
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function calcFantasyPoints(p) {
  let pts = 0;
  pts += p.runs;
  pts += p.fours * 10;
  pts += p.sixes * 20;
  if (p.balls > 0) pts += Math.round((p.runs / p.balls) * 100);
  pts += p.wickets * 20;
  if (p.overs >= 1 && p.econ !== null) {
    if (p.econ <= 6) pts += 100;
    else if (p.econ <= 8) pts += 50;
    else if (p.econ <= 10) pts += 25;
  }
  pts += (p.catches || 0) * 5;
  pts += (p.runOuts || 0) * 5;
  pts += (p.stumpings || 0) * 5;
  if (p.runs >= 100) pts += 200;
  if (p.wickets >= 5) pts += 200;
  if (p.isMoM) pts += 200;
  return pts;
}

const match = {
  matchId: 'wc_m34',
  eventId: 't20wc_2026',
  label: 'RSA vs UAE',
  winner: 'opt_wc_m34_winner_teamA', // RSA = teamA, RSA won
  totalRuns: 245,                     // 122 + 123
  manOfMatch: 'Corbin Bosch',
  sideBetId: 'd85e3def-497f-4301-beff-777130e92ca9',
  sideBetAnswer: 'Batsmen 7-11 (either side)',
  players: [
    // === Only players that exist in DB (user-picked + key performers) ===
    // Alishan Sharafu: 45(38), 5x4, 1x6
    { pid: '22e74fa7-558b-4ac9-b058-5dddb09aa954', name: 'Alishan Sharafu',      runs: 45, balls: 38, fours: 5, sixes: 1, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Aiden Markram (c): 28(11), 5x4, 1x6
    { pid: '135d571d-76a1-4ae9-ade2-5fd6d715f969', name: 'Aiden Markram',        runs: 28, balls: 11, fours: 5, sixes: 1, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Quinton de Kock (wk): 14(16), 3x4, 0x6. 1 catch
    { pid: '97aa4f8d-6335-4a11-ac2f-d01f4e3ba395', name: 'Quinton de Kock',      runs: 14, balls: 16, fours: 3, sixes: 0, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 1, stumpings: 0, runOuts: 0, isMoM: false },
    // Ryan Rickelton: 30(16), 3x4, 2x6
    { pid: '8443d5e9-d315-43e1-8f25-a03a2b3e30ed', name: 'Ryan Rickelton',       runs: 30, balls: 16, fours: 3, sixes: 2, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Jason Smith: 3*(5), 0x4, 0x6. 1 catch
    { pid: '49d1a7c8-ccef-41ad-a54f-f3b37a12d70e', name: 'Jason Smith',          runs: 3,  balls: 5,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 1, stumpings: 0, runOuts: 0, isMoM: false },
    // Anrich Nortje: 4-0-28-2
    { pid: '95884ccc-42ab-41f4-bfed-75958acbb65d', name: 'Anrich Nortje',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 28, econ: 7.00, wickets: 2, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Corbin Bosch: 4-0-12-3. MoM!
    { pid: 'cdbf512c-019b-43db-b0c9-d488412ad024', name: 'Corbin Bosch',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 12, econ: 3.00, wickets: 3, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
    // Lungi Ngidi — did not play
    { pid: '3a3d11f5-0557-419b-80a2-e1094fa0d961', name: 'Lungi Ngidi',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Marco Jansen — did not play
    { pid: '704b5d24-fc03-4d79-a826-b554a75b809b', name: 'Marco Jansen',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // David Miller — did not play
    { pid: '67d44c6f-bf0f-411f-bf3a-95b55a094dd6', name: 'David Miller',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
  ],
};

(async () => {
  console.log('=== Scoring wc_m34: RSA vs UAE ===\n');

  // Step 1: Calculate and display fantasy points
  console.log('Fantasy Points:');
  for (const p of match.players) {
    p.fantasyPoints = calcFantasyPoints(p);
    if (p.fantasyPoints > 0) {
      console.log(`  ${p.name}: ${p.fantasyPoints} pts`);
    }
  }

  // Step 2: Insert player_match_stats
  console.log('\nStep 1: Inserting player_match_stats...');
  const statsRows = match.players.map(p => ({
    match_id: match.matchId,
    player_id: p.pid,
    runs: p.runs,
    balls_faced: p.balls,
    fours: p.fours,
    sixes: p.sixes,
    strike_rate: p.balls > 0 ? Math.round((p.runs / p.balls) * 10000) / 100 : 0,
    overs_bowled: p.overs,
    runs_conceded: p.runsConceded,
    economy_rate: p.econ,
    wickets: p.wickets,
    catches: p.catches,
    stumpings: p.stumpings,
    run_outs: p.runOuts,
    total_fantasy_points: p.fantasyPoints,
    is_man_of_match: p.isMoM,
    has_century: p.runs >= 100,
    has_five_wicket_haul: p.wickets >= 5,
    has_hat_trick: false,
  }));

  const { error: statsErr } = await sb.from('player_match_stats').upsert(statsRows, { onConflict: 'match_id,player_id' });
  if (statsErr) { console.error('Stats insert error:', statsErr.message); return; }
  console.log(`  Inserted ${statsRows.length} player stats`);

  // Step 3: Insert match_results
  console.log('\nStep 2: Inserting match_results...');
  const { error: resErr } = await sb.from('match_results').upsert({
    match_id: match.matchId,
    winner: match.winner,
    total_runs: match.totalRuns,
    man_of_match: match.manOfMatch,
  }, { onConflict: 'match_id' });
  if (resErr) { console.error('Results insert error:', resErr.message); return; }
  console.log('  Done');

  // Step 4: Update side bet correct_answer
  console.log('\nStep 3: Updating side bet answer...');
  const { error: sbErr } = await sb.from('side_bets')
    .update({ correct_answer: match.sideBetAnswer, status: 'SCORED' })
    .eq('side_bet_id', match.sideBetId);
  if (sbErr) { console.error('Side bet update error:', sbErr.message); return; }
  console.log(`  Side bet answer set to "${match.sideBetAnswer}"`);

  // Step 5: Call scoring RPC
  console.log('\nStep 4: Calling calculate_match_scores RPC...');
  const { error: rpcErr } = await sb.rpc('calculate_match_scores', {
    p_match_id: match.matchId,
    p_event_id: match.eventId,
  });
  if (rpcErr) { console.error('RPC error:', rpcErr.message); return; }
  console.log('  Scoring complete');

  // Step 6: Update match status to SCORED
  console.log('\nStep 5: Updating match status to SCORED...');
  const { error: mcErr } = await sb.from('match_config')
    .update({ status: 'SCORED' })
    .eq('match_id', match.matchId);
  if (mcErr) { console.error('Match status update error:', mcErr.message); return; }
  console.log('  Status set to SCORED');

  // Step 7: Verify — show bet scores
  console.log('\nStep 6: Verifying scores...');
  const { data: bets } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', match.matchId);
  if (bets) {
    for (const b of bets) {
      console.log(`  User ${b.user_id}: total=${b.score}, winner=${b.winner_points}, runs=${b.total_runs_points}, players=${b.player_pick_points}, side=${b.side_bet_points}`);
    }
  }

  // Step 8: Show leaderboard top 15
  const { data: lb } = await sb.from('leaderboard')
    .select('rank, display_name, total_score, matches_played')
    .order('rank', { ascending: true })
    .limit(15);
  if (lb) {
    console.log('\nLeaderboard:');
    lb.forEach(r => console.log(`  #${r.rank} ${r.display_name}: ${r.total_score} pts (${r.matches_played} matches)`));
  }

  console.log('\nDone!');
})();
