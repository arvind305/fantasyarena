/**
 * Score wc_m16 (SL vs OMAN), wc_m17 (NEP vs ITA), wc_m18 (IND vs NAM)
 *
 * wc_m16: SL won, 345 runs, MoM: Pavan Rathnayake, No hat-trick
 * wc_m17: ITA won, 247 runs, MoM: Crishan Kalugamage, First innings 123
 * wc_m18: IND won, 325 runs, MoM: Hardik Pandya, Won by runs (batting first)
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

// =====================================================
// MATCH DATA
// =====================================================

const matches = [
  {
    matchId: 'wc_m16',
    label: 'SL vs OMAN',
    winner: 'opt_wc_m16_winner_teamA', // SL = teamA
    totalRuns: 345,
    manOfMatch: 'Pavan Rathnayake',
    sideBetId: 'f51d5869-ba14-4b23-9141-f8f50cfc1f96',
    sideBetAnswer: 'No', // No hat-trick
    players: [
      // === SL BATTING + BOWLING ===
      // SL 225/5 (20 ov)
      { pid: '73d37545-f2cc-47b1-bb5b-101df7a116c9', name: 'Pathum Nissanka',      runs: 13, balls: 11, fours: 2, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Shah Faisal c Pathum Nissanka b Dunith Wellalage
      { pid: uuid(),                                   name: 'Kamil Mishara',        runs: 8,  balls: 7,  fours: 2, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 1 },
      // Catches: Hammad Mirza c Kamil Mishara b Chameera. Run out: Vinayak Shukla run out (Kamil Mishara)
      { pid: '7b34f95f-265c-4c77-8e73-e6a4c1f13053', name: 'Kusal Mendis',         runs: 61, balls: 45, fours: 7, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 1, runOuts: 0 },
      // Catches: Wasim Ali c Kusal Mendis b Theekshana. Stumpings: Jiten Ramanandi st Kusal Mendis b Hemantha
      // Also involved in run out of Sufyan Mehmood (Kamindu Mendis/Kusal Mendis) — credit to Kamindu as thrower
      { pid: uuid(),                                   name: 'Pavan Rathnayake',     runs: 60, balls: 28, fours: 8, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
      { pid: 'f9a5da0b-91d5-466c-a3c0-842920583f6e', name: 'Dasun Shanaka',        runs: 50, balls: 20, fours: 2, sixes: 5, overs: 1,   runsConceded: 6,  econ: 6.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '3661bb86-d105-4ce0-8137-cc5d1163f709', name: 'Kamindu Mendis',       runs: 19, balls: 7,  fours: 1, sixes: 2, overs: 2,   runsConceded: 10, econ: 5.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 1 },
      // Bowling: Nadeem Khan c Dushmantha Chameera b Kamindu Mendis. Run out: Sufyan Mehmood run out (Kamindu Mendis/Kusal Mendis)
      { pid: 'cf59f01a-259f-4766-a682-a8e457ef056c', name: 'Dunith Wellalage',     runs: 6,  balls: 4,  fours: 1, sixes: 0, overs: 4,   runsConceded: 17, econ: 4.25,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Dushan Hemantha',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 45, econ: 11.25, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Dushmantha Chameera',  runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,   runsConceded: 19, econ: 9.50,  wickets: 2, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Nadeem Khan c Dushmantha Chameera b Kamindu Mendis
      { pid: '0232e4df-19a4-446b-8ed5-c5c315a585ef', name: 'Maheesh Theekshana',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 11, econ: 2.80,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '7eeba7a0-16f6-4afd-9625-6ad4123028d1', name: 'Matheesha Pathirana',  runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,   runsConceded: 11, econ: 3.70,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

      // === OMAN BATTING + BOWLING ===
      // OMAN 120/9 (20 ov)
      { pid: 'e1c047b7-cca0-4b61-bdef-dd8d5350eea3', name: 'Aamir Kaleem',         runs: 6,  balls: 5,  fours: 1, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '1f1aef9f-4fb9-448d-a64c-854317fc6d78', name: 'Jatinder Singh',       runs: 1,  balls: 2,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'f9092b2d-5815-48d9-bf20-9b24f786febe', name: 'Hammad Mirza',         runs: 9,  balls: 12, fours: 1, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'ad7b641b-6308-459b-8e70-c34c055f0abe', name: 'Mohammad Nadeem',      runs: 53, balls: 56, fours: 3, sixes: 1, overs: 4,   runsConceded: 40, econ: 10.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '22391649-9b78-49f9-84cb-4773d0aac57f', name: 'Wasim Ali',            runs: 27, balls: 20, fours: 0, sixes: 3, overs: 3,   runsConceded: 38, econ: 12.70, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Vinayak Shukla',       runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Jiten Ramanandi',      runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 4,   runsConceded: 41, econ: 10.25, wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
      // Bowling: Dasun Shanaka c Nadeem Khan b Jiten Ramanandi; Pavan Rathnayake b Jiten Ramanandi
      { pid: uuid(),                                   name: 'Nadeem Khan',          runs: 2,  balls: 3,  fours: 0, sixes: 0, overs: 4,   runsConceded: 40, econ: 10.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '634c567b-b1e8-4e0d-a8d0-24974f5972ab', name: 'Sufyan Mehmood',       runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 4,   runsConceded: 60, econ: 15.00, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Shah Faisal',          runs: 1,  balls: 8,  fours: 0, sixes: 0, overs: 4,   runsConceded: 28, econ: 7.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '59150c7c-e685-4bd7-8339-79d4dc19852c', name: 'Jay Odedra',           runs: 4,  balls: 12, fours: 0, sixes: 0, overs: 1,   runsConceded: 14, econ: 14.00, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    ],
  },
  {
    matchId: 'wc_m17',
    label: 'NEP vs ITA',
    winner: 'opt_wc_m17_winner_teamB', // ITA = teamB
    totalRuns: 247,
    manOfMatch: 'Crishan Kalugamage',
    sideBetId: 'b93ae38a-d1ba-47bf-8fbc-61386ecf4c0f',
    sideBetAnswer: '<=120', // First innings total was 123 — wait, 123 is NOT <=120. Let me re-check...
    // Actually: first innings was 123. Options: <=120, 121-150, 151-180, 181-200, >200
    // 123 falls in "121-150"
    // CORRECTING:
    players: [
      // === NEP BATTING + BOWLING ===
      // NEP 123/10 (19.3 ov)
      { pid: '068d8f45-61fb-436a-8039-25762501bc74', name: 'Kushal Bhurtel',       runs: 5,  balls: 10, fours: 1, sixes: 0, overs: 2,   runsConceded: 15, econ: 7.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '4d06745a-4be9-44ed-8d02-ff6e2f922b36', name: 'Aasif Sheikh',         runs: 20, balls: 20, fours: 2, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '74b39989-2a0a-4f6f-afaf-913efa57f4a3', name: 'Rohit Paudel',         runs: 23, balls: 14, fours: 0, sixes: 2, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '699ddb1c-85db-4a8d-bc23-8c2cd76589f9', name: 'Dipendra Singh Airee', runs: 17, balls: 18, fours: 0, sixes: 0, overs: 3.4, runsConceded: 24, econ: 6.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      // Note: 3.4 overs = 3 complete overs + 4 balls. For economy calc, using 3.67 overs. But econ given as 6.50.
      { pid: '4fce8ede-ca76-4177-b5c0-29eb042f15f9', name: 'Aarif Sheikh',         runs: 27, balls: 24, fours: 3, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'c90e6d08-6c28-4184-b02f-2e82232b8b33', name: 'Lokesh Bam',           runs: 3,  balls: 5,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'c7cf1179-5a12-45ce-9fac-22c7c3545e92', name: 'Gulsan Jha',           runs: 3,  balls: 4,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'd04d31f3-3e2e-4a5a-a3f6-e140ef3ac8d0', name: 'Karan KC',             runs: 18, balls: 11, fours: 1, sixes: 1, overs: 2,   runsConceded: 21, econ: 10.50, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '694f62e3-eb61-4414-af51-bfacf6182ccf', name: 'Nandan Yadav',         runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 1,   runsConceded: 12, econ: 12.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '6489d997-6012-4a77-9e72-bbea3a7dc3fb', name: 'Sandeep Lamichhane',   runs: 5,  balls: 7,  fours: 0, sixes: 0, overs: 3,   runsConceded: 31, econ: 10.30, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '43f58435-dc59-435f-a94c-ec00bc33dd22', name: 'Lalit Rajbanshi',      runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 1,   runsConceded: 19, econ: 19.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

      // === ITA BATTING + BOWLING ===
      // ITA 124/0 (12.4 ov) — chased successfully
      { pid: '44e5530a-42a1-405e-b244-36ad5d3a659a', name: 'Justin Mosca',         runs: 60, balls: 44, fours: 5, sixes: 3, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      // Fielding: Nandan Yadav run out (Justin Mosca/Gian Meade) — credit to Justin Mosca
      { pid: '4e0bcddc-905b-4a76-9ed6-4f8eddc25041', name: 'Anthony Mosca',        runs: 62, balls: 32, fours: 3, sixes: 6, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '4de5c4b8-7783-4c5c-ba9f-2ce5777357df', name: 'JJ Smuts',             runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 22, econ: 5.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '5f991626-5727-4782-990b-13607d05c401', name: 'Ben Manenti',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 9,  econ: 2.25,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '331c0020-bcb6-4faf-b383-d0f5663b5e57', name: 'Harry Manenti',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 1 },
      // Fielding: Lalit Rajbanshi run out (Harry Manenti)
      { pid: '352243ba-89b9-463a-83db-c21f93a64511', name: 'Grant Stewart',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,   runsConceded: 32, econ: 10.70, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '86f6e85a-0185-44a8-83e3-ad3dbaa26f5b', name: 'Crishan Kalugamage',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 18, econ: 4.50,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
      { pid: '292ac47c-1dca-446c-ab5b-a8a71f6a3400', name: 'Ali Hasan',             runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,   runsConceded: 34, econ: 11.30, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '9d154621-f8d1-4efc-8dc2-ae464e15fc38', name: 'Jaspreet Singh',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 1.3, runsConceded: 8,  econ: 5.30,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '1f947cb4-f552-467c-ad49-5c53cedef319', name: 'Marcus Campopiano',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'b5b58832-2c63-44bc-8af7-8df5808287b3', name: 'Gian Meade',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    ],
  },
  {
    matchId: 'wc_m18',
    label: 'IND vs NAM',
    winner: 'opt_wc_m18_winner_teamA', // IND = teamA
    totalRuns: 325,
    manOfMatch: 'Hardik Pandya',
    sideBetId: '39730d5b-1517-4fdb-b7df-e1a8c13c4fd3',
    sideBetAnswer: 'By runs (batting first wins)',
    players: [
      // === IND BATTING + BOWLING ===
      // IND 209/9 (20 ov)
      { pid: '00f4c503-3020-48eb-811d-c021859b4172', name: 'Ishan Kishan',          runs: 61, balls: 24, fours: 6, sixes: 5, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '64e1f253-ccb0-4aa8-9885-4fa1811114af', name: 'Sanju Samson',          runs: 22, balls: 8,  fours: 1, sixes: 3, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'e74b8e5c-dc3b-4850-be15-eb7f47a608d1', name: 'Tilak Varma',           runs: 25, balls: 21, fours: 3, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Gerhard Erasmus c Tilak Varma b Axar Patel
      { pid: 'e3fbffd0-751c-4a9c-9bb3-bf3229c032d9', name: 'Suryakumar Yadav',     runs: 12, balls: 13, fours: 0, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '2980b4bc-7484-446c-bba5-0a99479680db', name: 'Hardik Pandya',         runs: 52, balls: 28, fours: 4, sixes: 4, overs: 4,   runsConceded: 21, econ: 5.25,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
      { pid: '4293e58a-7460-4724-bd00-be0cfd423b3a', name: 'Shivam Dube',           runs: 23, balls: 16, fours: 1, sixes: 1, overs: 2.2, runsConceded: 11, econ: 4.70,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Jan Frylinck c Shivam Dube b Arshdeep Singh
      { pid: '5b33d2c3-790a-46a3-be7c-de05ae7b74e4', name: 'Rinku Singh',           runs: 1,  balls: 6,  fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '40e543f4-ca65-4b1a-b95a-96f44ac5ed58', name: 'Axar Patel',            runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 3,   runsConceded: 20, econ: 6.70,  wickets: 2, catches: 2, stumpings: 0, runOuts: 0 },
      // Catches: Loftie-Eaton c Axar Patel b Varun; Bernard Scholtz c Axar Patel b Hardik Pandya
      { pid: 'dcb4ba76-40db-4ee8-af07-506fa0a54628', name: 'Varun Chakravarthy',    runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 2,   runsConceded: 7,  econ: 3.50,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '17c8c38b-55b0-4499-8791-6ae85b5fb9c8', name: 'Arshdeep Singh',        runs: 2,  balls: 2,  fours: 0, sixes: 0, overs: 3,   runsConceded: 36, econ: 12.00, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '48b48fa6-106a-44a7-a6a2-6bb249d2aed6', name: 'Jasprit Bumrah',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   runsConceded: 20, econ: 5.00,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Malan Kruger c Jasprit Bumrah b Axar Patel

      // === NAM BATTING + BOWLING ===
      // NAM 116/10 (18.2 ov)
      { pid: 'dfac417d-8979-45d4-85fb-7ff054976f61', name: 'Louren Steenkamp',      runs: 29, balls: 20, fours: 3, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
      // Catches: Sanju Samson c Louren Steenkamp b Ben Shikongo
      { pid: '7ec40512-1fc1-455d-b731-e711e856d9e6', name: 'Jan Frylinck',          runs: 22, balls: 15, fours: 3, sixes: 1, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: uuid(),                                   name: 'Jan Nicol Loftie-Eaton', runs: 13, balls: 13, fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '15068c87-21ad-4004-8509-d8247dfb33ec', name: 'Gerhard Erasmus',       runs: 18, balls: 11, fours: 0, sixes: 2, overs: 4,   runsConceded: 20, econ: 5.00,  wickets: 4, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '2315a209-6258-4b3b-8dad-458766a1c00e', name: 'JJ Smit',               runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 4,   runsConceded: 50, econ: 12.50, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'ee91a9cc-9aa8-40cb-a3e4-0b658bbd7c46', name: 'Zane Green',            runs: 11, balls: 19, fours: 0, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'd0d71d09-e71a-4943-a4a5-4666aadcd77a', name: 'Malan Kruger',          runs: 5,  balls: 10, fours: 1, sixes: 0, overs: 0,   runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: 'baba58ed-fe1f-4f96-b143-128f6322ca68', name: 'Ruben Trumpelmann',     runs: 6,  balls: 16, fours: 0, sixes: 0, overs: 4,   runsConceded: 38, econ: 9.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '4f1fc19e-163b-4c5a-828b-544b2a822cb8', name: 'Bernard Scholtz',       runs: 4,  balls: 4,  fours: 1, sixes: 0, overs: 4,   runsConceded: 41, econ: 10.25, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '349f6479-46da-46e7-93e4-a0478721cde6', name: 'Ben Shikongo',          runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 3,   runsConceded: 41, econ: 13.70, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
      { pid: '84a7d596-49c7-41ab-89d4-9cb7516f5050', name: 'Max Heingo',            runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 1,   runsConceded: 18, econ: 18.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    ],
  },
];

// Fix side bet answer for m17 (first innings was 123 → "121-150")
matches[1].sideBetAnswer = '121-150';

// =====================================================
// SCORING ENGINE
// =====================================================

async function scoreMatch(m) {
  console.log('\n' + '='.repeat(70));
  console.log('SCORING ' + m.matchId + ': ' + m.label);
  console.log('='.repeat(70));

  // Compute fantasy points
  console.log('\n--- FANTASY POINTS ---');
  console.log('Player'.padEnd(26) + '| Runs | Wkts | Fld | Fantasy');
  console.log('-'.repeat(65));

  const statsToInsert = [];
  for (const p of m.players) {
    const fp = calcFantasyPoints(p);
    const fld = (p.catches || 0) + (p.runOuts || 0) + (p.stumpings || 0);
    console.log(
      p.name.padEnd(26) + '| ' +
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

  // Step 7: Show bet scores
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
  console.log('\n' + '='.repeat(70));
  console.log('=== FINAL LEADERBOARD ===');
  console.log('='.repeat(70));
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, rank, matches_played')
    .eq('event_id', 't20wc_2026')
    .order('rank');
  let i = 1;
  for (const r of (lb || [])) {
    console.log('  #' + r.rank + ' ' + r.display_name.padEnd(22) + r.total_score + ' pts (' + r.matches_played + ' matches)');
  }

  console.log('\nDone! All 3 matches scored.');
})();
