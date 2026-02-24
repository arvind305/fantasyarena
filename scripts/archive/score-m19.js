/**
 * Score wc_m19: AUS vs ZIM (Feb 13, 2026)
 * ZIM 169/2 (20 ov) beat AUS 146/10 (19.3 ov) by 23 runs
 * Winner: ZIM, Total runs: 315, MoM: Blessing Muzarabani
 * Side bet: "Will the match go to the last over (20th over of 2nd innings)?" → No (AUS all out 19.3)
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function uuid() { return crypto.randomUUID(); }

// Fantasy points formula (same as all previous scoring scripts)
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

const MATCH_ID = 'wc_m19';
const SIDE_BET_ID = 'c197816a-752f-444b-9153-57485e8f319f';

const matchData = {
  matchId: MATCH_ID,
  label: 'AUS vs ZIM',
  winner: 'opt_wc_m19_winner_teamB', // ZIM = teamB
  totalRuns: 315,
  manOfMatch: 'Blessing Muzarabani',
  sideBetAnswer: 'No', // Match did NOT go to 20th over (AUS all out in 19.3)
  players: [
    // === ZIM BATTING + BOWLING ===
    // ZIM 169/2 (20 ov)
    { pid: uuid(),                                   name: 'Brian Bennett',           runs: 64, balls: 56, fours: 7, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: uuid(),                                   name: 'Tadiwanashe Marumani',    runs: 35, balls: 21, fours: 7, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Cameron Green c Tadiwanashe Marumani b Brad Evans
    { pid: uuid(),                                   name: 'Ryan Burl',               runs: 35, balls: 30, fours: 4, sixes: 0, overs: 1,   runsConceded: 9,  econ: 9.00,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Bowling: Glenn Maxwell b Ryan Burl. Catches: Matt Renshaw c Ryan Burl b Blessing Muzarabani
    { pid: '22c9211a-456d-4991-885f-d9894900f8de', name: 'Sikandar Raza',           runs: 25, balls: 13, fours: 2, sixes: 1, overs: 2,   runsConceded: 17, econ: 8.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: uuid(),                                   name: 'Dion Myers',              runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 1,   runsConceded: 9,  econ: 9.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: uuid(),                                   name: 'Tony Munyonga',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Ben Dwarshuis c Tony Munyonga b Brad Evans
    { pid: uuid(),                                   name: 'Tashinga Musekiwa',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
    // Catches: Tim David c Tashinga Musekiwa b Blessing Muzarabani, Marcus Stoinis c Tashinga Musekiwa b Wellington Masakadza
    { pid: uuid(),                                   name: 'Brad Evans',              runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3.3, runsConceded: 23, econ: 6.60,  wickets: 3, catches: 0, stumpings: 0, runOuts: 1 },
    // Bowling: Travis Head b Brad Evans, Cameron Green c Marumani b Brad Evans, Ben Dwarshuis c Munyonga b Brad Evans
    // Run out: Matthew Kuhnemann run out (Brad Evans)
    { pid: uuid(),                                   name: 'Wellington Masakadza',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 36, econ: 9.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Marcus Stoinis c Tashinga Musekiwa b Wellington Masakadza
    { pid: uuid(),                                   name: 'Graeme Cremer',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 33, econ: 8.20,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Glenn Maxwell c Graeme Cremer... wait, no — checking scorecard. Tim David c Graeme Cremer b Blessing Muzarabani
    { pid: 'b30f4347-3e41-4fad-a42f-0b3cc459f491', name: 'Blessing Muzarabani',     runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 17, econ: 4.20,  wickets: 4, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },

    // === AUS BATTING + BOWLING ===
    // AUS 146/10 (19.3 ov)
    { pid: '2abe4511-befd-4497-94e7-6a680d69e703', name: 'Josh Inglis',             runs: 8,  balls: 4,  fours: 0, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '1c75176d-3750-4628-adf5-6f6065d6fb93', name: 'Travis Head',             runs: 17, balls: 15, fours: 3, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: uuid(),                                   name: 'Cameron Green',           runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 1.1, runsConceded: 6,  econ: 5.10,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Ryan Burl c (sub) b Cameron Green. 1.1 overs = 1 over + 1 ball, econ 5.10
    { pid: uuid(),                                   name: 'Tim David',               runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: uuid(),                                   name: 'Glenn Maxwell',           runs: 31, balls: 32, fours: 1, sixes: 1, overs: 1,   runsConceded: 14, econ: 14.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: uuid(),                                   name: 'Matt Renshaw',            runs: 65, balls: 44, fours: 5, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'fc46c6f8-8459-4634-8ce5-896688ae3d73', name: 'Marcus Stoinis',          runs: 6,  balls: 4,  fours: 1, sixes: 0, overs: 2.5, runsConceded: 17, econ: 6.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Tadiwanashe Marumani c Josh Inglis b Marcus Stoinis. 2.5 overs = 2 overs + 5 balls, econ 6.00
    { pid: uuid(),                                   name: 'Ben Dwarshuis',           runs: 6,  balls: 7,  fours: 0, sixes: 0, overs: 4,   runsConceded: 40, econ: 10.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: uuid(),                                   name: 'Nathan Ellis',            runs: 7,  balls: 4,  fours: 1, sixes: 0, overs: 4,   runsConceded: 34, econ: 8.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '147047d1-0717-471e-9329-0b916344d0ce', name: 'Adam Zampa',              runs: 2,  balls: 2,  fours: 0, sixes: 0, overs: 4,   runsConceded: 31, econ: 7.80,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: uuid(),                                   name: 'Matthew Kuhnemann',       runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 3,   runsConceded: 24, econ: 8.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

    // === PICKED BUT DID NOT PLAY ===
    { pid: 'fdc8b163-b813-42d0-b2cf-62691728495b', name: 'Brendan Taylor',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '03649be4-88cd-48ae-89bc-a203a300cb2a', name: 'Mitchell Marsh',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  ],
};

async function scoreMatch(m) {
  console.log('\n========================================');
  console.log('SCORING: ' + m.label + ' (' + m.matchId + ')');
  console.log('========================================');

  // Calculate & display fantasy points
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

  // Step 1: Ensure LOCKED
  console.log('\nStep 1: Lock match...');
  await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', m.matchId);
  console.log('  OK');

  // Step 2: Player stats
  console.log('Step 2: Insert player stats...');
  await sb.from('player_match_stats').delete().eq('match_id', m.matchId);
  const { error: statsErr } = await sb.from('player_match_stats').insert(statsToInsert);
  if (statsErr) {
    console.log('  Batch insert failed: ' + statsErr.message + '. Inserting one by one...');
    let ok = 0, fail = 0;
    for (const s of statsToInsert) {
      const { error } = await sb.from('player_match_stats').insert(s);
      if (error) { console.log('    FAIL ' + s.player_id.slice(0, 8) + ' (' + m.players.find(p => p.pid === s.player_id)?.name + '): ' + error.message); fail++; }
      else ok++;
    }
    console.log('  Inserted ' + ok + ' / ' + statsToInsert.length + ' (' + fail + ' failed)');
  } else {
    console.log('  OK: ' + statsToInsert.length + ' rows');
  }

  // Step 3: Match results
  console.log('Step 3: Upsert match results...');
  const { error: resErr } = await sb.from('match_results').upsert({
    match_id: m.matchId, winner: m.winner, total_runs: m.totalRuns, man_of_match: m.manOfMatch,
    side_bet_answers: {}, completed_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  console.log(resErr ? '  ERROR: ' + resErr.message : '  OK');

  // Step 4: Set correct answers
  console.log('Step 4: Set correct answers...');
  await sb.from('match_questions').update({ correct_answer: m.winner }).eq('match_id', m.matchId).eq('kind', 'WINNER');
  await sb.from('match_questions').update({ correct_answer: String(m.totalRuns) }).eq('match_id', m.matchId).eq('kind', 'TOTAL_RUNS');
  await sb.from('side_bets').update({ correct_answer: m.sideBetAnswer }).eq('side_bet_id', SIDE_BET_ID);
  console.log('  OK');

  // Step 5: Lock bets
  console.log('Step 5: Lock bets...');
  const { data: locked } = await sb.from('bets').update({ is_locked: true }).eq('match_id', m.matchId).select('bet_id');
  console.log('  Locked ' + (locked?.length || 0) + ' bets');

  // Step 6: Score via RPC (idempotent)
  console.log('Step 6: Score via RPC...');
  const { data: sr, error: sErr } = await sb.rpc('calculate_match_scores', { p_match_id: m.matchId, p_event_id: 't20wc_2026' });
  if (sErr) {
    console.log('  ERROR: ' + sErr.message);
  } else {
    console.log('  ' + JSON.stringify(sr));
  }

  // Step 7: Update status to SCORED
  console.log('Step 7: Set SCORED...');
  await sb.from('match_config').update({ status: 'SCORED' }).eq('match_id', m.matchId);
  console.log('  OK');

  // Step 8: Show bet scores
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
}

(async () => {
  await scoreMatch(matchData);

  // Show final leaderboard
  console.log('\n========================================');
  console.log('FINAL LEADERBOARD');
  console.log('========================================');
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .eq('tournament_id', 't20wc_2026')
    .order('total_score', { ascending: false });
  console.log('Name'.padEnd(22) + '| Score  | Matches');
  console.log('-'.repeat(45));
  for (const r of (lb || [])) {
    console.log(
      (r.display_name || '???').padEnd(22) + '| ' +
      String(r.total_score).padStart(6) + ' | ' +
      String(r.matches_played).padStart(7)
    );
  }
})();
