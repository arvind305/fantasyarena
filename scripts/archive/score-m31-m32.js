/**
 * Score wc_m31 (NZ vs CAN) and handle wc_m32 (IRE vs ZIM — ABANDONED)
 *
 * wc_m31: CAN 173/4 (20 ov) vs NZ 176/2 (15.1 ov) — NZ won by 8 wickets. Total: 349. MoM: Glenn Phillips
 * wc_m32: IRE vs ZIM — Match abandoned due to rain. No result. All bets get 0 points.
 *
 * Wides: CAN bowled 11w, NZ bowled 3w = 14 total > 10 → Side bet "Yes"
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

// ============================================================
// wc_m31: NZ vs CAN — NZ won by 8 wickets
// Side bet: "Will the number of wides be >10 in this match?" → 14 wides → "Yes"
// ============================================================
const m31 = {
  matchId: 'wc_m31',
  label: 'NZ vs CAN',
  winner: 'opt_wc_m31_winner_teamA', // NZ = teamA
  totalRuns: 349,
  manOfMatch: 'Glenn Phillips',
  sideBetId: 'e9b912cd-1976-4348-81cf-bb9ab9260b89',
  sideBetAnswer: 'Yes',
  players: [
    // === CAN BATTING (173/4, 20 ov) ===
    // Yuvraj Samra: 110(65), 11x4, 6x6 — c Glenn Phillips b Jacob Duffy. CENTURY!
    { pid: '0c1bcebc-d5e9-400f-8719-d2f3ca56404d', name: 'Yuvraj Samra',         runs: 110, balls: 65, fours: 11, sixes: 6, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Dilpreet Bajwa (c): 36(39), 4x4, 0x6 — c Glenn Phillips b Kyle Jamieson
    { pid: 'dd4a9951-79a9-4eb6-b47e-8ff0e3f95670', name: 'Dilpreet Bajwa',       runs: 36, balls: 39, fours: 4, sixes: 0, overs: 2, runsConceded: 26, econ: 13.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Navneet Dhaliwal: 10(7), 0x4, 1x6 — c Glenn Phillips b Matt Henry
    { pid: '20c91435-f8b9-4e10-8dde-42f1969814db', name: 'Navneet Dhaliwal',     runs: 10, balls: 7,  fours: 0, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Nicholas Kirton: 2(3), 0x4, 0x6 — lbw b James Neesham
    { pid: 'c810146d-a88f-43f1-97e3-27b038be655b', name: 'Nicholas Kirton',      runs: 2,  balls: 3,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Harsh Thaker: 3*(3), 0x4, 0x6 — not out
    { pid: '944b660b-4f52-4d6d-9b8d-fa15cdcb4d32', name: 'Harsh Thaker',         runs: 3,  balls: 3,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Dilon Heyliger: 8*(3), 0x4, 1x6 — not out. Bowled 4-0-42-1 (Finn Allen c Shivam Sharma)
    { pid: 'be33276f-b261-4a36-8066-5874d239fbb2', name: 'Dilon Heyliger',       runs: 8,  balls: 3,  fours: 0, sixes: 1, overs: 4, runsConceded: 42, econ: 10.50, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB: Shreyas Movva (wk)
    { pid: 'bc7f39e8-a41d-40db-98c5-41f379e1fdf9', name: 'Shreyas Movva',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Saad Bin Zafar: DNB. Bowled 3-1-29-1 (Seifert c Jaskarandeep b Saad)
    { pid: '8af61d05-9a0b-4902-9a13-c97c3008095b', name: 'Saad Bin Zafar',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 29, econ: 9.67,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Shivam Sharma: DNB. Bowled 2-0-23-0. Catch: Allen c Shivam b Heyliger
    { pid: 'b4bc4e0a-88bf-4c02-b810-dc2e8151bbcc', name: 'Shivam Sharma',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2, runsConceded: 23, econ: 11.50, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Jaskarandeep Buttar: DNB. Bowled 2.1-0-31-0. Catch: Seifert c Jaskarandeep b Saad
    { pid: '5f6241d3-a7dc-4b3d-8864-864e14b14e8b', name: 'Jaskarandeep Buttar',  runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2, runsConceded: 31, econ: 14.30, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Ansh Patel: DNB. Bowled 2-0-24-0
    { pid: '6b546382-db71-4e42-a28c-32b6ab3b6a34', name: 'Ansh Patel',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2, runsConceded: 24, econ: 12.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

    // === NZ BATTING (176/2, 15.1 ov) + BOWLING ===
    // Tim Seifert (wk): 6(10), 1x4, 0x6 — c Jaskarandeep Singh b Saad Bin Zafar
    { pid: '72f200aa-8beb-42ef-b5dd-a6494478688e', name: 'Tim Seifert',          runs: 6,  balls: 10, fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Finn Allen: 21(8), 2x4, 1x6 — c Shivam Sharma b Dilon Heyliger
    { pid: '5bd74887-e3cf-4af2-88f6-7b5bbb18d9ea', name: 'Finn Allen',           runs: 21, balls: 8,  fours: 2, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Rachin Ravindra: 59*(39), 4x4, 3x6 — not out
    { pid: '2e9080d3-406d-41f2-aba4-9ca3b2feafd7', name: 'Rachin Ravindra',      runs: 59, balls: 39, fours: 4, sixes: 3, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Glenn Phillips: 76*(36), 4x4, 6x6 — not out. Bowled 1-0-6-0. Catches: Samra, Bajwa, Dhaliwal (3 catches). MoM
    { pid: 'f17e4c8a-fcda-4cc5-8e3c-8f1140d0f67a', name: 'Glenn Phillips',       runs: 76, balls: 36, fours: 4, sixes: 6, overs: 1, runsConceded: 6,  econ: 6.00,  wickets: 0, catches: 3, stumpings: 0, runOuts: 0, isMoM: true },
    // DNB: Mark Chapman
    // DNB: Daryl Mitchell (c). Not batting, not bowling
    // DNB: Cole McConchie. Bowled 3-0-34-0
    { pid: 'ddb6fa02-2be8-4895-b0ce-dbcd081b28b0', name: 'Cole McConchie',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 34, econ: 11.30, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB: James Neesham. Bowled 4-0-38-1 (Kirton lbw)
    { pid: 'b04df15b-f357-4e5b-9f16-e83c769509ea', name: 'James Neesham',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 38, econ: 9.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB: Kyle Jamieson. Bowled 4-0-41-1 (Bajwa c Phillips)
    { pid: '5bffa7f2-734a-4f1b-ba7c-331170a1d466', name: 'Kyle Jamieson',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 41, econ: 10.25, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB: Matt Henry. Bowled 4-0-28-1 (Dhaliwal c Phillips)
    { pid: '32ef7a8b-93e2-48c2-860f-438371569f19', name: 'Matt Henry',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 28, econ: 7.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB: Jacob Duffy. Bowled 4-0-25-1 (Samra c Phillips)
    { pid: '10fc22f1-20c4-46eb-9da6-90b48d842978', name: 'Jacob Duffy',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 25, econ: 6.25,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  ],
};

// ============================================================
// Scoring function (same as previous scripts)
// ============================================================
async function scoreMatch(m) {
  console.log('\n========================================');
  console.log('SCORING: ' + m.label + ' (' + m.matchId + ')');
  console.log('========================================');

  console.log('\nPlayer'.padEnd(28) + '| Runs | Wkts | Fld | Fantasy');
  console.log('-'.repeat(65));

  const statsToInsert = [];
  for (const p of m.players) {
    const fp = calcFantasyPoints(p);
    const fld = (p.catches || 0) + (p.runOuts || 0) + (p.stumpings || 0);
    console.log(
      p.name.padEnd(28) + '| ' +
      String(p.runs).padStart(4) + ' | ' + String(p.wickets).padStart(4) + ' | ' +
      String(fld).padStart(3) + ' | ' +
      String(fp).padStart(7) + (p.isMoM ? ' [MoM]' : '')
    );
    statsToInsert.push({
      match_id: m.matchId, player_id: p.pid,
      runs: p.runs, balls_faced: p.balls, fours: p.fours, sixes: p.sixes,
      strike_rate: p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(2)) : 0,
      overs_bowled: p.overs >= 1 ? Math.floor(p.overs) : 0,
      runs_conceded: p.runsConceded || 0,
      wickets: p.wickets, economy_rate: p.econ || 0,
      catches: p.catches || 0, stumpings: p.stumpings || 0, run_outs: p.runOuts || 0,
      has_century: p.runs >= 100, has_five_wicket_haul: p.wickets >= 5, has_hat_trick: false,
      is_man_of_match: !!p.isMoM, total_fantasy_points: fp,
    });
  }

  console.log('\nStep 1: Lock match...');
  await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', m.matchId);
  console.log('  OK');

  console.log('Step 2: Insert player stats...');
  await sb.from('player_match_stats').delete().eq('match_id', m.matchId);
  const { error: statsErr } = await sb.from('player_match_stats').insert(statsToInsert);
  if (statsErr) {
    console.log('  Batch insert failed: ' + statsErr.message + '. Inserting one by one...');
    let ok = 0, fail = 0;
    for (const s of statsToInsert) {
      const { error } = await sb.from('player_match_stats').insert(s);
      if (error) { console.log('    FAIL ' + s.player_id.slice(0, 8) + ': ' + error.message); fail++; }
      else ok++;
    }
    console.log('  Inserted ' + ok + ' / ' + statsToInsert.length + ' (' + fail + ' failed)');
  } else {
    console.log('  OK: ' + statsToInsert.length + ' rows');
  }

  console.log('Step 3: Upsert match results...');
  const { error: resErr } = await sb.from('match_results').upsert({
    match_id: m.matchId, winner: m.winner, total_runs: m.totalRuns, man_of_match: m.manOfMatch,
    side_bet_answers: {}, completed_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  console.log(resErr ? '  ERROR: ' + resErr.message : '  OK');

  console.log('Step 4: Set correct answers...');
  await sb.from('match_questions').update({ correct_answer: m.winner }).eq('match_id', m.matchId).eq('kind', 'WINNER');
  await sb.from('match_questions').update({ correct_answer: String(m.totalRuns) }).eq('match_id', m.matchId).eq('kind', 'TOTAL_RUNS');
  await sb.from('side_bets').update({ correct_answer: m.sideBetAnswer }).eq('side_bet_id', m.sideBetId);
  console.log('  OK');

  console.log('Step 5: Lock bets...');
  const { data: locked } = await sb.from('bets').update({ is_locked: true }).eq('match_id', m.matchId).select('bet_id');
  console.log('  Locked ' + (locked?.length || 0) + ' bets');

  console.log('Step 6: Score via RPC...');
  const { data: sr, error: sErr } = await sb.rpc('calculate_match_scores', { p_match_id: m.matchId, p_event_id: 't20wc_2026' });
  if (sErr) {
    console.log('  ERROR: ' + sErr.message);
  } else {
    console.log('  ' + JSON.stringify(sr));
  }

  console.log('Step 7: Set SCORED...');
  await sb.from('match_config').update({ status: 'SCORED' }).eq('match_id', m.matchId);
  console.log('  OK');

  console.log('Step 8: Reset stale last_match_score...');
  const { data: matchBets } = await sb.from('bets').select('user_id').eq('match_id', m.matchId);
  const bettorSet = new Set((matchBets || []).map(b => b.user_id));
  const { data: allLb } = await sb.from('leaderboard').select('user_id, display_name, last_match_score');
  let resetCount = 0;
  for (const r of (allLb || [])) {
    if (!bettorSet.has(r.user_id) && r.last_match_score !== 0) {
      await sb.from('leaderboard').update({ last_match_score: 0 }).eq('user_id', r.user_id);
      resetCount++;
    }
  }
  console.log('  Reset ' + resetCount + ' non-bettors to 0');

  console.log('\n--- BET SCORES ---');
  const { data: bets } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points')
    .eq('match_id', m.matchId)
    .order('score', { ascending: false });
  const { data: lbData } = await sb.from('leaderboard').select('user_id, display_name');
  const nameMap = {};
  for (const l of (lbData || [])) nameMap[l.user_id] = l.display_name;

  console.log('User'.padEnd(22) + '| Score  | Winner | Runs  | Players | Side  | Runner');
  console.log('-'.repeat(85));
  for (const b of (bets || [])) {
    const name = nameMap[b.user_id] || b.user_id.substring(0, 12);
    console.log(
      name.padEnd(22) + '| ' +
      String(b.score ?? 'null').padStart(6) + ' | ' +
      String(b.winner_points ?? 0).padStart(6) + ' | ' +
      String(b.total_runs_points ?? 0).padStart(5) + ' | ' +
      String(b.player_pick_points ?? 0).padStart(7) + ' | ' +
      String(b.side_bet_points ?? 0).padStart(5) + ' | ' +
      String(b.runner_points ?? 0).padStart(6)
    );
  }
}

// ============================================================
// Handle abandoned match wc_m32 (IRE vs ZIM)
// ============================================================
async function handleAbandoned() {
  console.log('\n========================================');
  console.log('ABANDONED: IRE vs ZIM (wc_m32)');
  console.log('========================================');

  console.log('\nStep 1: Lock match...');
  await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', 'wc_m32');
  console.log('  OK');

  console.log('Step 2: Lock all bets and set scores to 0...');
  const { data: bets } = await sb.from('bets')
    .update({
      is_locked: true,
      score: 0,
      winner_points: 0,
      total_runs_points: 0,
      player_pick_points: 0,
      side_bet_points: 0,
      runner_points: 0,
    })
    .eq('match_id', 'wc_m32')
    .select('bet_id, user_id');
  console.log('  Set ' + (bets?.length || 0) + ' bets to score=0');

  console.log('Step 3: Insert abandoned match result...');
  const { error: resErr } = await sb.from('match_results').upsert({
    match_id: 'wc_m32',
    winner: null,
    total_runs: 0,
    man_of_match: null,
    side_bet_answers: {},
    completed_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  console.log(resErr ? '  ERROR: ' + resErr.message : '  OK');

  console.log('Step 4: Set SCORED...');
  await sb.from('match_config').update({ status: 'SCORED' }).eq('match_id', 'wc_m32');
  console.log('  OK');

  // Recalculate leaderboard totals to be safe (idempotent)
  console.log('Step 5: Recalculate leaderboard from SUM(bets.score)...');
  const bettorIds = new Set((bets || []).map(b => b.user_id));
  for (const uid of bettorIds) {
    const { data: allBets } = await sb.from('bets').select('score').eq('user_id', uid);
    const total = (allBets || []).reduce((sum, b) => sum + (b.score || 0), 0);
    const matchesPlayed = (allBets || []).filter(b => b.score !== null && b.score !== undefined).length;
    await sb.from('leaderboard').update({ total_score: total, matches_played: matchesPlayed, last_match_score: 0 }).eq('user_id', uid);
    const { data: lbInfo } = await sb.from('leaderboard').select('display_name').eq('user_id', uid).single();
    console.log('  ' + (lbInfo?.display_name || uid.slice(0,8)) + ': total=' + total + ' matches=' + matchesPlayed);
  }
  console.log('  OK — abandoned match scored as 0 for all bettors');
}

// ============================================================
async function showLeaderboard() {
  console.log('\n========================================');
  console.log('FINAL LEADERBOARD');
  console.log('========================================');
  const { data: lbFinal } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played, rank')
    .order('total_score', { ascending: false })
    .limit(15);
  console.log('Rank | Name'.padEnd(26) + '| Score  | Matches');
  console.log('-'.repeat(50));
  for (const r of (lbFinal || [])) {
    console.log(
      String(r.rank || '-').padStart(4) + ' | ' +
      (r.display_name || '???').padEnd(20) + '| ' +
      String(r.total_score).padStart(6) + ' | ' +
      String(r.matches_played).padStart(7)
    );
  }
}

(async () => {
  await scoreMatch(m31);
  await handleAbandoned();
  await showLeaderboard();
})();
