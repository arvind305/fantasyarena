/**
 * Score wc_m14: AUS vs IRE
 * AUS: 182-6 (20 ov) | IRE: 115-10 (16.5 ov) → AUS won by 67 runs
 * Total runs: 297 | MoM: Nathan Ellis
 * Side bet: "How many wickets will fall in the first innings powerplay?" → 2 → "2"
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCH_ID = 'wc_m14';
const WINNER = 'opt_wc_m14_winner_teamA'; // AUS = teamA
const TOTAL_RUNS = 297;
const MAN_OF_MATCH = 'Nathan Ellis';
const SIDE_BET_ID = 'dcaf6722-ef0f-4d99-925e-d42fa7e8c98d';
const SIDE_BET_ANSWER = '2'; // 2 wickets in first innings powerplay

// Fielding notes:
//   IRE fielding (from AUS batting):
//     Travis Head: run out (Benjamin Calitz/Mark Adair) → Calitz: run out
//     Josh Inglis: c Paul Stirling b George Dockrell → Stirling: catch
//     Cameron Green: c George Dockrell b Mark Adair → Dockrell: catch
//     Matt Renshaw: b Matthew Humphreys → bowled, no fielding
//     Glenn Maxwell: c Lorcan Tucker b Harry Tector → Tucker: catch
//     Marcus Stoinis: c Benjamin Calitz b Mark Adair → Calitz: catch
//
//   AUS fielding (from IRE batting):
//     Paul Stirling: retd out → no fielding credit
//     Ross Adair: b Nathan Ellis → bowled, no fielding
//     Harry Tector: c Cameron Green b Matthew Kuhnemann → Green: catch
//     Lorcan Tucker: c Cooper Connolly b Adam Zampa → Connolly: catch
//     Curtis Campher: c Cameron Green b Nathan Ellis → Green: catch (2)
//     Benjamin Calitz: b Nathan Ellis → bowled, no fielding
//     Gareth Delany: c Josh Inglis b Adam Zampa → Inglis: catch
//     George Dockrell: st Josh Inglis b Adam Zampa → Inglis: stumping
//     Mark Adair: c Cooper Connolly b Adam Zampa → Connolly: catch (2)
//     Barry McCarthy: c Cameron Green b Nathan Ellis → Green: catch (3)
//     Matthew Humphreys: not out

const playerStats = [
  // === AUS BATTING + BOWLING ===
  { pid: '1c75176d-3750-4628-adf5-6f6065d6fb93', name: 'Travis Head',          runs: 6,  balls: 7,  fours: 1, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '2abe4511-befd-4497-94e7-6a680d69e703', name: 'Josh Inglis',          runs: 37, balls: 17, fours: 6, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 1, runOuts: 0 },
  { pid: '8421a5d0-91c1-4e4b-b966-f4266322b9a0', name: 'Cameron Green',        runs: 21, balls: 11, fours: 1, sixes: 2, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 3, stumpings: 0, runOuts: 0 },
  { pid: '604dc74c-bc4f-4abe-ba43-cfb7f64acd95', name: 'Matthew Renshaw',      runs: 37, balls: 33, fours: 2, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'f7851482-92db-4f06-a8e1-fcefe7517752', name: 'Glenn Maxwell',        runs: 9,  balls: 9,  fours: 1, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'fc46c6f8-8459-4634-8ce5-896688ae3d73', name: 'Marcus Stoinis',       runs: 45, balls: 29, fours: 2, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '7ac81336-1e8d-4669-916a-bdd64f4efd48', name: 'Cooper Connolly',      runs: 11, balls: 8,  fours: 0, sixes: 1, overs: 3,   runsConceded: 26, econ: 8.70,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
  { pid: '357ccbb4-e2e5-4780-8159-496b8ef108fa', name: 'Xavier Bartlett',       runs: 11, balls: 6,  fours: 2, sixes: 0, overs: 2,   runsConceded: 22, econ: 11.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '5023ac85-6b6d-4013-b6c4-4607ce9b2a39', name: 'Nathan Ellis',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 12, econ: 3.10,  wickets: 4, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
  { pid: '587f0701-b024-4de4-91a4-31f352a14d20', name: 'Matthew Kuhnemann',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 29, econ: 7.20,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '147047d1-0717-471e-9329-0b916344d0ce', name: 'Adam Zampa',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 23, econ: 5.80,  wickets: 4, catches: 0, stumpings: 0, runOuts: 0 },

  // === IRE BATTING + BOWLING ===
  { pid: 'c156e2ee-7512-40ec-85ba-8436dc459415', name: 'Paul Stirling',        runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '750c8110-aa24-402e-88b2-157406649648', name: 'Ross Adair',           runs: 12, balls: 9,  fours: 1, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '42ddc126-cec3-42c4-b0ef-7275545c922e', name: 'Harry Tector',         runs: 0,  balls: 3,  fours: 0, sixes: 0, overs: 3,   runsConceded: 24, econ: 8.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '2c568b69-07d0-43d6-9e36-c6e5d88faba8', name: 'Lorcan Tucker',        runs: 24, balls: 27, fours: 1, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '89bf4c1c-3329-4eeb-b98c-7f48d95db19e', name: 'Curtis Campher',       runs: 4,  balls: 2,  fours: 1, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '82a40282-9ee9-4bc8-bf9b-8fd80a54bba4', name: 'Ben Calitz',           runs: 2,  balls: 4,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 1 },
  { pid: '7300af5b-c76f-4ffa-8986-98577a9a26ff', name: 'Gareth Delany',        runs: 11, balls: 12, fours: 1, sixes: 1, overs: 2,   runsConceded: 12, econ: 6.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '1cb5969d-68be-4f59-95f2-26ad801df67b', name: 'George Dockrell',      runs: 41, balls: 29, fours: 3, sixes: 2, overs: 4,   runsConceded: 31, econ: 7.80,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '20ed4e7e-cb02-403f-a527-a023203a2a30', name: 'Mark Adair',           runs: 12, balls: 6,  fours: 2, sixes: 0, overs: 4,   runsConceded: 44, econ: 11.00, wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'd1b132b7-9e6c-4e1d-8a7b-9b5c172f6fcd', name: 'Barry McCarthy',      runs: 2,  balls: 4,  fours: 0, sixes: 0, overs: 3,   runsConceded: 37, econ: 12.30, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'eb4db2f8-c161-4ed3-aee8-a7bc05a83042', name: 'Matthew Humphreys',    runs: 3,  balls: 4,  fours: 0, sixes: 0, overs: 4,   runsConceded: 33, econ: 8.20,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
];

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

(async () => {
  console.log('=== SCORING wc_m14: AUS vs IRE ===\n');

  console.log('PRE-SCORING CHECKLIST:');
  const checks = { winner: !!WINNER, totalRuns: !!TOTAL_RUNS, manOfMatch: !!MAN_OF_MATCH, sideBetAnswer: !!SIDE_BET_ANSWER, playerStats: playerStats.length > 0 };
  Object.entries(checks).forEach(([k, v]) => console.log('  ' + (v ? 'OK' : 'MISSING') + ' ' + k));
  if (!Object.values(checks).every(Boolean)) { console.error('\nABORTING!'); process.exit(1); }
  console.log('  All checks passed.\n');

  // Fantasy points
  console.log('=== FANTASY POINTS ===');
  console.log('Player'.padEnd(24) + '| Runs | Wkts | Fld | SR     | Econ  | Fantasy');
  console.log('-'.repeat(85));

  const statsToInsert = [];
  for (const p of playerStats) {
    const fp = calcFantasyPoints(p);
    const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '—';
    const fld = (p.catches||0) + (p.runOuts||0) + (p.stumpings||0);
    console.log(
      p.name.padEnd(24) + '| ' +
      String(p.runs).padStart(4) + ' | ' + String(p.wickets).padStart(4) + ' | ' +
      String(fld).padStart(3) + ' | ' + String(sr).padStart(6) + ' | ' +
      String(p.econ !== null ? p.econ.toFixed(2) : '—').padStart(5) + ' | ' +
      String(fp).padStart(7) + (p.isMoM ? ' [MoM]' : '')
    );
    statsToInsert.push({
      match_id: MATCH_ID, player_id: p.pid,
      runs: p.runs, balls_faced: p.balls, fours: p.fours, sixes: p.sixes,
      strike_rate: p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(2)) : 0,
      overs_bowled: p.overs >= 1 ? p.overs : 0,
      runs_conceded: p.runsConceded || 0,
      wickets: p.wickets, economy_rate: p.econ || 0,
      catches: p.catches, stumpings: p.stumpings, run_outs: p.runOuts,
      has_century: p.runs >= 100, has_five_wicket_haul: p.wickets >= 5, has_hat_trick: false,
      is_man_of_match: !!p.isMoM, total_fantasy_points: fp,
    });
  }

  // Step 1: Lock
  console.log('\n=== STEP 1: LOCK ===');
  await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', MATCH_ID);
  console.log('OK');

  // Step 2: Player stats
  console.log('\n=== STEP 2: PLAYER STATS ===');
  await sb.from('player_match_stats').delete().eq('match_id', MATCH_ID);
  const { error: statsErr } = await sb.from('player_match_stats').insert(statsToInsert);
  if (statsErr) {
    console.error('Batch failed:', statsErr.message);
    for (const s of statsToInsert) {
      const { error } = await sb.from('player_match_stats').insert(s);
      if (error) console.error('  FAIL ' + s.player_id.slice(0,8) + ': ' + error.message);
      else console.log('  OK ' + s.player_id.slice(0,8));
    }
  } else {
    console.log('Inserted ' + statsToInsert.length + ' rows');
  }

  // Step 3: Results
  console.log('\n=== STEP 3: RESULTS ===');
  const { error: resErr } = await sb.from('match_results').upsert({
    match_id: MATCH_ID, winner: WINNER, total_runs: TOTAL_RUNS, man_of_match: MAN_OF_MATCH,
    side_bet_answers: { [SIDE_BET_ID]: SIDE_BET_ANSWER }, completed_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  console.log(resErr ? 'ERROR: ' + resErr.message : 'OK');

  // Step 4: Correct answers
  console.log('\n=== STEP 4: CORRECT ANSWERS ===');
  await sb.from('match_questions').update({ correct_answer: WINNER }).eq('match_id', MATCH_ID).eq('kind', 'WINNER');
  await sb.from('match_questions').update({ correct_answer: String(TOTAL_RUNS) }).eq('match_id', MATCH_ID).eq('kind', 'TOTAL_RUNS');
  await sb.from('side_bets').update({ correct_answer: SIDE_BET_ANSWER }).eq('side_bet_id', SIDE_BET_ID);
  console.log('OK');

  // Step 5: Lock bets
  console.log('\n=== STEP 5: LOCK BETS ===');
  const { data: locked } = await sb.from('bets').update({ is_locked: true }).eq('match_id', MATCH_ID).select('bet_id');
  console.log('Locked ' + (locked?.length || 0) + ' bets');

  // Step 6: Player FP
  console.log('\n=== STEP 6: PLAYER FP ===');
  const { error: fpErr } = await sb.rpc('calculate_all_player_points', { p_match_id: MATCH_ID });
  console.log(fpErr ? 'ERROR: ' + fpErr.message : 'OK');

  // Step 7: Score
  console.log('\n=== STEP 7: SCORE ===');
  const { data: sr, error: sErr } = await sb.rpc('calculate_match_scores', { p_match_id: MATCH_ID, p_event_id: 't20wc_2026' });
  console.log(sErr ? 'ERROR: ' + sErr.message : JSON.stringify(sr));

  // Step 8: Set SCORED
  await sb.from('match_config').update({ status: 'SCORED' }).eq('match_id', MATCH_ID);

  // Fix leaderboard
  console.log('\n=== FIXING LEADERBOARD ===');
  const { data: allBets } = await sb.from('bets').select('user_id, match_id, score');
  const users = {};
  for (const b of allBets) {
    if (!users[b.user_id]) users[b.user_id] = { total: 0, matches: 0, lastScore: 0 };
    if (b.score !== null && b.score !== undefined) {
      users[b.user_id].total += b.score;
      users[b.user_id].matches++;
      users[b.user_id].lastScore = b.score;
    }
  }
  for (const [uid, data] of Object.entries(users)) {
    await sb.from('leaderboard').update({
      total_score: data.total, matches_played: data.matches, last_match_score: data.lastScore,
    }).eq('user_id', uid).eq('event_id', 't20wc_2026');
  }

  // Results
  console.log('\n=== FINAL SCORES FOR WC_M14 ===');
  const { data: bets } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', MATCH_ID).order('score', { ascending: false });
  const uids = bets.map(b => b.user_id);
  const { data: lbu } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', uids);
  const nm = {};
  (lbu || []).forEach(u => { nm[u.user_id] = u.display_name; });
  console.log('User'.padEnd(22) + '| Score  | Winner | Runs  | Players | Side');
  console.log('-'.repeat(70));
  bets.forEach(b => {
    console.log(
      (nm[b.user_id] || b.user_id.slice(0,8)).padEnd(21) + ' | ' +
      String(b.score||0).padStart(6) + ' | ' + String(b.winner_points||0).padStart(6) + ' | ' +
      String(b.total_runs_points||0).padStart(5) + ' | ' + String(b.player_pick_points||0).padStart(7) + ' | ' +
      String(b.side_bet_points||0).padStart(5)
    );
  });

  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .eq('event_id', 't20wc_2026').order('total_score', { ascending: false });
  console.log('\n=== LEADERBOARD (14 matches scored) ===');
  let rank = 1;
  for (const l of lb) {
    console.log(rank++ + '. ' + l.display_name.padEnd(22) + ' | ' + l.total_score + ' pts | ' + l.matches_played + ' matches');
  }
  console.log('\nDone!');
})();
