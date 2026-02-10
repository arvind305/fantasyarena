/**
 * Score wc_m10: NED vs NAM (Netherlands vs Namibia)
 * Result: NED won by 7 wickets (chased 157 in 18 overs)
 * NAM: 156-8 (20 ov) | NED: 159-3 (18 ov)
 * Total runs: 315 | MoM: Bas de Leede
 * Side bet: "Who will give lesser runs?" → Spinners (155) vs Pacers (156) → Spinners
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCH_ID = 'wc_m10';
const WINNER = 'opt_wc_m10_winner_teamA'; // NED = teamA
const TOTAL_RUNS = 315; // 156 + 159
const MAN_OF_MATCH = 'Bas de Leede';
const SIDE_BET_ID = '1f3a8738-2b0f-4a87-b67e-4fc3348899ae';
const SIDE_BET_ANSWER = 'Spinners';

// All players from the scorecard
// Fielding notes:
//   NAM batting dismissals → NED fielding:
//     Steenkamp: st Scott Edwards b Aryan Dutt → Edwards: 1 stumping, Dutt: 1 wicket
//     Frylinck: c Scott Edwards b Logan van Beek → Edwards: 1 catch, van Beek: 1 wicket
//     Loftie-Eaton: c Roelof van der Merwe b Logan van Beek → van der Merwe: 1 catch, van Beek: 1 wicket
//     Erasmus: c Aryan Dutt b Bas de Leede → Dutt: 1 catch, de Leede: 1 wicket
//     Smit: b Bas de Leede → de Leede: 1 wicket (bowled)
//     Green: c Michael Levitt b Fred Klaassen → Levitt: 1 catch, Klaassen: 1 wicket
//     Trumpelmann: run out (Bas de Leede) → de Leede: 1 run out
//     Myburgh: run out (Logan van Beek/Scott Edwards) → van Beek: 1 run out
//
//   NED batting dismissals → NAM fielding:
//     Levitt: c Willem Myburgh b Ruben Trumpelmann → Myburgh: 1 catch, Trumpelmann: 1 wicket
//     ODowd: c Gerhard Erasmus b Bernard Scholtz → Erasmus: 1 catch, Scholtz: 1 wicket
//     Ackermann: c Gerhard Erasmus b Jan Nicol Loftie-Eaton → Erasmus: 1 catch, Loftie-Eaton: 1 wicket

// Direct player_id mapping to avoid name-matching issues (en-dash vs hyphen etc.)
const playerStats = [
  // === NAMIBIA ===
  { pid: 'dfac417d-8979-45d4-85fb-7ff054976f61', name: 'Louren Steenkamp',       runs: 6,  balls: 6,  fours: 1, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '7ec40512-1fc1-455d-b731-e711e856d9e6', name: 'Jan Frylinck',           runs: 30, balls: 26, fours: 3, sixes: 1, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '13e916b6-72e0-43df-8211-85568526ba3f', name: 'Jan Nicol Loftie-Eaton', runs: 42, balls: 38, fours: 1, sixes: 2, overs: 2,   econ: 15.50, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '15068c87-21ad-4004-8509-d8247dfb33ec', name: 'Gerhard Erasmus',        runs: 18, balls: 9,  fours: 2, sixes: 1, overs: 1,   econ: 11.00, wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
  { pid: '2315a209-6258-4b3b-8dad-458766a1c00e', name: 'JJ Smit',                runs: 22, balls: 15, fours: 1, sixes: 2, overs: 3,   econ: 8.33,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'ee91a9cc-9aa8-40cb-a3e4-0b658bbd7c46', name: 'Zane Green',             runs: 9,  balls: 10, fours: 1, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'baba58ed-fe1f-4f96-b143-128f6322ca68', name: 'Ruben Trumpelmann',      runs: 9,  balls: 8,  fours: 0, sixes: 1, overs: 4,   econ: 7.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'a1c9346e-12cd-45af-8534-92426eabf58d', name: 'Dylan Leicher',          runs: 6,  balls: 5,  fours: 0, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '9a5790a9-d870-416b-a93f-3df38c911922', name: 'WP Myburgh',             runs: 4,  balls: 4,  fours: 0, sixes: 0, overs: 2,   econ: 6.00,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '4f1fc19e-163b-4c5a-828b-544b2a822cb8', name: 'Bernard Scholtz',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   econ: 6.75,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '84a7d596-49c7-41ab-89d4-9cb7516f5050', name: 'Max Heingo',             runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,   econ: 11.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

  // === NETHERLANDS ===
  { pid: 'dfb02dbd-a66c-4631-a419-a651a61d21e5', name: 'Michael Levitt',         runs: 28, balls: 15, fours: 1, sixes: 3, overs: 0,   econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '20ec1583-6899-46a0-a4b4-a5355f71fd01', name: "Max O'Dowd",             runs: 7,  balls: 8,  fours: 1, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '7e2e47df-fe5b-4a21-af2d-b069fd87d6c2', name: 'Bas de Leede',           runs: 72, balls: 48, fours: 5, sixes: 4, overs: 3,   econ: 6.67,  wickets: 2, catches: 0, stumpings: 0, runOuts: 1, isMoM: true },
  { pid: '4fc2471d-29eb-4779-9e7c-bf17cd697082', name: 'Colin Ackermann',        runs: 32, balls: 28, fours: 0, sixes: 1, overs: 3,   econ: 11.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'f833138e-9b09-4723-a288-f16ed6bd7c57', name: 'Scott Edwards',          runs: 18, balls: 9,  fours: 1, sixes: 1, overs: 0,   econ: null,  wickets: 0, catches: 1, stumpings: 1, runOuts: 0 },
  { pid: '9dee7ebc-e0e3-4f5a-a6d0-3002a999c09b', name: 'Zach Lion-Cachet',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 1,   econ: 6.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '56e7c456-280a-48f4-a007-4656a6d461a7', name: 'Logan van Beek',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,   econ: 4.33,  wickets: 2, catches: 0, stumpings: 0, runOuts: 1 },
  { pid: '3a0d2bdc-9293-47f8-970d-f13e8ca1ba12', name: 'Aryan Dutt',             runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,   econ: 4.33,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '2fb5ff8f-9b02-430d-858f-093be9c2931c', name: 'Roelof van der Merwe',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,   econ: 11.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '655c5cb1-d1c0-4a4f-9f6e-ab79529e0f2d', name: 'Timm van der Gugten',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,   econ: 10.50, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '6ebdee4c-7331-48e4-84ee-314d29ffded0', name: 'Fred Klaassen',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,   econ: 8.33,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
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
  // Hat-trick checked separately
  if (p.isMoM) pts += 200;               // MoM bonus
  return pts;
}

(async () => {
  console.log('=== SCORING wc_m10: NED vs NAM ===\n');

  // ── PRE-SCORING CHECKLIST ──
  console.log('PRE-SCORING CHECKLIST:');
  const checks = {
    winner: !!WINNER,
    totalRuns: !!TOTAL_RUNS,
    manOfMatch: !!MAN_OF_MATCH,
    sideBetAnswer: !!SIDE_BET_ANSWER,
    playerStats: playerStats.length > 0,
  };
  Object.entries(checks).forEach(([k, v]) => {
    console.log(`  ${v ? 'OK' : 'MISSING'} ${k}: ${v ? 'set' : 'NOT SET'}`);
  });
  const allOk = Object.values(checks).every(Boolean);
  if (!allOk) {
    console.error('\nABORTING: Not all required data is present!');
    process.exit(1);
  }
  console.log('  All checks passed.\n');

  // Calculate and display fantasy points (using direct player_id mapping)
  console.log('\n=== FANTASY POINTS CALCULATION ===');
  console.log('Player'.padEnd(26) + '| Runs | Wkts | Cat | SR     | Econ  | Fantasy | Player ID');
  console.log('-'.repeat(105));

  const statsToInsert = [];

  for (const p of playerStats) {
    const fantasyPts = calcFantasyPoints(p);
    const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '—';

    console.log(
      p.name.padEnd(26) + '| ' +
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
      runs: p.runs,
      balls_faced: p.balls,
      fours: p.fours,
      sixes: p.sixes,
      strike_rate: p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(2)) : 0,
      overs_bowled: p.overs >= 1 ? p.overs : (p.overs > 0 ? p.overs : 0),
      runs_conceded: p.econ !== null && p.overs > 0 ? Math.round(p.econ * p.overs) : 0,
      wickets: p.wickets,
      economy_rate: p.econ || 0,
      catches: p.catches,
      stumpings: p.stumpings,
      run_outs: p.runOuts,
      has_century: p.runs >= 100,
      has_five_wicket_haul: p.wickets >= 5,
      has_hat_trick: false,
      is_man_of_match: !!p.isMoM,
      total_fantasy_points: fantasyPts,
    });
  }

  // Step 1: Lock match
  console.log('\n=== STEP 1: LOCK MATCH ===');
  const { error: lockErr } = await sb
    .from('match_config')
    .update({ status: 'LOCKED' })
    .eq('match_id', MATCH_ID);
  console.log('Match locked:', lockErr ? lockErr.message : 'OK');

  // Step 2: Insert player match stats
  console.log('\n=== STEP 2: INSERT PLAYER MATCH STATS ===');
  await sb.from('player_match_stats').delete().eq('match_id', MATCH_ID);
  const { error: statsErr } = await sb.from('player_match_stats').insert(statsToInsert);
  if (statsErr) {
    console.error('Error inserting stats:', statsErr);
    // Try one-by-one
    for (const stat of statsToInsert) {
      const { error: singleErr } = await sb.from('player_match_stats').insert(stat);
      if (singleErr) {
        console.error('  Failed:', stat.player_id.slice(0, 8), '—', singleErr.message);
      }
    }
    return;
  }
  console.log('Inserted ' + statsToInsert.length + ' player stats');

  // Step 3: Insert match results
  console.log('\n=== STEP 3: INSERT MATCH RESULTS ===');
  const { error: resultErr } = await sb
    .from('match_results')
    .upsert({
      match_id: MATCH_ID,
      winner: WINNER,
      total_runs: TOTAL_RUNS,
      man_of_match: MAN_OF_MATCH,
      side_bet_answers: { [SIDE_BET_ID]: SIDE_BET_ANSWER },
      completed_at: new Date().toISOString(),
    }, { onConflict: 'match_id' });
  if (resultErr) { console.error('Error inserting results:', resultErr); return; }
  console.log('Match result saved: winner=' + WINNER + ', total_runs=' + TOTAL_RUNS + ', MoM=' + MAN_OF_MATCH);

  // Step 4: Update correct answers on questions and side bets
  console.log('\n=== STEP 4: UPDATE CORRECT ANSWERS ===');
  await sb.from('match_questions').update({ correct_answer: WINNER }).eq('match_id', MATCH_ID).eq('kind', 'WINNER');
  await sb.from('match_questions').update({ correct_answer: String(TOTAL_RUNS) }).eq('match_id', MATCH_ID).eq('kind', 'TOTAL_RUNS');
  await sb.from('side_bets').update({ correct_answer: SIDE_BET_ANSWER }).eq('side_bet_id', SIDE_BET_ID);
  console.log('Match questions and side bets updated');

  // Step 5: Lock all bets
  console.log('\n=== STEP 5: LOCK BETS ===');
  const { data: lockedBets } = await sb
    .from('bets')
    .update({ is_locked: true })
    .eq('match_id', MATCH_ID)
    .select('bet_id');
  console.log('Locked ' + (lockedBets?.length || 0) + ' bets');

  // Step 6: Calculate player fantasy points via RPC
  console.log('\n=== STEP 6: CALCULATE PLAYER FANTASY POINTS ===');
  const { data: fpResult, error: fpErr } = await sb.rpc('calculate_all_player_points', { p_match_id: MATCH_ID });
  if (fpErr) { console.error('Error calculating player points:', fpErr); return; }
  console.log('Player points result:', JSON.stringify(fpResult));

  // Step 7: Score all bets via RPC
  console.log('\n=== STEP 7: SCORE ALL BETS ===');
  const { data: scoreResult, error: scoreErr } = await sb
    .rpc('calculate_match_scores', { p_match_id: MATCH_ID, p_event_id: 't20wc_2026' });
  if (scoreErr) { console.error('Scoring error:', scoreErr); return; }
  console.log('Scoring result:', JSON.stringify(scoreResult));

  // Step 8: Show results
  console.log('\n=== FINAL SCORES FOR ' + MATCH_ID.toUpperCase() + ' ===');
  const { data: bets } = await sb
    .from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points')
    .eq('match_id', MATCH_ID)
    .order('score', { ascending: false });

  const userIds = bets.map(b => b.user_id);
  const { data: users } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  console.log('User'.padEnd(22) + '| Score  | Winner | Runs  | Players | Side  | Runner');
  console.log('-'.repeat(85));
  bets.forEach(b => {
    console.log(
      (nameMap[b.user_id] || b.user_id.slice(0, 8)).padEnd(21) + ' | ' +
      String(b.score || 0).padStart(6) + ' | ' +
      String(b.winner_points || 0).padStart(6) + ' | ' +
      String(b.total_runs_points || 0).padStart(5) + ' | ' +
      String(b.player_pick_points || 0).padStart(7) + ' | ' +
      String(b.side_bet_points || 0).padStart(5) + ' | ' +
      String(b.runner_points || 0).padStart(6)
    );
  });

  // Show updated leaderboard
  const { data: lb } = await sb
    .from('leaderboard')
    .select('display_name, total_score, matches_played, rank')
    .order('rank', { ascending: true });

  console.log('\n=== LEADERBOARD AFTER M10 ===');
  (lb || []).forEach(u => {
    console.log(u.rank + '. ' + u.display_name.padEnd(22) + ' | ' + u.total_score + ' pts | ' + u.matches_played + ' matches');
  });

  console.log('\nDone! Match wc_m10 scored successfully.');
})();
