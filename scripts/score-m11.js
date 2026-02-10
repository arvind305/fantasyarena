/**
 * Score wc_m11: NZ vs UAE (New Zealand vs United Arab Emirates)
 * Result: NZ won by 10 wickets (chased 174 in 15.2 overs)
 * UAE: 173-6 (20 ov) | NZ: 175-0 (15.2 ov)
 * Total runs: 348 | MoM: Tim Seifert
 * Side bet: "How many runs in first innings powerplay?" → 50 runs → "31-50"
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCH_ID = 'wc_m11';
const WINNER = 'opt_wc_m11_winner_teamA'; // NZ = teamA
const TOTAL_RUNS = 348; // 173 + 175
const MAN_OF_MATCH = 'Tim Seifert';
const SIDE_BET_ID = '697c153f-9de8-42c1-bc3e-3f8a0581b104';
const SIDE_BET_ANSWER = '31-50'; // Powerplay: 50 runs

// Fielding notes:
//   UAE batting dismissals → NZ fielding:
//     Aryansh Sharma: c Glenn Phillips b Jacob Duffy → Phillips: 1 catch
//     Alishan Sharafu: c Daryl Mitchell b Mitchell Santner → Mitchell: 1 catch
//     Harshit Kaushik: c James Neesham b Glenn Phillips → Neesham: 1 catch (Kaushik not in DB)
//     Mayank Kumar: c Mitchell Santner b Lockie Ferguson → Santner: 1 catch (Mayank not in DB)
//     Sohaib Khan: c Glenn Phillips b Matt Henry → Phillips: 1 catch (Sohaib not in DB)
//     Muhammad Arfan: c Glenn Phillips b Matt Henry → Phillips: 1 catch (Arfan not in DB)
//   NZ batting: No wickets fell → no UAE fielding

// Direct player_id mapping
const playerStats = [
  // === UAE (batted first) ===
  { pid: '9f11f370-b490-44c6-8aa7-2f541f9cf171', name: 'Aryansh Sharma',    runs: 8,  balls: 6,  fours: 2, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '5134b69d-86f3-4d16-931a-e782cb2609e3', name: 'Muhammad Waseem',    runs: 66, balls: 45, fours: 4, sixes: 3, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '22e74fa7-558b-4ac9-b058-5dddb09aa954', name: 'Alishan Sharafu',    runs: 55, balls: 47, fours: 5, sixes: 2, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  // Harshit Kaushik: NOT IN DB (2 runs, 6 balls) — skipped
  // Mayank Kumar: NOT IN DB (21 runs, 13 balls) — skipped
  // Sohaib Khan: NOT IN DB (7 runs, 3 balls) — skipped
  // Muhammad Arfan: NOT IN DB as player — skipped batting, but check bowling below
  // UAE bowlers
  { pid: 'bfbc1931-9569-4ad0-88df-78bec17f29cc', name: 'Haider Ali',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 6.75,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  // Muhammad Rohid Khan: NOT IN DB — skipped (3.2 ov, 51 runs, 0 wkt)
  { pid: 'cf72a819-5bdb-4239-9007-5fd069a563c0', name: 'Junaid Siddique',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 11.75, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '35c37f8a-a2a9-43fa-b102-67a1cbfcee79', name: 'Dhruv Parashar',     runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 1,    econ: 14.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  // Muhammad Arfan: NOT IN DB — skipped (3 ov, 36 runs, 0 wkt + batted 0(1))

  // === NEW ZEALAND ===
  // Batters (NZ chased without losing a wicket)
  { pid: '72f200aa-8beb-42ef-b5dd-a6494478688e', name: 'Tim Seifert',        runs: 89, balls: 42, fours: 12, sixes: 3, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
  { pid: '5bd74887-e3cf-4af2-88f6-7b5bbb18d9ea', name: 'Finn Allen',         runs: 84, balls: 50, fours: 5,  sixes: 5, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  // NZ bowlers
  { pid: '32ef7a8b-93e2-48c2-860f-438371569f19', name: 'Matt Henry',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 9.25,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '10fc22f1-20c4-46eb-9da6-90b48d842978', name: 'Jacob Duffy',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,    econ: 8.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '2bcfdf10-7782-4ef6-88d1-0f7582b5a1e4', name: 'Lockie Ferguson',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 8.75,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '431d3917-d53a-430d-973a-527ccc04ee88', name: 'Mitchell Santner',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 5.75,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '2e9080d3-406d-41f2-aba4-9ca3b2feafd7', name: 'Rachin Ravindra',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,    econ: 6.33,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'b04df15b-f357-4e5b-9f16-e83c769509ea', name: 'James Neesham',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 1,    econ: 7.00,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: 'f17e4c8a-fcda-4cc5-8e3c-8f1140d0f67a', name: 'Glenn Phillips',     runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,    econ: 15.00, wickets: 1, catches: 3, stumpings: 0, runOuts: 0 },
  // Fielded only (no bat/bowl)
  { pid: 'd7f70bb4-3be9-4fec-9f9e-0ee39c143e32', name: 'Daryl Mitchell',     runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
];

// Fantasy points calculation (matches the SQL RPC)
function calcFantasyPoints(p) {
  let pts = 0;
  pts += p.runs;                          // 1 point per run
  pts += p.fours * 10;                    // 10 points per four
  pts += p.sixes * 20;                    // 20 points per six
  if (p.balls > 0) {                      // Strike rate as points
    pts += Math.round((p.runs / p.balls) * 100);
  }
  pts += p.wickets * 20;                  // 20 points per wicket
  if (p.overs >= 1 && p.econ !== null) {  // Economy bonus
    if (p.econ <= 6) pts += 100;
    else if (p.econ <= 8) pts += 50;
    else if (p.econ <= 10) pts += 25;
  }
  pts += (p.catches || 0) * 5;           // 5 per catch
  pts += (p.runOuts || 0) * 5;           // 5 per run out
  pts += (p.stumpings || 0) * 5;         // 5 per stumping
  if (p.runs >= 100) pts += 200;          // Century bonus
  if (p.wickets >= 5) pts += 200;         // 5-wicket bonus
  if (p.isMoM) pts += 200;               // MoM bonus
  return pts;
}

(async () => {
  console.log('=== SCORING wc_m11: NZ vs UAE ===\n');

  // Pre-scoring checklist
  console.log('PRE-SCORING CHECKLIST:');
  const checks = { winner: !!WINNER, totalRuns: !!TOTAL_RUNS, manOfMatch: !!MAN_OF_MATCH, sideBetAnswer: !!SIDE_BET_ANSWER, playerStats: playerStats.length > 0 };
  Object.entries(checks).forEach(([k, v]) => console.log(`  ${v ? 'OK' : 'MISSING'} ${k}`));
  if (!Object.values(checks).every(Boolean)) { console.error('\nABORTING: Missing data!'); process.exit(1); }
  console.log('  All checks passed.\n');

  // Calculate and display fantasy points
  console.log('=== FANTASY POINTS CALCULATION ===');
  console.log('Player'.padEnd(22) + '| Runs | Wkts | Cat | SR     | Econ  | Fantasy | PID');
  console.log('-'.repeat(95));

  const statsToInsert = [];
  for (const p of playerStats) {
    const fantasyPts = calcFantasyPoints(p);
    const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '—';
    console.log(
      p.name.padEnd(22) + '| ' +
      String(p.runs).padStart(4) + ' | ' +
      String(p.wickets).padStart(4) + ' | ' +
      String(p.catches + p.runOuts + p.stumpings).padStart(3) + ' | ' +
      String(sr).padStart(6) + ' | ' +
      String(p.econ !== null ? p.econ.toFixed(2) : '—').padStart(5) + ' | ' +
      String(fantasyPts).padStart(7) + ' | ' +
      p.pid.slice(0, 8)
    );
    statsToInsert.push({
      match_id: MATCH_ID,
      player_id: p.pid,
      runs: p.runs, balls_faced: p.balls, fours: p.fours, sixes: p.sixes,
      strike_rate: p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(2)) : 0,
      overs_bowled: p.overs >= 1 ? p.overs : (p.overs > 0 ? p.overs : 0),
      runs_conceded: p.econ !== null && p.overs > 0 ? Math.round(p.econ * p.overs) : 0,
      wickets: p.wickets, economy_rate: p.econ || 0,
      catches: p.catches, stumpings: p.stumpings, run_outs: p.runOuts,
      has_century: p.runs >= 100, has_five_wicket_haul: p.wickets >= 5, has_hat_trick: false,
      is_man_of_match: !!p.isMoM, total_fantasy_points: fantasyPts,
    });
  }

  // Step 1: Lock match
  console.log('\n=== STEP 1: LOCK MATCH ===');
  const { error: lockErr } = await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', MATCH_ID);
  console.log('Match locked:', lockErr ? lockErr.message : 'OK');

  // Step 2: Insert player match stats
  console.log('\n=== STEP 2: INSERT PLAYER MATCH STATS ===');
  await sb.from('player_match_stats').delete().eq('match_id', MATCH_ID);
  const { error: statsErr } = await sb.from('player_match_stats').insert(statsToInsert);
  if (statsErr) {
    console.error('Error inserting stats:', statsErr);
    for (const stat of statsToInsert) {
      const { error: singleErr } = await sb.from('player_match_stats').insert(stat);
      if (singleErr) console.error('  Failed:', stat.player_id.slice(0, 8), '—', singleErr.message);
    }
    return;
  }
  console.log('Inserted ' + statsToInsert.length + ' player stats');

  // Step 3: Insert match results
  console.log('\n=== STEP 3: INSERT MATCH RESULTS ===');
  const { error: resultErr } = await sb.from('match_results').upsert({
    match_id: MATCH_ID, winner: WINNER, total_runs: TOTAL_RUNS, man_of_match: MAN_OF_MATCH,
    side_bet_answers: { [SIDE_BET_ID]: SIDE_BET_ANSWER }, completed_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  if (resultErr) { console.error('Error:', resultErr); return; }
  console.log('Result saved: winner=NZ, total_runs=' + TOTAL_RUNS + ', MoM=' + MAN_OF_MATCH);

  // Step 4: Update correct answers
  console.log('\n=== STEP 4: UPDATE CORRECT ANSWERS ===');
  await sb.from('match_questions').update({ correct_answer: WINNER }).eq('match_id', MATCH_ID).eq('kind', 'WINNER');
  await sb.from('match_questions').update({ correct_answer: String(TOTAL_RUNS) }).eq('match_id', MATCH_ID).eq('kind', 'TOTAL_RUNS');
  await sb.from('side_bets').update({ correct_answer: SIDE_BET_ANSWER }).eq('side_bet_id', SIDE_BET_ID);
  console.log('Correct answers updated');

  // Step 5: Lock bets
  console.log('\n=== STEP 5: LOCK BETS ===');
  const { data: lockedBets } = await sb.from('bets').update({ is_locked: true }).eq('match_id', MATCH_ID).select('bet_id');
  console.log('Locked ' + (lockedBets?.length || 0) + ' bets');

  // Step 6: Calculate player fantasy points via RPC
  console.log('\n=== STEP 6: CALCULATE PLAYER FANTASY POINTS ===');
  const { data: fpResult, error: fpErr } = await sb.rpc('calculate_all_player_points', { p_match_id: MATCH_ID });
  if (fpErr) { console.error('Error:', fpErr); return; }
  console.log('Player points:', JSON.stringify(fpResult));

  // Step 7: Score all bets
  console.log('\n=== STEP 7: SCORE ALL BETS ===');
  const { data: scoreResult, error: scoreErr } = await sb.rpc('calculate_match_scores', { p_match_id: MATCH_ID, p_event_id: 't20wc_2026' });
  if (scoreErr) { console.error('Error:', scoreErr); return; }
  console.log('Scoring result:', JSON.stringify(scoreResult));

  // Step 8: Show results
  console.log('\n=== FINAL SCORES FOR ' + MATCH_ID.toUpperCase() + ' ===');
  const { data: bets } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points')
    .eq('match_id', MATCH_ID).order('score', { ascending: false });
  const userIds = bets.map(b => b.user_id);
  const { data: users } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });
  console.log('User'.padEnd(22) + '| Score  | Winner | Runs  | Players | Side  | Runner');
  console.log('-'.repeat(85));
  bets.forEach(b => {
    console.log(
      (nameMap[b.user_id] || b.user_id.slice(0, 8)).padEnd(21) + ' | ' +
      String(b.score || 0).padStart(6) + ' | ' + String(b.winner_points || 0).padStart(6) + ' | ' +
      String(b.total_runs_points || 0).padStart(5) + ' | ' + String(b.player_pick_points || 0).padStart(7) + ' | ' +
      String(b.side_bet_points || 0).padStart(5) + ' | ' + String(b.runner_points || 0).padStart(6)
    );
  });

  const { data: lb } = await sb.from('leaderboard').select('display_name, total_score, matches_played, rank').order('rank', { ascending: true });
  console.log('\n=== LEADERBOARD AFTER M11 ===');
  (lb || []).forEach(u => console.log(u.rank + '. ' + u.display_name.padEnd(22) + ' | ' + u.total_score + ' pts | ' + u.matches_played + ' matches'));
  console.log('\nDone!');
})();
