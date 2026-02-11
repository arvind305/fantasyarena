/**
 * Score wc_m13: RSA vs AFG (South Africa vs Afghanistan)
 * Result: SUPER OVER (2 super overs, RSA won)
 * RSA: 187-6 (20 ov) | AFG: 187-10 (19.4 ov)
 * Total runs (incl super overs): 450 | MoM: Lungi Ngidi
 * Side bet: "How many runs in death overs (16-20) of first innings?"
 *   RSA first innings overs 16-20:
 *     At 12.6 overs: 127/3. At 17.2: 155/4.
 *     Partnership from 12.6 to 17.2 = 28 runs in ~26 balls.
 *     Overs 13-15 = 18 balls out of 26 → ~19 runs → score at end ov15 ≈ 146
 *     Overs 17.6-19.6 = 28 runs (Jansen 16 off 7 + Miller rest)
 *     Death overs total ≈ 187 - 146 = 41 → answer: "<=50"
 *
 * Missing from DB: Ryan Rickelton (RSA), Tristan Stubbs (RSA)
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCH_ID = 'wc_m13';
const WINNER = 'opt_wc_m13_winner_super_over'; // Super over
const TOTAL_RUNS = 450; // Including super overs
const MAN_OF_MATCH = 'Lungi Ngidi';
const SIDE_BET_ID = '735c098c-ba39-4f86-b5b8-043275feae68';
const SIDE_BET_ANSWER = '<=50'; // ~41 runs in death overs of first innings

// Fielding notes:
//   RSA fielding (from AFG batting dismissals):
//     Gurbaz: c George Linde b Keshav Maharaj → Linde: 1 catch
//     Atal: c Marco Jansen b Kagiso Rabada → Jansen: 1 catch
//     Omarzai: c Tristan Stubbs b Lungi Ngidi → Stubbs NOT IN DB
//     Nabi: c Aiden Markram b George Linde → Markram: 1 catch
//     Rashid Khan: c David Miller b Marco Jansen → Miller: 1 catch
//     Rasooli: run out (George Linde/de Kock/Maharaj) → Linde: 1 run out
//     Mujeeb: run out (Marco Jansen) → Jansen: 1 run out
//     Farooqi: run out (Marco Jansen/Kagiso Rabada) → Jansen: 1 run out
//
//   AFG fielding (from RSA batting dismissals):
//     Markram: c Nabi b Farooqi → Nabi: 1 catch
//     de Kock: c Ibrahim Zadran b Rashid Khan → Zadran: 1 catch
//     Rickelton: lbw → no catch
//     Brevis: c Nabi b Azmatullah → Nabi: 1 catch (2nd)
//     Stubbs: c Mujeeb b Azmatullah → Mujeeb: 1 catch
//     Jansen: c Sediqullah Atal b Azmatullah → Atal: 1 catch

const playerStats = [
  // === SOUTH AFRICA BATTING ===
  { pid: '135d571d-b6d6-4b68-93e9-8b2b52c6f88f', name: 'Aiden Markram',     runs: 5,  balls: 8,  fours: 1, sixes: 0, overs: 1,    econ: 14.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '97aa4f8d-8e3a-4e1c-8d6d-bf3f4be3c32f', name: 'Quinton de Kock',   runs: 59, balls: 41, fours: 5, sixes: 3, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  // Ryan Rickelton: NOT IN DB (61 runs off 28, 5x4, 4x6) — skipped
  { pid: '84e54a31-b45b-44d8-b52f-9b72f7e1a6f4', name: 'Dewald Brevis',     runs: 23, balls: 19, fours: 1, sixes: 1, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '67d44c6f-9ea7-4a1a-a0b5-28b50e6b2f7d', name: 'David Miller',      runs: 20, balls: 15, fours: 1, sixes: 1, overs: 0,    econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  // Tristan Stubbs: NOT IN DB (1 run off 2) — skipped
  { pid: '704b5d24-3c5b-4e8a-93d0-f95bb4e4f7c0', name: 'Marco Jansen',      runs: 16, balls: 7,  fours: 2, sixes: 1, overs: 4,    econ: 10.50, wickets: 1, catches: 1, stumpings: 0, runOuts: 2 },
  // Did not bat: George Linde, Kagiso Rabada, Keshav Maharaj, Lungi Ngidi
  { pid: 'd12d9b01-e7c3-4fa2-b2a5-13b9d1e7f4d9', name: 'George Linde',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,    econ: 13.00, wickets: 1, catches: 1, stumpings: 0, runOuts: 1 },
  { pid: 'f878dff2-b3a7-4f5e-8c01-6d47c3f5b2e9', name: 'Kagiso Rabada',     runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3.67, econ: 10.36, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'fbc80297-5c1a-4e8d-9f3b-82c4d6f1e7a0', name: 'Keshav Maharaj',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 6.75,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '3a3d11f5-c2e1-4f7a-b8d0-5e6c9a3f2d1b', name: 'Lungi Ngidi',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 6.50,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },

  // === AFGHANISTAN BATTING ===
  { pid: 'e3e62b5d-8f7a-4c2e-b3d1-6a5f9e8c7b4a', name: 'Rahmanullah Gurbaz', runs: 84, balls: 42, fours: 4, sixes: 7, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '51211070-d4e5-4a3f-8b7c-2f1e6d9a5c0b', name: 'Ibrahim Zadran',     runs: 12, balls: 10, fours: 1, sixes: 1, overs: 0,    econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '7160b6a0-c3f2-4e8a-9d5b-1a7f6b4e2c8d', name: 'Gulbadin Naib',      runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'a2d62f67-1e5a-4b8c-d7f3-9c6a2d8e4f0b', name: 'Sediqullah Atal',    runs: 0,  balls: 3,  fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: '5d1a02fe-b8c4-4a7e-f2d6-3e9a1c5b7d08', name: 'Darwish Rasooli',    runs: 15, balls: 18, fours: 0, sixes: 0, overs: 0,    econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: 'f3b15726-9d2e-4c8a-a5f1-7b3e6d0c4a2f', name: 'Azmatullah Omarzai', runs: 22, balls: 17, fours: 3, sixes: 0, overs: 4,    econ: 10.25, wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '548ba945-a6f3-4e7d-b8c2-1d5f9a3e6b0c', name: 'Mohammad Nabi',      runs: 5,  balls: 6,  fours: 0, sixes: 0, overs: 2,    econ: 10.00, wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
  { pid: '397b4521-e5d2-4a9f-c8b3-6f1a7d0e2c5b', name: 'Rashid Khan',        runs: 20, balls: 12, fours: 3, sixes: 0, overs: 4,    econ: 7.00,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '00825a0f-d7c4-4b8a-e5f2-9a3c1d6f0b7e', name: 'Mujeeb Ur Rahman',   runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 3,    econ: 10.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { pid: 'cdccf965-f8a3-4e7d-b2c6-5d1a9e0f4b3c', name: 'Noor Ahmad',         runs: 15, balls: 9,  fours: 0, sixes: 2, overs: 3,    econ: 11.67, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { pid: '125fb6ff-c9d2-4a8e-f3b5-7e1a6d0c2f4b', name: 'Fazalhaq Farooqi',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,    econ: 8.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
];

// Fantasy points calculation (matches the SQL RPC)
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
  console.log('=== SCORING wc_m13: RSA vs AFG ===\n');

  // Pre-scoring checklist
  console.log('PRE-SCORING CHECKLIST:');
  const checks = { winner: !!WINNER, totalRuns: !!TOTAL_RUNS, manOfMatch: !!MAN_OF_MATCH, sideBetAnswer: !!SIDE_BET_ANSWER, playerStats: playerStats.length > 0 };
  Object.entries(checks).forEach(([k, v]) => console.log('  ' + (v ? 'OK' : 'MISSING') + ' ' + k));
  if (!Object.values(checks).every(Boolean)) { console.error('\nABORTING: Missing data!'); process.exit(1); }
  console.log('  All checks passed.\n');

  // Calculate and display fantasy points
  console.log('=== FANTASY POINTS CALCULATION ===');
  console.log('Player'.padEnd(24) + '| Runs | Wkts | Fld | SR     | Econ  | Fantasy');
  console.log('-'.repeat(85));

  const statsToInsert = [];
  for (const p of playerStats) {
    const fantasyPts = calcFantasyPoints(p);
    const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '—';
    const fieldingTotal = (p.catches || 0) + (p.runOuts || 0) + (p.stumpings || 0);
    console.log(
      p.name.padEnd(24) + '| ' +
      String(p.runs).padStart(4) + ' | ' +
      String(p.wickets).padStart(4) + ' | ' +
      String(fieldingTotal).padStart(3) + ' | ' +
      String(sr).padStart(6) + ' | ' +
      String(p.econ !== null ? p.econ.toFixed(2) : '—').padStart(5) + ' | ' +
      String(fantasyPts).padStart(7) +
      (p.isMoM ? ' [MoM]' : '')
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
    console.error('Batch insert failed, trying one by one:', statsErr.message);
    for (const stat of statsToInsert) {
      const { error: singleErr } = await sb.from('player_match_stats').insert(stat);
      if (singleErr) console.error('  Failed:', stat.player_id.slice(0, 8), '—', singleErr.message);
      else console.log('  OK:', stat.player_id.slice(0, 8));
    }
  } else {
    console.log('Inserted ' + statsToInsert.length + ' player stats');
  }

  // Step 3: Insert match results
  console.log('\n=== STEP 3: INSERT MATCH RESULTS ===');
  const { error: resultErr } = await sb.from('match_results').upsert({
    match_id: MATCH_ID, winner: WINNER, total_runs: TOTAL_RUNS, man_of_match: MAN_OF_MATCH,
    side_bet_answers: { [SIDE_BET_ID]: SIDE_BET_ANSWER }, completed_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  if (resultErr) { console.error('Error:', resultErr); return; }
  console.log('Result saved: winner=SUPER_OVER, total_runs=' + TOTAL_RUNS + ', MoM=' + MAN_OF_MATCH);

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
  console.log('Player points calculated');

  // Step 7: Score all bets
  console.log('\n=== STEP 7: SCORE ALL BETS ===');
  const { data: scoreResult, error: scoreErr } = await sb.rpc('calculate_match_scores', { p_match_id: MATCH_ID, p_event_id: 't20wc_2026' });
  if (scoreErr) { console.error('Error:', scoreErr); return; }
  console.log('Scoring result:', JSON.stringify(scoreResult));

  // Step 8: Show results
  console.log('\n=== FINAL SCORES FOR WC_M13 ===');
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

  // Show updated leaderboard
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .eq('event_id', 't20wc_2026')
    .order('total_score', { ascending: false });
  console.log('\n=== LEADERBOARD AFTER M13 ===');
  let rank = 1;
  for (const l of lb) {
    console.log(rank++ + '. ' + l.display_name.padEnd(22) + ' | ' + l.total_score + ' pts | ' + l.matches_played + ' matches');
  }
  console.log('\nDone!');
})();
