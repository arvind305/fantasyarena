/**
 * Score wc_m33: SCO vs NEP — Nepal won by 7 wickets
 *
 * SCO 170/7 (20 ov) vs NEP 171/3 (19.2 ov)
 * Total runs: 341. MoM: Dipendra Singh Airee
 * Extras: SCO 13 (b4 lb6 w3) + NEP 5 (lb3 w2) = 18 → Side bet "11-20"
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
  matchId: 'wc_m33',
  eventId: 't20wc_2026',
  label: 'SCO vs NEP',
  winner: 'opt_wc_m33_winner_teamB', // NEP = teamB, NEP won
  totalRuns: 341,                     // 170 + 171
  manOfMatch: 'Dipendra Singh Airee',
  sideBetId: '14046afd-930d-485d-8794-cf4d56931489',
  sideBetAnswer: '11-20',             // 18 total extras
  players: [
    // === SCO BATTING (170/7, 20 ov) ===
    // George Munsey: 27(29), 4x4, 0x6 — c Sundeep Jora b Rohit Paudel
    { pid: 'd15f7499-a8db-428d-a0f2-dddce2c5cffa', name: 'George Munsey',       runs: 27, balls: 29, fours: 4, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Michael Jones: 71(45), 8x4, 3x6 — b Sompal Kami
    { pid: 'bc0a059f-402d-4e17-b6b6-f6346328d1be', name: 'Michael Jones',       runs: 71, balls: 45, fours: 8, sixes: 3, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Brandon McMullen: 25(19), 1x4, 1x6 — c and b Sompal Kami
    { pid: '45669a3b-227b-4bb5-b4ec-09e93eb3ac95', name: 'Brandon McMullen',    runs: 25, balls: 19, fours: 1, sixes: 1, overs: 1, runsConceded: 5,  econ: 5.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Richie Berrington (c): 10(6), 0x4, 1x6 — c Sundeep Jora b Kushal Bhurtel
    { pid: 'c6ba4a3c-1340-4414-8599-1d40983b0ff6', name: 'Richie Berrington',   runs: 10, balls: 6,  fours: 0, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Tom Bruce: 5(6), 0x4, 0x6 — b Sompal Kami
    { pid: '23345390-8af6-4ea8-be8b-fe213f0fa21a', name: 'Tom Bruce',           runs: 5,  balls: 6,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Matthew Cross (wk): 4(2), 1x4, 0x6 — b Nandan Yadav
    { pid: 'c6f2d543-35ec-4aca-83b7-bafd31f0d1cf', name: 'Matthew Cross',       runs: 4,  balls: 2,  fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Michael Leask: 4(8), 0x4, 0x6 — c Aasif Sheikh b Nandan Yadav. Bowled 4-0-30-3
    { pid: 'ab15db73-9e8e-46db-9429-4e00425c4c86', name: 'Michael Leask',       runs: 4,  balls: 8,  fours: 0, sixes: 0, overs: 4, runsConceded: 30, econ: 7.50,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Mark Watt: 10*(4), 0x4, 1x6 — not out. Bowled 3-0-35-0
    { pid: '5d4675ea-c537-4f40-857c-5467347138b7', name: 'Mark Watt',           runs: 10, balls: 4,  fours: 0, sixes: 1, overs: 3, runsConceded: 35, econ: 11.67, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Oliver Davidson: 1*(1), 0x4, 0x6 — not out. Bowled 4-0-31-0
    { pid: '8de2381c-dc7c-4dfd-835b-6106ac90d056', name: 'Oliver Davidson',     runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 4, runsConceded: 31, econ: 7.75,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // DNB: Brad Wheal. Bowled 3.2-0-34-0
    { pid: '082c6067-1b2d-41d3-824e-e818a48cad3f', name: 'Brad Wheal',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 34, econ: 10.20, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // DNB: Brad Currie. Bowled 4-0-33-0
    { pid: 'be1a7903-72cc-4cb4-b993-6588016beb28', name: 'Brad Currie',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 33, econ: 8.25,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },

    // === NEP BATTING (171/3, 19.2 ov) ===
    // Kushal Bhurtel: 43(35), 1x4, 4x6 — c Tom Bruce b Michael Leask. Bowled 4-0-37-1
    { pid: '068d8f45-61fb-436a-8039-25762501bc74', name: 'Kushal Bhurtel',       runs: 43, balls: 35, fours: 1, sixes: 4, overs: 4, runsConceded: 37, econ: 9.25,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Aasif Sheikh (wk): 33(27), 0x4, 2x6 — c Brad Wheal b Michael Leask
    { pid: '4d06745a-4be9-44ed-8d02-ff6e2f922b36', name: 'Aasif Sheikh',        runs: 33, balls: 27, fours: 0, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Rohit Paudel (c): 16(14), 1x4, 0x6 — c Michael Jones b Michael Leask. Bowled 2-0-12-1
    { pid: '74b39989-2a0a-4f6f-afaf-913efa57f4a3', name: 'Rohit Paudel',        runs: 16, balls: 14, fours: 1, sixes: 0, overs: 2, runsConceded: 12, econ: 6.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Dipendra Singh Airee: 50*(23), 4x4, 3x6 — not out. Bowled 3-0-23-0. MoM!
    { pid: '699ddb1c-85db-4a8d-bc23-8c2cd76589f9', name: 'Dipendra Singh Airee', runs: 50, balls: 23, fours: 4, sixes: 3, overs: 3, runsConceded: 23, econ: 7.67,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
    // Gulsan Jha: 24*(17), 1x4, 2x6 — not out
    { pid: 'c7cf1179-5a12-45ce-9fac-22c7c3545e92', name: 'Gulsan Jha',          runs: 24, balls: 17, fours: 1, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },

    // === NEP BOWLERS (who didn't bat) ===
    // Sompal Kami: 4-0-25-3
    { pid: 'afb8cbb0-af58-4cf2-ae74-bc5901097454', name: 'Sompal Kami',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 25, econ: 6.25,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Nandan Yadav: 4-0-34-2
    { pid: '694f62e3-eb61-4414-af51-bfacf6182ccf', name: 'Nandan Yadav',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 34, econ: 8.50,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Sandeep Lamichhane: 3-0-29-0
    { pid: '6489d997-6012-4a77-9e72-bbea3a7dc3fb', name: 'Sandeep Lamichhane',  runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 29, econ: 9.67,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },

    // === SCO BOWLER (who didn't bat but bowled in NEP innings) ===
    // McMullen already included above (bat + bowl)
  ],
};

// Catches from scorecard:
// SCO batting: Sundeep Jora caught Munsey and Berrington (2 catches)
// SCO batting: no other catches by NEP fielders named beyond bowlers
// NEP batting: Tom Bruce caught Bhurtel (1), Michael Jones caught Paudel (1), Brad Wheal caught Aasif Sheikh (1)

// Let me add catches properly:
// Sundeep Jora: 2 catches (Munsey c Sundeep Jora b Paudel, Berrington c Sundeep Jora b Bhurtel)
// Aasif Sheikh: 1 catch (Leask c Aasif Sheikh b Nandan Yadav)  — wait, Aasif is WK, that's a catch
// Tom Bruce: 1 catch (Bhurtel c Tom Bruce b Michael Leask)
// Michael Jones: 1 catch (Paudel c Michael Jones b Michael Leask)
// Brad Wheal: 1 catch (Aasif Sheikh c Brad Wheal b Michael Leask)

(async () => {
  console.log('=== Scoring wc_m33: SCO vs NEP ===\n');

  // Fix catches on fielding players
  const catchMap = {
    '73b5508f-fcbf-47b9-8121-5d3d9974365d': 2, // Sundeep Jora: caught Munsey + Berrington
    '4d06745a-4be9-44ed-8d02-ff6e2f922b36': 1, // Aasif Sheikh (wk): caught Leask
    '23345390-8af6-4ea8-be8b-fe213f0fa21a': 1, // Tom Bruce: caught Bhurtel
    'bc0a059f-402d-4e17-b6b6-f6346328d1be': 1, // Michael Jones: caught Paudel
    '082c6067-1b2d-41d3-824e-e818a48cad3f': 1, // Brad Wheal: caught Aasif Sheikh
  };

  // Add Sundeep Jora (didn't bat, didn't bowl, but fielded 2 catches)
  match.players.push({
    pid: '73b5508f-fcbf-47b9-8121-5d3d9974365d', name: 'Sundeep Jora',
    runs: 0, balls: 0, fours: 0, sixes: 0, overs: 0, runsConceded: 0, econ: null, wickets: 0,
    catches: 2, stumpings: 0, runOuts: 0, isMoM: false,
  });

  // Apply catches to existing players
  for (const p of match.players) {
    if (catchMap[p.pid] && p.pid !== '73b5508f-fcbf-47b9-8121-5d3d9974365d') {
      p.catches = catchMap[p.pid];
    }
  }

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

  // Step 8: Show leaderboard top 5
  const { data: lb } = await sb.from('leaderboard')
    .select('rank, display_name, total_score, matches_played')
    .order('rank', { ascending: true })
    .limit(5);
  if (lb) {
    console.log('\nLeaderboard (top 5):');
    lb.forEach(r => console.log(`  #${r.rank} ${r.display_name}: ${r.total_score} pts (${r.matches_played} matches)`));
  }

  console.log('\nDone!');
})();
