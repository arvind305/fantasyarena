/**
 * Score wc_m12: PAK vs USA
 * PAK: 190-9 (20 ov) | USA: 158-8 (20 ov) → PAK won by 32 runs
 * Total runs: 348 | MoM: Sahibzada Farhan
 * Side bet: "How many runs in powerplay of second innings?" → 50 runs → "31-50"
 * Missing: Ehsan Adil (USA bowler, 3ov 39runs 0wkt) — not in USA squad DB
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCH_ID = 'wc_m12';
const WINNER = 'opt_wc_m12_winner_teamA'; // PAK = teamA
const TOTAL_RUNS = 348;
const MAN_OF_MATCH = 'Sahibzada Farhan';
const SIDE_BET_ID = 'bb853e1f-9bb9-437e-9df6-bf45b4be3bbb';
const SIDE_BET_ANSWER = '31-50'; // 50 runs in USA powerplay

// Fielding:
//   USA fielding (from PAK batting):
//     Saim Ayub: c Netravalkar b van Schalkwyk → Netravalkar: catch
//     Farhan: c Krishnamurthi b Harmeet → Krishnamurthi: catch
//     Salman Agha: c Jahangir b van Schalkwyk → Jahangir: catch
//     Babar: c Milind b Mohsin → Milind: catch
//     Nawaz: c Jahangir b Netravalkar → Jahangir: catch (2nd)
//     Shadab: c Gous b van Schalkwyk → Gous: catch
//     Faheem: c Netravalkar b van Schalkwyk → Netravalkar: catch (2nd)
//     Usman Khan: run out (Gous/Netravalkar) → Gous: run out
//     Abrar: run out (Jahangir/Gous) → Jahangir: run out
//
//   PAK fielding (from USA batting):
//     Gous: c Salman Agha b Nawaz → Salman: catch
//     Jahangir: c Shaheen b Shadab → Shaheen: catch
//     Monank: c and b Shadab → Shadab: catch
//     Milind: c Shaheen b Usman Tariq → Shaheen: catch (2nd)
//     Ranjane: lbw → no catch
//     Krishnamurthi: b Abrar → no catch (bowled)
//     Harmeet: c Nawaz b Usman Tariq → Nawaz: catch
//     Mohsin: b Usman Tariq → no catch (bowled)

const playerStats = [
  // === PAK BATTING + BOWLING ===
  { pid: '8897ac95-3160-43a2-afdf-a98ed645ab03', name: 'Saim Ayub',            runs: 19, balls: 17, fours: 1, sixes: 2, overs: 1,    econ: 11.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'b1cc6fb0-1f33-4519-a994-6a3542c3b12c', name: 'Sahibzada Farhan',     runs: 73, balls: 41, fours: 6, sixes: 5, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
  { pid: '0d3eb97f-8707-4bb1-9a18-a1f53387a001', name: 'Salman Ali Agha',      runs: 1,  balls: 3,  fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '7f063f49-853f-46ae-8501-7bf6f9df28d4', name: 'Babar Azam',           runs: 46, balls: 32, fours: 4, sixes: 1, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '82c98d2e-b2e0-42fc-a540-73d9f4f38fdd', name: 'Mohammad Nawaz',       runs: 5,  balls: 10, fours: 0, sixes: 0, overs: 3,    econ: 7.00,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '09c1111b-7110-4cfa-b2a7-3d6482926464', name: 'Shadab Khan',          runs: 30, balls: 12, fours: 4, sixes: 1, overs: 4,    econ: 6.50,  wickets: 2, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '6dbc36c4-c86d-46b6-b8a0-f2cd00abe82a', name: 'Faheem Ashraf',        runs: 1,  balls: 2,  fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '39c3f6ca-c36c-4a93-a9e7-95bf4d178fc6', name: 'Usman Khan',           runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'e97d7d7e-6c3f-4581-82c7-16629b6c5a8b', name: 'Shaheen Shah Afridi',  runs: 9,  balls: 4,  fours: 0, sixes: 1, overs: 4,    econ: 10.50, wickets: 1, catches: 2, stumpings: 0, runOuts: 0 },
  { pid: '307c272d-b959-467a-871b-2132d93f3e89', name: 'Abrar Ahmed',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 7.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '338a9168-acbf-405a-be68-662193b36ea7', name: 'Usman Tariq',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 6.75,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },

  // === USA BATTING + BOWLING ===
  { pid: '8ac010e3-6468-4354-bda0-2cdefeb11f03', name: 'Andries Gous',          runs: 13, balls: 13, fours: 2, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 1 },
  { pid: '4daa2c48-24be-41c4-bd2c-6567b8bdb402', name: 'Shayan Jahangir',       runs: 49, balls: 34, fours: 5, sixes: 2, overs: 0,    econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 1 },
  { pid: '4017255a-af7b-464c-8974-c93006d16b47', name: 'Monank Patel',          runs: 3,  balls: 10, fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '4f336965-73e3-471f-aaf8-94ddc2542916', name: 'Milind Kumar',          runs: 29, balls: 22, fours: 2, sixes: 1, overs: 1,    econ: 16.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '79b335df-dcb6-4fc6-a980-7ebbb6ccff2e', name: 'Shubham Ranjane',       runs: 51, balls: 30, fours: 3, sixes: 3, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'b4517739-0ef6-4786-b2be-7f9ab3bfaa9a', name: 'Sanjay Krishnamurthi',  runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '3e392ac3-de68-42a0-9825-5e6e3f132364', name: 'Harmeet Singh',         runs: 6,  balls: 5,  fours: 1, sixes: 0, overs: 4,    econ: 10.25, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'fadd96cf-fa81-4b73-819f-b0164e9dca4e', name: 'Mohammad Mohsin',       runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 4,    econ: 6.75,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '21fb1036-850b-420f-a0ee-09974da87869', name: 'Shadley van Schalkwyk', runs: 1,  balls: 2,  fours: 0, sixes: 0, overs: 4,    econ: 6.25,  wickets: 4, catches: 0, stumpings: 0, runOuts: 0 },
  // Ehsan Adil: NOT IN USA SQUAD DB — bowled 3ov, 39runs, 0wkt, econ 13.00, batted 1(2). Skipped.
  { pid: 'bca5c113-6714-40d6-b0ae-1e3922226c2b', name: 'Saurabh Netravalkar',  runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 10.00, wickets: 1, catches: 2, stumpings: 0, runOuts: 0 },
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
  console.log('=== SCORING wc_m12: PAK vs USA ===\n');

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
      runs_conceded: p.econ !== null && p.overs > 0 ? Math.round(p.econ * p.overs) : 0,
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
  console.log('\n=== FINAL SCORES FOR WC_M12 ===');
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
  console.log('\n=== LEADERBOARD (13 matches scored) ===');
  let rank = 1;
  for (const l of lb) {
    console.log(rank++ + '. ' + l.display_name.padEnd(22) + ' | ' + l.total_score + ' pts | ' + l.matches_played + ' matches');
  }
  console.log('\nDone!');
})();
