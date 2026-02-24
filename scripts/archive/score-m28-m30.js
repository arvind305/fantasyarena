/**
 * Score wc_m28 through wc_m30 — Feb 16, 2026
 *
 * wc_m28: AFG 162/5 (19.2 ov) vs UAE 160/9 (20 ov) — AFG won by 5 wickets. Total: 322. MoM: Azmatullah Omarzai (40* off 21, 4/15)
 * wc_m29: ENG 202/7 (20 ov) vs ITA 178/10 (20 ov) — ENG won by 24 runs. Total: 380. MoM: Will Jacks (53* off 22, 1/34)
 * wc_m30: AUS 181/10 (20 ov) vs SL 184/2 (18 ov) — SL won by 8 wickets. Total: 365. MoM: Pathum Nissanka (100* off 52)
 *
 * NOT IN DB (skipped):
 *   UAE: Sohaib Khan, Syed Haider, Harshit Kaushik, Muhammad Arfan, Simranjeet Singh
 *   AFG: Ziaur Rahman Sharifi
 *   SL: Pavan Rathnayake, Dushan Hemantha, Dushmantha Chameera
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

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
// wc_m28: AFG vs UAE — AFG won by 5 wickets
// Side bet: "What will be the highest individual score in this match?" → 68 (Sohaib Khan) → "51-75"
// NOT IN DB: Sohaib Khan, Syed Haider, Harshit Kaushik, Muhammad Arfan, Simranjeet Singh (UAE), Ziaur Rahman Sharifi (AFG)
// ============================================================
const m28 = {
  matchId: 'wc_m28',
  label: 'AFG vs UAE',
  winner: 'opt_wc_m28_winner_teamA', // AFG = teamA
  totalRuns: 322,
  manOfMatch: 'Azmatullah Omarzai',
  sideBetId: '414612ca-2e71-49f2-8933-34cad91066bc',
  sideBetAnswer: '51-75',
  players: [
    // === UAE BATTING (160/9, 20 ov) ===
    // Aryansh Sharma (wk): 0(4) — c Gurbaz b Omarzai
    { pid: '9f11f370-b490-44c6-8aa7-2f541f9cf171', name: 'Aryansh Sharma',       runs: 0,  balls: 4,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Muhammad Waseem (c): 10(6), 2x4 — lbw b Mujeeb. Catch: Ibrahim c Waseem b Arfan
    { pid: '5134b69d-86f3-4d16-931a-e782cb2609e3', name: 'Muhammad Waseem',       runs: 10, balls: 6,  fours: 2, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Alishan Sharafu: 40(31), 3x4, 2x6 — c Ibrahim b Mujeeb
    { pid: '22e74fa7-558b-4ac9-b058-5dddb09aa954', name: 'Alishan Sharafu',       runs: 40, balls: 31, fours: 3, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Sohaib Khan: 68(48), 6x4, 4x6 — NOT IN DB
    // Syed Haider: 13(10), 1x4, 1x6 — NOT IN DB
    // Harshit Kaushik: 0(3) — NOT IN DB
    // Muhammad Arfan: 0(2) — NOT IN DB (batted & bowled 4-0-30-2 — wickets: Ibrahim, Naib)
    // Haider Ali: 13(12), 2x4 — run out (Gurbaz). Bowled 4-0-33-0
    { pid: 'bfbc1931-9569-4ad0-88df-78bec17f29cc', name: 'Haider Ali',            runs: 13, balls: 12, fours: 2, sixes: 0, overs: 4, runsConceded: 33, econ: 8.25,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Simranjeet Singh: 3(4) — NOT IN DB (also bowled 4-0-37-0)
    // Junaid Siddique: 3(2) — run out (Rashid/Gurbaz). Bowled 3.2-0-23-2 (Gurbaz, Rasooli)
    { pid: 'cf72a819-5bdb-4239-9007-5fd069a563c0', name: 'Junaid Siddique',       runs: 3,  balls: 2,  fours: 0, sixes: 0, overs: 3, runsConceded: 23, econ: 6.90,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // Muhammad Jawadullah: DNB. Bowled 4-0-39-1 (Atal)
    { pid: '6bf925bd-07e4-469d-bdba-178ddd0931ca', name: 'Muhammad Jawadullah',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 39, econ: 9.75,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },

    // === AFG BATTING (162/5, 19.2 ov) + BOWLING ===
    // Rahmanullah Gurbaz (wk): 0(2) — c Sohaib b Junaid. Catches: Sharma c Gurbaz b Omarzai, Kaushik c Gurbaz b Omarzai. RunOut: Haider Ali run out (Gurbaz)
    { pid: 'e3e62b5d-4870-426f-bd1b-02ea1c46ca89', name: 'Rahmanullah Gurbaz',    runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 1 },
    // Ibrahim Zadran: 53(41), 6x4, 1x6 — c Waseem b Arfan. Catch: Sharafu c Ibrahim b Mujeeb
    { pid: '51211070-9cb6-4a3f-ae5e-b2942e48bb98', name: 'Ibrahim Zadran',        runs: 53, balls: 41, fours: 6, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Gulbadin Naib: 13(12), 1x4, 1x6 — c Kaushik b Arfan. Bowled 1-0-8-0
    { pid: '7160b6a0-c7f8-40c5-b5e4-a2c082e144cf', name: 'Gulbadin Naib',         runs: 13, balls: 12, fours: 1, sixes: 1, overs: 1, runsConceded: 8,  econ: 8.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Sediqullah Atal: 16(14), 1x4, 1x6 — b Jawadullah
    { pid: 'a2d62f67-d8ed-4223-b674-8cb6b615ad19', name: 'Sediqullah Atal',       runs: 16, balls: 14, fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Darwish Rasooli: 33(23), 3x4, 1x6 — b Junaid
    { pid: '5d1a02fe-feea-47fe-8347-05a3c88ef0f2', name: 'Darwish Rasooli',       runs: 33, balls: 23, fours: 3, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Azmatullah Omarzai: 40(21), 2x4, 3x6 — not out. Bowled 4-0-15-4 (Sharma, Sohaib, Haider, Kaushik). MoM
    { pid: 'f3b15726-d5e4-4c12-b970-afbe36b1cb1f', name: 'Azmatullah Omarzai',    runs: 40, balls: 21, fours: 2, sixes: 3, overs: 4, runsConceded: 15, econ: 3.75,  wickets: 4, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
    // Mohammad Nabi: 3(3) — not out. DNB (bowling)
    { pid: '548ba945-68ff-4c5e-a8d2-eda82106cee4', name: 'Mohammad Nabi',         runs: 3,  balls: 3,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Rashid Khan (c): DNB. Bowled 4-0-24-1 (Arfan hit wkt). RunOut: Siddique run out (Rashid/Gurbaz)
    { pid: '397b4521-6d80-481c-8492-0c32358ea194', name: 'Rashid Khan',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 24, econ: 6.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 1 },
    // Mujeeb Ur Rahman: DNB. Bowled 4-0-31-2 (Waseem lbw, Sharafu c Ibrahim). Catch: Sohaib c Mujeeb b Omarzai
    { pid: '00825a0f-f20e-4bf1-a15e-a888eb0cf6d2', name: 'Mujeeb Ur Rahman',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 31, econ: 7.75,  wickets: 2, catches: 1, stumpings: 0, runOuts: 0 },
    // Noor Ahmad: DNB. Bowled 3-0-35-0
    { pid: 'cdccf965-4ccb-4d1b-a95a-a77b32067fa2', name: 'Noor Ahmad',            runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 35, econ: 11.67, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Ziaur Rahman Sharifi: DNB. Bowled 4-0-43-0 — NOT IN DB
  ],
};

// ============================================================
// wc_m29: ENG vs ITA — ENG won by 24 runs
// Side bet: "How many sixes will be hit in this match?" → ENG 12 + ITA 13 = 25 → "21+"
// All players in DB
// ============================================================
const m29 = {
  matchId: 'wc_m29',
  label: 'ENG vs ITA',
  winner: 'opt_wc_m29_winner_teamA', // ENG = teamA
  totalRuns: 380,
  manOfMatch: 'Will Jacks',
  sideBetId: 'f81c4c15-d802-4362-b00c-09a33cd65c86',
  sideBetAnswer: '21+',
  players: [
    // === ENG BATTING (202/7, 20 ov) + BOWLING ===
    // Philip Salt: 28(15), 2x4, 2x6 — c A.Mosca b Ali Hasan
    { pid: '97cbc25f-15c5-4537-99b3-423bb8b7b6b1', name: 'Philip Salt',           runs: 28, balls: 15, fours: 2, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Jos Buttler (wk): 3(4) — c H.Manenti b Stewart. Catches: H.Manenti c Buttler b Overton, Meade c Buttler b Curran
    { pid: '6aa256f8-1511-4e93-9654-16f35d9fa7d8', name: 'Jos Buttler',           runs: 3,  balls: 4,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
    // Jacob Bethell: 23(20), 2x4, 1x6 — c Jaspreet b B.Manenti
    { pid: '91ce209e-b369-416f-8e6c-045655f75f27', name: 'Jacob Bethell',         runs: 23, balls: 20, fours: 2, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Tom Banton: 30(21), 3x4, 1x6 — c B.Manenti b Kalugamage. Catches: J.Mosca c Banton b Rashid, B.Manenti c Banton b Jacks, Campopiano c Banton b Curran
    { pid: '84013d6e-c435-4dea-89bf-c3f91713814c', name: 'Tom Banton',            runs: 30, balls: 21, fours: 3, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 3, stumpings: 0, runOuts: 0 },
    // Harry Brook (c): 14(9), 1x4, 1x6 — c Meade b Smuts. Catch: A.Mosca c Brook b Archer
    { pid: '60c6c274-f6a3-4019-ae5a-ed72f86e7efa', name: 'Harry Brook',           runs: 14, balls: 9,  fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Sam Curran: 25(19), 0x4, 2x6 — c Smuts b Kalugamage. Bowled 3-0-22-3 (Stewart, Campopiano, Meade)
    { pid: 'b9da8da8-371b-4d30-b995-85734ac887f7', name: 'Sam Curran',            runs: 25, balls: 19, fours: 0, sixes: 2, overs: 3, runsConceded: 22, econ: 7.33,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
    // Will Jacks: 53(22), 3x4, 4x6 — not out. Bowled 2-0-34-1 (B.Manenti c Banton b Jacks). Catch: Jaspreet c Jacks b Overton. MoM
    { pid: '071361b3-eefa-4855-92ba-650b26dd8df1', name: 'Will Jacks',            runs: 53, balls: 22, fours: 3, sixes: 4, overs: 2, runsConceded: 34, econ: 17.00, wickets: 1, catches: 1, stumpings: 0, runOuts: 0, isMoM: true },
    // Jamie Overton: 15(9), 1x4, 1x6 — c Kalugamage b Stewart. Bowled 4-1-18-3 (H.Manenti, Jaspreet, Ali Hasan). Catch: Smuts c Overton b Archer
    { pid: '072574d3-ed67-40d8-a1f8-04dc71aa5a74', name: 'Jamie Overton',         runs: 15, balls: 9,  fours: 1, sixes: 1, overs: 4, runsConceded: 18, econ: 4.50,  wickets: 3, catches: 1, stumpings: 0, runOuts: 0 },
    // Jofra Archer: 1(1) — not out. Bowled 4-0-35-2 (A.Mosca, Smuts)
    { pid: '95c67e6a-b939-46a1-a826-596f1b9f26b4', name: 'Jofra Archer',          runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 4, runsConceded: 35, econ: 8.75,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // Liam Dawson: DNB. Bowled 3-0-25-0. Catch: Stewart c Dawson b Curran
    { pid: '917383ba-d8e1-40d1-8928-c057539a9c32', name: 'Liam Dawson',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 25, econ: 8.33,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Adil Rashid: DNB. Bowled 4-0-43-1 (J.Mosca c Banton b Rashid)
    { pid: '1de08c59-d3be-4bad-a1dd-671c10b77dd0', name: 'Adil Rashid',           runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 43, econ: 10.75, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },

    // === ITA BATTING (178/10, 20 ov) + BOWLING ===
    // Justin Mosca: 43(34), 7x4, 0x6 — c Banton b Rashid
    { pid: '44e5530a-42a1-405e-b244-36ad5d3a659a', name: 'Justin Mosca',          runs: 43, balls: 34, fours: 7, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Anthony Mosca: 0(1) — c Brook b Archer. Catch: Salt c A.Mosca b Ali Hasan
    { pid: '4e0bcddc-905b-4a76-9ed6-4f8eddc25041', name: 'Anthony Mosca',         runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // JJ Smuts: 0(4) — c Overton b Archer. Bowled 3-0-24-1 (Brook c Meade b Smuts). Catch: Curran c Smuts b Kalugamage
    { pid: '4de5c4b8-7783-4c5c-ba9f-2ce5777357df', name: 'JJ Smuts',              runs: 0,  balls: 4,  fours: 0, sixes: 0, overs: 3, runsConceded: 24, econ: 8.00,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Harry Manenti (c): 12(11), 1x4, 1x6 — c Buttler b Overton. Catch: Buttler c H.Manenti b Stewart
    { pid: '331c0020-bcb6-4faf-b383-d0f5663b5e57', name: 'Harry Manenti',         runs: 12, balls: 11, fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Ben Manenti: 60(25), 4x4, 6x6 — c Banton b Jacks. Bowled 4-0-37-1 (Bethell c Jaspreet b B.Manenti). Catch: Banton c B.Manenti b Kalugamage
    { pid: '5f991626-5727-4782-990b-13607d05c401', name: 'Ben Manenti',           runs: 60, balls: 25, fours: 4, sixes: 6, overs: 4, runsConceded: 37, econ: 9.25,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Grant Stewart: 45(23), 2x4, 5x6 — c Dawson b Curran. Bowled 4-0-51-2 (Buttler, Overton)
    { pid: '352243ba-89b9-463a-83db-c21f93a64511', name: 'Grant Stewart',         runs: 45, balls: 23, fours: 2, sixes: 5, overs: 4, runsConceded: 51, econ: 12.75, wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // Marcus Campopiano: 2(6) — c Banton b Curran
    { pid: '1f947cb4-f552-467c-ad49-5c53cedef319', name: 'Marcus Campopiano',     runs: 2,  balls: 6,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Gian Meade (wk): 0(1) — c Buttler b Curran. Catch: Brook c Meade b Smuts
    { pid: 'b5b58832-2c63-44bc-8af7-8df5808287b3', name: 'Gian Meade',            runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Jaspreet Singh: 12(10), 0x4, 1x6 — c Jacks b Overton. Bowled 1-0-10-0. Catch: Bethell c Jaspreet b B.Manenti
    { pid: '9d154621-f8d1-4efc-8dc2-ae464e15fc38', name: 'Jaspreet Singh',        runs: 12, balls: 10, fours: 0, sixes: 1, overs: 1, runsConceded: 10, econ: 10.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Crishan Kalugamage: 0(1) — not out. Bowled 4-0-41-2 (Banton, Curran). Catch: Overton c Kalugamage b Stewart
    { pid: '86f6e85a-0185-44a8-83e3-ad3dbaa26f5b', name: 'Crishan Kalugamage',    runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 4, runsConceded: 41, econ: 10.25, wickets: 2, catches: 1, stumpings: 0, runOuts: 0 },
    // Ali Hasan: 0(4) — b Overton. Bowled 4-0-37-1 (Salt c A.Mosca b Ali Hasan)
    { pid: '292ac47c-1dca-446c-ab5b-a8a71f6a3400', name: 'Ali Hasan',             runs: 0,  balls: 4,  fours: 0, sixes: 0, overs: 4, runsConceded: 37, econ: 9.25,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  ],
};

// ============================================================
// wc_m30: AUS vs SL — SL won by 8 wickets
// Side bet: "How many fours will be hit in this match?" → AUS 20 + SL 22 = 42 → "36+"
// NOT IN DB: Pavan Rathnayake, Dushan Hemantha, Dushmantha Chameera (SL)
// ============================================================
const m30 = {
  matchId: 'wc_m30',
  label: 'AUS vs SL',
  winner: 'opt_wc_m30_winner_teamB', // SL = teamB
  totalRuns: 365,
  manOfMatch: 'Pathum Nissanka',
  sideBetId: '70d28f44-3074-4b55-98de-98fa73608f7a',
  sideBetAnswer: '36+',
  players: [
    // === AUS BATTING (181/10, 20 ov) + BOWLING ===
    // Mitchell Marsh (c): 54(27), 8x4, 2x6 — lbw b Hemantha
    { pid: '03649be4-88cd-48ae-89bc-a203a300cb2a', name: 'Mitchell Marsh',        runs: 54, balls: 27, fours: 8, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Travis Head: 56(29), 7x4, 3x6 — c Kamindu b Hemantha
    { pid: '1c75176d-3750-4628-adf5-6f6065d6fb93', name: 'Travis Head',           runs: 56, balls: 29, fours: 7, sixes: 3, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Cameron Green: 3(7) — st K.Mendis b Wellalage
    { pid: '8421a5d0-91c1-4e4b-b966-f4266322b9a0', name: 'Cameron Green',        runs: 3,  balls: 7,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Tim David: 6(5), 1x4 — c Hemantha b Kamindu
    { pid: '9e57bc63-fbca-4ca5-98c8-78137d5e9aa0', name: 'Tim David',             runs: 6,  balls: 5,  fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Josh Inglis (wk): 27(22), 3x4 — c Wellalage b Chameera
    { pid: '2abe4511-befd-4497-94e7-6a680d69e703', name: 'Josh Inglis',           runs: 27, balls: 22, fours: 3, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Glenn Maxwell: 22(15), 1x4, 1x6 — c Nissanka b Hemantha. Bowled 2-0-16-0
    { pid: 'f7851482-92db-4f06-a8e1-fcefe7517752', name: 'Glenn Maxwell',         runs: 22, balls: 15, fours: 1, sixes: 1, overs: 2, runsConceded: 16, econ: 8.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Marcus Stoinis: 4(6) — c Theekshana b Chameera. Bowled 4-0-46-2 (Perera c Ellis, K.Mendis c Connolly)
    { pid: 'fc46c6f8-8459-4634-8ce5-896688ae3d73', name: 'Marcus Stoinis',        runs: 4,  balls: 6,  fours: 0, sixes: 0, overs: 4, runsConceded: 46, econ: 11.50, wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // Cooper Connolly: 3(4) — c Perera b Theekshana. Bowled 3-0-27-0. Catch: K.Mendis c Connolly b Stoinis
    { pid: '7ac81336-1e8d-4669-916a-bdd64f4efd48', name: 'Cooper Connolly',       runs: 3,  balls: 4,  fours: 0, sixes: 0, overs: 3, runsConceded: 27, econ: 9.00,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Xavier Bartlett: 0(3) — run out (K.Mendis). Bowled 2-0-22-0
    { pid: '357ccbb4-e2e5-4780-8159-496b8ef108fa', name: 'Xavier Bartlett',       runs: 0,  balls: 3,  fours: 0, sixes: 0, overs: 2, runsConceded: 22, econ: 11.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Nathan Ellis: 0(2) — not out. Bowled 3-0-32-0. Catch: Perera c Ellis b Stoinis
    { pid: '5023ac85-6b6d-4013-b6c4-4607ce9b2a39', name: 'Nathan Ellis',          runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 3, runsConceded: 32, econ: 10.67, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Adam Zampa: 1(1) — run out (Kamindu/K.Mendis). Bowled 4-0-41-0
    { pid: '147047d1-0717-471e-9329-0b916344d0ce', name: 'Adam Zampa',            runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 4, runsConceded: 41, econ: 10.25, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

    // === SL BATTING (184/2, 18 ov) + BOWLING ===
    // Pathum Nissanka: 100*(52), 10x4, 5x6 — not out. Catch: Maxwell c Nissanka b Hemantha. MoM. CENTURY!
    { pid: '73d37545-f2cc-47b1-bb5b-101df7a116c9', name: 'Pathum Nissanka',       runs: 100, balls: 52, fours: 10, sixes: 5, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0, isMoM: true },
    // Kusal Perera: 1(3) — c Ellis b Stoinis. Catch: Connolly c Perera b Theekshana
    { pid: '212c738a-ca84-44a9-a507-bee597334904', name: 'Kusal Perera',          runs: 1,  balls: 3,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Kusal Mendis (wk): 51(38), 6x4, 1x6 — c Connolly b Stoinis. Stumping: Green st K.Mendis b Wellalage. RunOut: Bartlett run out (K.Mendis)
    { pid: '7b34f95f-265c-4c77-8e73-e6a4c1f13053', name: 'Kusal Mendis',         runs: 51, balls: 38, fours: 6, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 1, runOuts: 1 },
    // Pavan Rathnayake: 28(15), 6x4 — not out — NOT IN DB
    // Dasun Shanaka (c): DNB. Bowled 1.2-0-16-0
    { pid: 'f9a5da0b-91d5-466c-a3c0-842920583f6e', name: 'Dasun Shanaka',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 1, runsConceded: 16, econ: 12.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Kamindu Mendis: DNB. Bowled 2-0-19-1 (David c Hemantha b Kamindu). Catch: Head c Kamindu b Hemantha. RunOut: Zampa run out (Kamindu/K.Mendis)
    { pid: '3661bb86-d105-4ce0-8137-cc5d1163f709', name: 'Kamindu Mendis',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2, runsConceded: 19, econ: 9.50,  wickets: 1, catches: 1, stumpings: 0, runOuts: 1 },
    // Dushan Hemantha: DNB. Bowled 4-0-37-3 (Marsh, Head, Maxwell) — NOT IN DB
    // Dunith Wellalage: DNB. Bowled 4-0-33-1 (Green st K.Mendis b Wellalage). Catch: Inglis c Wellalage b Chameera
    { pid: 'cf59f01a-259f-4766-a682-a8e457ef056c', name: 'Dunith Wellalage',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 33, econ: 8.25,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Dushmantha Chameera: DNB. Bowled 4-0-36-2 (Inglis, Stoinis) — NOT IN DB
    // Maheesh Theekshana: DNB. Bowled 4-0-37-1 (Connolly c Perera b Theekshana). Catch: Stoinis c Theekshana b Chameera
    { pid: '0232e4df-19a4-446b-8ed5-c5c315a585ef', name: 'Maheesh Theekshana',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 37, econ: 9.25,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Matheesha Pathirana: DNB. Bowled 0.4-0-3-0 (less than 1 over, no econ bonus)
    { pid: '7eeba7a0-16f6-4afd-9625-6ad4123028d1', name: 'Matheesha Pathirana',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 3,  econ: 4.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  ],
};

// ============================================================
// Scoring function
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
      if (error) { console.log('    FAIL ' + s.player_id.slice(0, 8) + ' (' + m.players.find(p => p.pid === s.player_id)?.name + '): ' + error.message); fail++; }
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
  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name');
  const nameMap = {};
  for (const l of (lb || [])) nameMap[l.user_id] = l.display_name;

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

async function showLeaderboard() {
  console.log('\n========================================');
  console.log('FINAL LEADERBOARD');
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
  const matchId = process.argv[2];
  const matches = [m28, m29, m30];

  if (matchId) {
    const m = matches.find(x => x.matchId === matchId);
    if (!m) { console.log('Unknown match: ' + matchId); return; }
    await scoreMatch(m);
  } else {
    for (const m of matches) {
      await scoreMatch(m);
    }
  }
  await showLeaderboard();
})();
