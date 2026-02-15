/**
 * Score wc_m23 (ENG vs SCO) — Feb 14, 2026
 *
 * SCO 152/10 (19.4 ov), ENG 155/5 (18.2 ov) — ENG won by 5 wickets
 * Total runs: 307, MoM: Tom Banton (63* off 41)
 * Side bet: "Will DLS method be used?" → No
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function uuid() { return crypto.randomUUID(); }

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
  matchId: 'wc_m23',
  label: 'ENG vs SCO',
  winner: 'opt_wc_m23_winner_teamA', // ENG = teamA
  totalRuns: 307,
  manOfMatch: 'Tom Banton',
  sideBetId: '716988d9-e19a-4bf7-897a-ed28b5ffe4ad',
  sideBetAnswer: 'No', // DLS was NOT used
  players: [
    // === ENG BATTING (155/5, 18.2 ov) + BOWLING ===
    { pid: '97cbc25f-15c5-4537-99b3-423bb8b7b6b1', name: 'Phil Salt',          runs: 2,  balls: 3,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Brandon McMullen c Phil Salt b Jofra Archer
    { pid: '6aa256f8-1511-4e93-9654-16f35d9fa7d8', name: 'Jos Buttler',         runs: 3,  balls: 4,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // WK. Assisted in Brad Currie run out but Brook gets primary credit.
    { pid: '91ce209e-b369-416f-8e6c-045655f75f27', name: 'Jacob Bethell',       runs: 32, balls: 28, fours: 2, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Michael Jones c Jacob Bethell b Sam Curran
    { pid: '84013d6e-c435-4dea-89bf-c3f91713814c', name: 'Tom Banton',          runs: 63, balls: 41, fours: 4, sixes: 3, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0, isMoM: true },
    // Not out. Catches: George Munsey, Matthew Cross
    { pid: '60c6c274-f6a3-4019-ae5a-ed72f86e7efa', name: 'Harry Brook',         runs: 4,  balls: 4,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 1 },
    // Run out: Brad Currie run out (Harry Brook/Jos Buttler)
    { pid: 'b9da8da8-371b-4d30-b995-85734ac887f7', name: 'Sam Curran',          runs: 28, balls: 20, fours: 1, sixes: 2, overs: 3, runsConceded: 33, econ: 9.00,  wickets: 1, catches: 2, stumpings: 0, runOuts: 0 },
    // Bowling: Michael Jones c Bethell b Curran. Catches: Tom Bruce, Michael Leask
    { pid: '071361b3-eefa-4855-92ba-650b26dd8df1', name: 'Will Jacks',          runs: 16, balls: 10, fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Not out. Catches: Brad Wheal c Will Jacks b Jamie Overton
    { pid: '917383ba-d8e1-40d1-8928-c057539a9c32', name: 'Liam Dawson',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 34, econ: 8.50,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Tom Bruce, Michael Leask
    { pid: '072574d3-ed67-40d8-a1f8-04dc71aa5a74', name: 'Jamie Overton',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 23, econ: 5.80,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Brad Wheal c Jacks b Overton
    { pid: '95c67e6a-b939-46a1-a826-596f1b9f26b4', name: 'Jofra Archer',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 24, econ: 6.00,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Munsey, McMullen
    { pid: '1de08c59-d3be-4bad-a1dd-671c10b77dd0', name: 'Adil Rashid',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 36, econ: 9.00,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Berrington lbw, Cross, Watt b Rashid

    // === SCO BATTING (152/10, 19.4 ov) + BOWLING ===
    { pid: 'd15f7499-a8db-428d-a0f2-dddce2c5cffa', name: 'George Munsey',      runs: 4,  balls: 6,  fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'bc0a059f-402d-4e17-b6b6-f6346328d1be', name: 'Michael Jones',       runs: 33, balls: 20, fours: 5, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '45669a3b-227b-4bb5-b4ec-09e93eb3ac95', name: 'Brandon McMullen',    runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 3, runsConceded: 23, econ: 7.70,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Bowling: Phil Salt c Bruce b McMullen. Catches: Jos Buttler c McMullen b Currie
    { pid: 'c6ba4a3c-1340-4414-8599-1d40983b0ff6', name: 'Richie Berrington',   runs: 49, balls: 32, fours: 5, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '23345390-8af6-4ea8-be8b-fe213f0fa21a', name: 'Tom Bruce',           runs: 24, balls: 18, fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Philip Salt c Tom Bruce b Brandon McMullen
    { pid: 'ab15db73-9e8e-46db-9429-4e00425c4c86', name: 'Michael Leask',       runs: 1,  balls: 4,  fours: 0, sixes: 0, overs: 4, runsConceded: 33, econ: 8.20,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Harry Brook c Wheal b Leask
    { pid: 'c6f2d543-35ec-4aca-83b7-bafd31f0d1cf', name: 'Matthew Cross',       runs: 8,  balls: 9,  fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // WK. Catches: Sam Curran c Matthew Cross b Brad Wheal
    { pid: '5d4675ea-c537-4f40-857c-5467347138b7', name: 'Mark Watt',           runs: 2,  balls: 4,  fours: 0, sixes: 0, overs: 3, runsConceded: 43, econ: 14.30, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '8de2381c-dc7c-4dfd-835b-6106ac90d056', name: 'Oliver Davidson',     runs: 20, balls: 15, fours: 2, sixes: 1, overs: 2, runsConceded: 12, econ: 6.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Jacob Bethell c Wheal b Davidson
    { pid: '082c6067-1b2d-41d3-824e-e818a48cad3f', name: 'Brad Wheal',          runs: 2,  balls: 3,  fours: 0, sixes: 0, overs: 3, runsConceded: 23, econ: 6.90,  wickets: 1, catches: 2, stumpings: 0, runOuts: 0 },
    // Bowling: Sam Curran c Cross b Wheal. Catches: Bethell, Brook
    { pid: 'be1a7903-72cc-4cb4-b993-6588016beb28', name: 'Brad Currie',         runs: 2,  balls: 5,  fours: 0, sixes: 0, overs: 3, runsConceded: 21, econ: 7.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Jos Buttler c McMullen b Currie. Run out himself.
  ],
};

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

  console.log('\n--- BET SCORES ---');
  const { data: bets } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points')
    .eq('match_id', m.matchId)
    .order('score', { ascending: false });
  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name');
  const nameMap = {};
  for (const l of (lb || [])) nameMap[l.user_id] = l.display_name;

  console.log('User'.padEnd(22) + '| Score  | Winner | Runs  | Players | Side  ');
  console.log('-'.repeat(75));
  for (const b of (bets || [])) {
    const name = nameMap[b.user_id] || b.user_id.substring(0, 12);
    console.log(
      name.padEnd(22) + '| ' +
      String(b.score ?? 'null').padStart(6) + ' | ' +
      String(b.winner_points ?? 0).padStart(6) + ' | ' +
      String(b.total_runs_points ?? 0).padStart(5) + ' | ' +
      String(b.player_pick_points ?? 0).padStart(7) + ' | ' +
      String(b.side_bet_points ?? 0).padStart(5)
    );
  }

  console.log('\n========================================');
  console.log('LEADERBOARD AFTER ' + m.matchId.toUpperCase());
  console.log('========================================');
  const { data: lbFinal } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false })
    .limit(15);
  console.log('Name'.padEnd(22) + '| Score  | Matches');
  console.log('-'.repeat(45));
  for (const r of (lbFinal || [])) {
    console.log(
      (r.display_name || '???').padEnd(22) + '| ' +
      String(r.total_score).padStart(6) + ' | ' +
      String(r.matches_played).padStart(7)
    );
  }
}

(async () => {
  await scoreMatch(match);
})();
