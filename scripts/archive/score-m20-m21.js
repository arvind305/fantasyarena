/**
 * Score wc_m20 (CAN vs UAE) and wc_m21 (USA vs NED) — Feb 13, 2026
 *
 * wc_m20: UAE won, 301 runs, MoM: Junaid Siddique (5 wickets), side bet: "0-15" (opening partnership 14)
 * wc_m21: USA won, 299 runs, MoM: Harmeet Singh (4 wickets), side bet: "51-80" (highest partnership 55)
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

const matches = [
  {
    matchId: 'wc_m20',
    label: 'CAN vs UAE',
    winner: 'opt_wc_m20_winner_teamB', // UAE = teamB
    totalRuns: 301,
    manOfMatch: 'Junaid Siddique',
    sideBetId: 'cdfbf0e7-e35e-4843-9eaf-e2891d59d34c',
    sideBetAnswer: '0-15', // Opening partnership: Samra + Bajwa = 14 runs
    players: [
      // === CAN BATTING (150/7, 20 ov) + BOWLING ===
      { pid: uuid(),                                   name: 'Yuvraj Samra',         runs: 5,  balls: 5,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'dd4a9951-79a9-4eb6-b47e-8ff0e3f95670', name: 'Dilpreet Bajwa',       runs: 11, balls: 11, fours: 2, sixes: 0, overs: 1,   runsConceded: 4,  econ: 4.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Navneet Dhaliwal',     runs: 34, balls: 28, fours: 4, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Muhammad Waseem c Navneet Dhaliwal b Kaleem Sana
      { pid: uuid(),                                   name: 'Nicholas Kirton',      runs: 4,  balls: 6,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 3, stumpings: 0, runOuts: 0 },
      // Catches: Alishan Sharafu c Kirton b Saad, Harshit Kaushik c Kirton b Saad, Sohaib Khan c Kirton b Jaskaran
      { pid: '944b660b-4f52-4d6d-9b8d-fa15cdcb4d32', name: 'Harsh Thaker',         runs: 50, balls: 41, fours: 2, sixes: 3, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Shreyas Movva',        runs: 21, balls: 21, fours: 2, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Jaskaran Singh',       runs: 4,  balls: 4,  fours: 0, sixes: 0, overs: 3.4, runsConceded: 45, econ: 12.30, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      // Bowling: Sohaib Khan c Nicholas Kirton b Jaskarandeep Singh
      { pid: uuid(),                                   name: 'Saad Bin Zafar',       runs: 5,  balls: 3,  fours: 1, sixes: 0, overs: 4,   runsConceded: 14, econ: 3.50,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
      // Bowling: Alishan Sharafu c Kirton b Saad, Mayank Kumar c Kaleem Sana b Saad, Harshit Kaushik c Kirton b Saad
      { pid: 'be33276f-b261-4a36-8066-5874d239fbb2', name: 'Dilon Heyliger',       runs: 6,  balls: 1,  fours: 0, sixes: 1, overs: 4,   runsConceded: 33, econ: 8.20,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Kaleem Sana',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 29, econ: 7.20,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
      // Bowling: Muhammad Waseem c Navneet Dhaliwal b Kaleem Sana. Catches: Mayank Kumar c Kaleem Sana b Saad Bin Zafar
      { pid: '6b546382-db71-4e42-a28c-32b6ab3b6a34', name: 'Ansh Patel',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,   runsConceded: 25, econ: 8.30,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

      // === UAE BATTING (151/5, 19.4 ov) + BOWLING ===
      { pid: '9f11f370-b490-44c6-8aa7-2f541f9cf171', name: 'Aryansh Sharma',       runs: 74, balls: 53, fours: 6, sixes: 3, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Nicholas Kirton c Aryansh Sharma b Muhammad Jawadullah
      { pid: '5134b69d-86f3-4d16-931a-e782cb2609e3', name: 'Muhammad Waseem',      runs: 4,  balls: 8,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Dilpreet Bajwa c Muhammad Waseem b Junaid Siddique
      { pid: '22e74fa7-558b-4ac9-b058-5dddb09aa954', name: 'Alishan Sharafu',      runs: 5,  balls: 13, fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
      // Catches: Yuvraj Samra c Alishan Sharafu b Junaid, Shreyas Movva c Alishan Sharafu b Junaid
      { pid: uuid(),                                   name: 'Mayank Kumar',         runs: 4,  balls: 6,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Harsh Thaker c Mayank Kumar b Junaid Siddique
      { pid: uuid(),                                   name: 'Harshit Kaushik',      runs: 5,  balls: 9,  fours: 1, sixes: 0, overs: 2,   runsConceded: 17, econ: 8.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Sohaib Khan',          runs: 51, balls: 29, fours: 4, sixes: 4, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Muhammad Arfan',       runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 4,   runsConceded: 33, econ: 8.20,  wickets: 0, catches: 0, stumpings: 0, runOuts: 1 },
      // Run out: Navneet Dhaliwal run out (Muhammad Arfan)
      { pid: uuid(),                                   name: 'Haider Ali',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 29, econ: 7.20,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Saad Bin Zafar c Haider Ali b Junaid Siddique
      { pid: uuid(),                                   name: 'Junaid Siddique',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 35, econ: 8.80,  wickets: 5, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
      { pid: uuid(),                                   name: 'Muhammad Jawadullah',  runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 16, econ: 4.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Muhammad Farooq',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,   runsConceded: 19, econ: 9.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

      // === PICKED BUT DID NOT PLAY ===
      { pid: '293550d2-f26c-4757-a556-343ab6e200f5', name: 'Asif Khan',            runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '35c37f8a-a2a9-43fa-b102-67a1cbfcee79', name: 'Dhruv Parashar',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '902d8aa2-96f9-4df4-90eb-2e4fdf9ad6b7', name: 'Ravinderpal Singh',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'b4bc4e0a-88bf-4c02-b810-dc2e8151bbcc', name: 'Shivam Sharma',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'b847b1e0-493e-4773-8fc2-7809d740d7c8', name: 'Karthik Meiyappan',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '0e4da61c-438e-4fa6-b010-143f68a8b263', name: 'Ajayveer Hundal',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    ],
  },
  {
    matchId: 'wc_m21',
    label: 'USA vs NED',
    winner: 'opt_wc_m21_winner_teamA', // USA = teamA
    totalRuns: 299,
    manOfMatch: 'Harmeet Singh',
    sideBetId: 'dcabfd05-a199-4c82-abf5-f290ebfcacd3',
    sideBetAnswer: '51-80', // Highest partnership: Monank Patel & Saiteja Mukkamalla = 55
    players: [
      // === USA BATTING (196/6, 20 ov) + BOWLING ===
      { pid: '4017255a-af7b-464c-8974-c93006d16b47', name: 'Monank Patel',          runs: 36, balls: 22, fours: 3, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Bas de Leede c Monank Patel b Harmeet Singh
      { pid: uuid(),                                   name: 'Shayan Jahangir',      runs: 20, balls: 14, fours: 1, sixes: 2, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Saiteja Mukkamalla',   runs: 79, balls: 51, fours: 5, sixes: 4, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Sanjay Krishnamurthi', runs: 1,  balls: 2,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Shubham Ranjane',      runs: 48, balls: 24, fours: 3, sixes: 2, overs: 1,   runsConceded: 4,  econ: 4.00,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Colin Ackermann c Shubham Ranjane b Shadley van Schalkwyk
      { pid: '4f336965-73e3-471f-aaf8-94ddc2542916', name: 'Milind Kumar',          runs: 3,  balls: 4,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
      // Catches: Max O'Dowd c Milind Kumar b Harmeet Singh, Fred Klaassen c Milind Kumar b Shadley van Schalkwyk
      { pid: uuid(),                                   name: 'Harmeet Singh',        runs: 1,  balls: 2,  fours: 0, sixes: 0, overs: 4,   runsConceded: 21, econ: 5.20,  wickets: 4, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
      { pid: uuid(),                                   name: 'Mohammad Mohsin',      runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 3,   runsConceded: 19, econ: 6.30,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '21fb1036-850b-420f-a0ee-09974da87869', name: 'Shadley van Schalkwyk', runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2.5, runsConceded: 21, econ: 7.40,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Nosthush Kenjige',     runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,   runsConceded: 20, econ: 6.70,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Ali Khan',             runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,   runsConceded: 18, econ: 9.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

      // === NED BATTING (103/10, 15.5 ov) + BOWLING ===
      { pid: 'dfb02dbd-a66c-4631-a419-a651a61d21e5', name: 'Michael Levitt',       runs: 3,  balls: 7,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Max O\'Dowd',          runs: 13, balls: 11, fours: 1, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '7e2e47df-fe5b-4a21-af2d-b069fd87d6c2', name: 'Bas de Leede',         runs: 23, balls: 17, fours: 1, sixes: 1, overs: 4,   runsConceded: 37, econ: 9.20,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '4fc2471d-29eb-4779-9e7c-bf17cd697082', name: 'Colin Ackermann',      runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Saiteja Mukkamalla c Colin Ackermann b Bas de Leede
      { pid: 'f833138e-9b09-4723-a288-f16ed6bd7c57', name: 'Scott Edwards',        runs: 20, balls: 14, fours: 2, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
      // Catches: Monank Patel c Scott Edwards b Bas de Leede, Milind Kumar c Scott Edwards b Bas de Leede
      { pid: uuid(),                                   name: 'Zach Lion-Cachet',     runs: 6,  balls: 5,  fours: 1, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Roelof van der Merwe', runs: 10, balls: 11, fours: 0, sixes: 0, overs: 3,   runsConceded: 36, econ: 12.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Harmeet Singh c Roelof van der Merwe b Logan van Beek
      { pid: '56e7c456-280a-48f4-a007-4656a6d461a7', name: 'Logan van Beek',       runs: 2,  balls: 5,  fours: 0, sixes: 0, overs: 4,   runsConceded: 28, econ: 7.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Aryan Dutt',           runs: 9,  balls: 7,  fours: 0, sixes: 1, overs: 2,   runsConceded: 24, econ: 12.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Kyle Klein',           runs: 6,  balls: 11, fours: 0, sixes: 0, overs: 4,   runsConceded: 35, econ: 8.80,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Fred Klaassen',        runs: 3,  balls: 6,  fours: 0, sixes: 0, overs: 3,   runsConceded: 32, econ: 10.70, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },

      // === PICKED BUT DID NOT PLAY ===
      { pid: 'bca5c113-6714-40d6-b0ae-1e3922226c2b', name: 'Saurabh Netravalkar',  runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '8ac010e3-6468-4354-bda0-2cdefeb11f03', name: 'Andries Gous',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    ],
  },
];

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
}

(async () => {
  for (const m of matches) {
    await scoreMatch(m);
  }

  // Show final leaderboard
  console.log('\n========================================');
  console.log('FINAL LEADERBOARD');
  console.log('========================================');
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false })
    .limit(10);
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
