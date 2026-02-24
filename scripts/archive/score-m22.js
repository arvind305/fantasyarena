/**
 * Score wc_m22 (IRE vs OMAN) — Feb 14, 2026
 *
 * IRE 235/5 (20 ov) beat OMAN 139/10 (18 ov) by 96 runs
 * Total runs: 374, MoM: Lorcan Tucker (94* off 51)
 * Side bet: Dot ball % = 72/228 = 31.6% → "30-40%"
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

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
  matchId: 'wc_m22',
  label: 'IRE vs OMAN',
  winner: 'opt_wc_m22_winner_teamA', // IRE = teamA
  totalRuns: 374,
  manOfMatch: 'Lorcan Tucker',
  sideBetId: 'ef381dde-26cd-4ac8-9fe4-de3a11b36899',
  sideBetAnswer: '30-40%', // Dot ball %: 72/228 = 31.6%
  players: [
    // === IRE BATTING (235/5, 20 ov) + BOWLING ===
    { pid: '01ff237d-c4a1-442d-93d9-7e299d58b2a6', name: 'Tim Tector',         runs: 5,  balls: 4,  fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '750c8110-aa24-402e-88b2-157406649648', name: 'Ross Adair',          runs: 14, balls: 7,  fours: 3, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Sufyan Mehmood c Ross Adair b Barry McCarthy
    { pid: '42ddc126-cec3-42c4-b0ef-7275545c922e', name: 'Harry Tector',        runs: 14, balls: 13, fours: 2, sixes: 0, overs: 1, runsConceded: 9,  econ: 9.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 1 },
    // Bowling: 1-0-9-0. Run out: Ashish Odedara run out (Harry Tector/Lorcan Tucker)
    { pid: '2c568b69-07d0-43d6-9e36-c6e5d88faba8', name: 'Lorcan Tucker',       runs: 94, balls: 51, fours: 10, sixes: 4, overs: 0, runsConceded: 0, econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
    // WK, not out. Assisted in Odedara run out but Harry Tector gets primary credit.
    { pid: '89bf4c1c-3329-4eeb-b98c-7f48d95db19e', name: 'Curtis Campher',      runs: 12, balls: 7,  fours: 2, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 1 },
    // Run out: Hammad Mirza run out (Curtis Campher/Harry Tector)
    { pid: '7300af5b-c76f-4ffa-8986-98577a9a26ff', name: 'Gareth Delany',       runs: 56, balls: 30, fours: 3, sixes: 4, overs: 2, runsConceded: 13, econ: 6.50,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Mohammad Nadeem c Gareth Delany b Joshua Little. Bowling: 2-0-13-0
    { pid: '1cb5969d-68be-4f59-95f2-26ad801df67b', name: 'George Dockrell',     runs: 35, balls: 9,  fours: 0, sixes: 5, overs: 1, runsConceded: 6,  econ: 6.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Vinayak Shukla c Matthew Humphreys b George Dockrell
    { pid: '20ed4e7e-cb02-403f-a527-a023203a2a30', name: 'Mark Adair',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 36, econ: 12.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // DNB. Catches: Jiten Ramanandi c Mark Adair b Joshua Little
    { pid: 'd1b132b7-9e6c-4e1d-8a7b-9b5c172f6fcd', name: 'Barry McCarthy',     runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 32, econ: 10.70, wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Aamir Kaleem c Humphreys b McCarthy, Sufyan Mehmood c Ross Adair b McCarthy
    { pid: 'eb4db2f8-c161-4ed3-aee8-a7bc05a83042', name: 'Matthew Humphreys',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 27, econ: 6.80,  wickets: 2, catches: 3, stumpings: 0, runOuts: 0 },
    // Bowling: Jatinder lbw, Shakeel c&b. Catches: Aamir Kaleem, Vinayak Shukla, Shakeel Ahmed (c&b)
    { pid: '83601689-457c-4168-a13a-78039428300d', name: 'Josh Little',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 16, econ: 4.00,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Mohammad Nadeem, Jiten Ramanandi, Nadeem Khan

    // === OMAN BATTING (139/10, 18 ov) + BOWLING ===
    { pid: 'e1c047b7-cca0-4b61-bdef-dd8d5350eea3', name: 'Aamir Kaleem',        runs: 50, balls: 29, fours: 5, sixes: 2, overs: 4, runsConceded: 29, econ: 7.20,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Batting: top scorer. Bowling: Curtis Campher lbw b Aamir Kaleem. Catches: Ross Adair c Aamir Kaleem b Shakeel
    { pid: '1f1aef9f-4fb9-448d-a64c-854317fc6d78', name: 'Jatinder Singh',      runs: 7,  balls: 5,  fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'f9092b2d-5815-48d9-bf20-9b24f786febe', name: 'Hammad Mirza',        runs: 46, balls: 37, fours: 6, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'ad7b641b-6308-459b-8e70-c34c055f0abe', name: 'Mohammad Nadeem',     runs: 1,  balls: 3,  fours: 0, sixes: 0, overs: 2, runsConceded: 32, econ: 16.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '634c567b-b1e8-4e0d-a8d0-24974f5972ab', name: 'Sufyan Mehmood',      runs: 10, balls: 11, fours: 1, sixes: 0, overs: 2, runsConceded: 35, econ: 17.50, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '07928e72-0b57-47e6-80d9-87921ccbe956', name: 'Shakeel Ahmed',       runs: 4,  balls: 5,  fours: 1, sixes: 0, overs: 4, runsConceded: 33, econ: 8.20,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Tim Tector, Ross Adair, Harry Tector

    // === PICKED BUT DID NOT PLAY ===
    { pid: 'c156e2ee-7512-40ec-85ba-8436dc459415', name: 'Paul Stirling',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '0ccc4956-62ed-44f5-a99b-7e9ed9643abd', name: 'Ayaan Khan',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
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
  await sb.from('side_bets').update({ correct_answer: m.sideBetAnswer }).eq('side_bet_id', m.sideBetId);
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

  // Show final leaderboard
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
