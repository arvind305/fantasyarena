/**
 * Score wc_m24 through wc_m27 — Feb 14-15, 2026
 *
 * wc_m24: NZ 175/7 (20 ov) vs RSA 178/3 (17.1 ov) — RSA won by 7 wickets. Total: 353. MoM: Marco Jansen (4/40)
 * wc_m25: NEP 133/8 (20 ov) vs WI 134/1 (15.2 ov) — WI won by 9 wickets. Total: 267. MoM: Jason Holder (4/27)
 * wc_m26: USA 199/4 (20 ov) vs NAM 168/6 (20 ov) — USA won by 31 runs. Total: 367. MoM: Sanjay Krishnamurthi (68*)
 * wc_m27: IND 175/7 (20 ov) vs PAK 114/10 (18 ov) — IND won by 61 runs. Total: 289. MoM: Ishan Kishan (77)
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
// wc_m24: NZ vs RSA — RSA won by 7 wickets
// Side bet: "What will happen on the first ball of the match?" → Boundary (4 or 6)
// NOTE: RSA players Rickelton and Stubbs NOT in DB — skipped
// ============================================================
const m24 = {
  matchId: 'wc_m24',
  label: 'NZ vs RSA',
  winner: 'opt_wc_m24_winner_teamB', // RSA = teamB
  totalRuns: 353,
  manOfMatch: 'Marco Jansen',
  sideBetId: 'ae68b42c-bc3f-40ec-9f39-76de55c98848',
  sideBetAnswer: 'Boundary (4 or 6)',
  players: [
    // === NZ BATTING (175/7, 20 ov) + BOWLING ===
    { pid: '72f200aa-8beb-42ef-b5dd-a6494478688e', name: 'Tim Seifert',        runs: 13, balls: 9,  fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '5bd74887-e3cf-4af2-88f6-7b5bbb18d9ea', name: 'Finn Allen',         runs: 31, balls: 17, fours: 4, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '2e9080d3-406d-41f2-aba4-9ca3b2feafd7', name: 'Rachin Ravindra',    runs: 13, balls: 8,  fours: 1, sixes: 1, overs: 1, runsConceded: 9,  econ: 9.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Brevis c Mitchell b Ravindra
    { pid: 'f17e4c8a-fcda-4cc5-8e3c-8f1140d0f67a', name: 'Glenn Phillips',     runs: 1,  balls: 3,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'f30b6a2c-c9ff-4acb-8f06-0f22b1b4c1f8', name: 'Mark Chapman',       runs: 48, balls: 26, fours: 6, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'd7f70bb4-3be9-4fec-9f9e-0ee39c143e32', name: 'Daryl Mitchell',     runs: 32, balls: 24, fours: 2, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
    // Catches: Rickelton c Mitchell b Neesham, Brevis c Mitchell b Ravindra
    { pid: '431d3917-d53a-430d-973a-527ccc04ee88', name: 'Mitchell Santner',    runs: 4,  balls: 10, fours: 0, sixes: 0, overs: 4, runsConceded: 33, econ: 8.25,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'b04df15b-f357-4e5b-9f16-e83c769509ea', name: 'James Neesham',      runs: 23, balls: 15, fours: 3, sixes: 0, overs: 2, runsConceded: 15, econ: 7.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Rickelton c Mitchell b Neesham
    { pid: '32ef7a8b-93e2-48c2-860f-438371569f19', name: 'Matt Henry',          runs: 9,  balls: 8,  fours: 1, sixes: 0, overs: 4, runsConceded: 38, econ: 9.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '2bcfdf10-7782-4ef6-88d1-0f7582b5a1e4', name: 'Lockie Ferguson',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 33, econ: 10.42, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: de Kock b Ferguson (3.1 ov bowled, use 3 for overs)
    { pid: '10fc22f1-20c4-46eb-9da6-90b48d842978', name: 'Jacob Duffy',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 50, econ: 16.67, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB.

    // === RSA BATTING (178/3, 17.1 ov) + BOWLING ===
    // NOTE: Rickelton (21 off 11, 2c4, 1c6, 2 catches) and Stubbs (DNB, 1 catch) NOT in DB
    { pid: '135d571d-76a1-4ae9-ade2-5fd6d715f969', name: 'Aiden Markram',       runs: 86, balls: 44, fours: 8, sixes: 4, overs: 1, runsConceded: 15, econ: 15.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Not out. Catches: Allen c Markram b Jansen. Bowled 1-0-15-0.
    { pid: '97aa4f8d-6335-4a11-ac2f-d01f4e3ba395', name: 'Quinton de Kock',     runs: 20, balls: 14, fours: 3, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Seifert c de Kock b Jansen
    { pid: '84e54a31-e3c0-46d2-bea0-325482ee80ca', name: 'Dewald Brevis',       runs: 21, balls: 17, fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '67d44c6f-bf0f-411f-bf3a-95b55a094dd6', name: 'David Miller',        runs: 24, balls: 17, fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Not out. Catches: Ravindra c Miller b Jansen
    { pid: '704b5d24-fc03-4d79-a826-b554a75b809b', name: 'Marco Jansen',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 40, econ: 10.00, wickets: 4, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
    // DNB. Bowling: Seifert, Allen, Ravindra, Chapman
    { pid: 'cdbf512c-019b-43db-b0c9-d488412ad024', name: 'Corbin Bosch',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 34, econ: 8.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Santner c Rickelton b Bosch
    { pid: 'f878dff2-350e-4b0a-baf4-9b20971ec534', name: 'Kagiso Rabada',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 27, econ: 6.75,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB.
    { pid: 'fbc80297-2f75-4a4b-87df-c3a995a65dd6', name: 'Keshav Maharaj',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 24, econ: 8.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Phillips b Maharaj
    { pid: '3a3d11f5-0557-419b-80a2-e1094fa0d961', name: 'Lungi Ngidi',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 34, econ: 8.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Mitchell c Stubbs b Ngidi
  ],
};

// ============================================================
// wc_m25: NEP vs WI — WI won by 9 wickets
// Side bet: "Which team will score more runs in their respective powerplay?" → Team batting second
// NEP PP: 22/3, WI PP: 44/1
// ============================================================
const m25 = {
  matchId: 'wc_m25',
  label: 'WI vs NEP',
  winner: 'opt_wc_m25_winner_teamA', // WI = teamA
  totalRuns: 267,
  manOfMatch: 'Jason Holder',
  sideBetId: '76e83052-d7eb-4331-8918-ff778491e68a',
  sideBetAnswer: 'Team batting second',
  players: [
    // === NEP BATTING (133/8, 20 ov) + BOWLING ===
    { pid: '068d8f45-61fb-436a-8039-25762501bc74', name: 'Kushal Bhurtel',       runs: 1,  balls: 3,  fours: 0, sixes: 0, overs: 2, runsConceded: 18, econ: 9.00,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: King c Bhurtel b Yadav
    { pid: '4d06745a-4be9-44ed-8d02-ff6e2f922b36', name: 'Aasif Sheikh',        runs: 11, balls: 10, fours: 2, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '74b39989-2a0a-4f6f-afaf-913efa57f4a3', name: 'Rohit Paudel',        runs: 5,  balls: 7,  fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '699ddb1c-85db-4a8d-bc23-8c2cd76589f9', name: 'Dipendra Singh Airee',runs: 58, balls: 47, fours: 3, sixes: 3, overs: 3, runsConceded: 19, econ: 5.70,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: 3.2 ov, 19 runs. Econ = 19*6/20 = 5.70
    { pid: '4fce8ede-ca76-4177-b5c0-29eb042f15f9', name: 'Aarif Sheikh',        runs: 2,  balls: 8,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'c90e6d08-6c28-4184-b02f-2e82232b8b33', name: 'Lokesh Bam',          runs: 13, balls: 15, fours: 2, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'c7cf1179-5a12-45ce-9fac-22c7c3545e92', name: 'Gulshan Jha',         runs: 11, balls: 14, fours: 0, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'afb8cbb0-af58-4cf2-ae74-bc5901097454', name: 'Sompal Kami',          runs: 26, balls: 15, fours: 4, sixes: 0, overs: 2, runsConceded: 23, econ: 11.50, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Not out.
    { pid: 'd04d31f3-3e2e-4a5a-a3f6-e140ef3ac8d0', name: 'Karan KC',            runs: 1,  balls: 2,  fours: 0, sixes: 0, overs: 2, runsConceded: 12, econ: 6.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '694f62e3-eb61-4414-af51-bfacf6182ccf', name: 'Nandan Yadav',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 24, econ: 8.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: King c Bhurtel b Yadav
    { pid: '6489d997-6012-4a77-9e72-bbea3a7dc3fb', name: 'Sandeep Lamichhane',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 38, econ: 12.67, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB.

    // === WI BATTING (134/1, 15.2 ov) + BOWLING ===
    { pid: '3bb1ff6e-ed5a-4415-8306-7d276a37a25a', name: 'Brandon King',         runs: 22, balls: 17, fours: 4, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'bccfa95c-b051-4856-8e12-caeb622f98fe', name: 'Shai Hope',            runs: 61, balls: 44, fours: 5, sixes: 3, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Not out. WK. Catches: Bam c Hope b Joseph
    { pid: 'a3116e21-8583-4d12-979e-a3159afb7c6d', name: 'Shimron Hetmyer',      runs: 46, balls: 32, fours: 4, sixes: 2, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Not out. Catches: Aasif c Hetmyer b Holder
    { pid: '50d2e965-31c1-4207-b712-6e0af9a9c4d5', name: 'Roston Chase',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2, runsConceded: 10, econ: 5.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Jha b Chase
    { pid: '774a32cf-fe85-4ad4-b852-2aa1c2a20333', name: 'Sherfane Rutherford',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Did not bowl. No catches.
    { pid: '57583349-96bf-432e-97e1-67f2cbd421ce', name: 'Rovman Powell',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // DNB. Did not bowl. Catches: Airee c Powell b Holder
    { pid: '09b53484-fd99-4cf0-b1b2-966724be771f', name: 'Jason Holder',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 27, econ: 6.75,  wickets: 4, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
    // DNB. Bowling: Aasif, Airee, Aarif, KC
    { pid: '4699f74c-3930-4527-a642-deb161f6ab8e', name: 'Matthew Forde',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 10, econ: 2.50,  wickets: 1, catches: 2, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Paudel lbw b Forde. Catches: Aarif c Forde b Holder, KC c Forde b Holder
    { pid: '6dcca3bb-b148-459d-a18f-792f7da7b545', name: 'Akeal Hosein',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 30, econ: 7.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Bhurtel b Hosein
    { pid: '49208fef-0f52-4dca-9035-7af5633b8ccb', name: 'Gudakesh Motie',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2, runsConceded: 17, econ: 8.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB.
    { pid: 'c7806e08-a14e-48e5-8028-389cbf764354', name: 'Shamar Joseph',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 38, econ: 9.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Bam c Hope b Joseph
  ],
};

// ============================================================
// wc_m26: USA vs NAM — USA won by 31 runs
// Side bet: "Will a century be scored in this match?" → No
// ============================================================
const m26 = {
  matchId: 'wc_m26',
  label: 'USA vs NAM',
  winner: 'opt_wc_m26_winner_teamA', // USA = teamA
  totalRuns: 367,
  manOfMatch: 'Sanjay Krishnamurthi',
  sideBetId: '0ff00447-341c-4db7-9d6e-5a09b28a2c2f',
  sideBetAnswer: 'No',
  players: [
    // === USA BATTING (199/4, 20 ov) + BOWLING ===
    { pid: '4017255a-af7b-464c-8974-c93006d16b47', name: 'Monank Patel',          runs: 52, balls: 30, fours: 3, sixes: 3, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '4daa2c48-24be-41c4-bd2c-6567b8bdb402', name: 'Shayan Jahangir',       runs: 22, balls: 18, fours: 2, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
    // WK. Catches: Erasmus c Jahangir b van Schalkwyk, Smit c Jahangir b Ali Khan
    { pid: '3527cb41-2ba1-49fb-95d7-d20fdf2aeb18', name: 'Saiteja Mukkamala',     runs: 17, balls: 18, fours: 2, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'b4517739-0ef6-4786-b2be-7f9ab3bfaa9a', name: 'Sanjay Krishnamurthi',  runs: 68, balls: 33, fours: 4, sixes: 6, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
    // Not out.
    { pid: '4f336965-73e3-471f-aaf8-94ddc2542916', name: 'Milind Kumar',           runs: 28, balls: 20, fours: 1, sixes: 1, overs: 3, runsConceded: 27, econ: 9.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '79b335df-dcb6-4fc6-a980-7ebbb6ccff2e', name: 'Shubham Ranjane',        runs: 5,  balls: 2,  fours: 1, sixes: 0, overs: 1, runsConceded: 6,  econ: 6.00,  wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Not out. Bowling: Steenkamp c Mohsin b Ranjane. Catches: Loftie-Eaton c Ranjane b Netravalkar
    { pid: '3f179aa7-4fe1-4556-b710-fbd4ef60acb4', name: 'Ali Khan',               runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 43, econ: 10.75, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Smit c Jahangir b Ali Khan
    { pid: '21fb1036-850b-420f-a0ee-09974da87869', name: 'Shadley van Schalkwyk',  runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 30, econ: 7.50,  wickets: 2, catches: 1, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Frylinck c&b van Schalkwyk, Erasmus c Jahangir b van Schalkwyk. Catches: Frylinck c&b
    { pid: 'bca5c113-6714-40d6-b0ae-1e3922226c2b', name: 'Saurabh Netravalkar',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 27, econ: 6.75,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Loftie-Eaton c Ranjane b Netravalkar
    { pid: '3e392ac3-de68-42a0-9825-5e6e3f132364', name: 'Harmeet Singh',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 25, econ: 8.33,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB.
    { pid: 'fadd96cf-fa81-4b73-819f-b0164e9dca4e', name: 'Mohammad Mohsin',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 1, runsConceded: 10, econ: 10.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // DNB. Catches: Steenkamp c Mohsin b Ranjane

    // === NAM BATTING (168/6, 20 ov) + BOWLING ===
    { pid: 'dfac417d-8979-45d4-85fb-7ff054976f61', name: 'Louren Steenkamp',       runs: 58, balls: 39, fours: 5, sixes: 3, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '7ec40512-1fc1-455d-b731-e711e856d9e6', name: 'Jan Frylinck',            runs: 19, balls: 15, fours: 1, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '13e916b6-72e0-43df-8211-85568526ba3f', name: 'Jan Nicol Loftie-Eaton',  runs: 28, balls: 17, fours: 4, sixes: 0, overs: 1, runsConceded: 5,  econ: 5.00,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Mukkamalla c Loftie-Eaton b Erasmus
    { pid: '15068c87-21ad-4004-8509-d8247dfb33ec', name: 'Gerhard Erasmus',         runs: 6,  balls: 10, fours: 0, sixes: 0, overs: 3, runsConceded: 27, econ: 9.00,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Patel c Smit b Myburgh (wait — actually Erasmus bowled: Kumar c Smit b Erasmus, Mukkamalla c Loftie-Eaton b Erasmus)
    { pid: '2315a209-6258-4b3b-8dad-458766a1c00e', name: 'JJ Smit',                runs: 31, balls: 23, fours: 1, sixes: 1, overs: 3, runsConceded: 43, econ: 14.33, wickets: 0, catches: 3, stumpings: 0, runOuts: 0 },
    // Catches: Patel c Smit b Myburgh, Jahangir c Smit b Myburgh, Kumar c Smit b Erasmus
    { pid: 'ee91a9cc-9aa8-40cb-a3e4-0b658bbd7c46', name: 'Zane Green',              runs: 18, balls: 13, fours: 2, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // WK. Retired out.
    { pid: 'baba58ed-fe1f-4f96-b143-128f6322ca68', name: 'Ruben Trumpelmann',       runs: 3,  balls: 2,  fours: 0, sixes: 0, overs: 4, runsConceded: 52, econ: 13.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Not out.
    { pid: 'a1c9346e-12cd-45af-8534-92426eabf58d', name: 'Dylan Leicher',           runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // Not out.
    { pid: '9a5790a9-d870-416b-a93f-3df38c911922', name: 'WP Myburgh',              runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 22, econ: 5.50,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Patel, Jahangir
    { pid: '4f1fc19e-163b-4c5a-828b-544b2a822cb8', name: 'Bernard Scholtz',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4, runsConceded: 35, econ: 8.75,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB.
    { pid: '84a7d596-49c7-41ab-89d4-9cb7516f5050', name: 'Max Heingo',              runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 1, runsConceded: 12, econ: 12.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB.
  ],
};

// ============================================================
// wc_m27: IND vs PAK — IND won by 61 runs
// Side bet: "Will a half-century (50+) be scored in this match?" → Yes
// ============================================================
const m27 = {
  matchId: 'wc_m27',
  label: 'IND vs PAK',
  winner: 'opt_wc_m27_winner_teamA', // IND = teamA
  totalRuns: 289,
  manOfMatch: 'Ishan Kishan',
  sideBetId: 'e80f25f9-411f-4634-a418-48c3559a09a4',
  sideBetAnswer: 'Yes',
  players: [
    // === IND BATTING (175/7, 20 ov) + BOWLING ===
    { pid: '00f4c503-3020-48eb-811d-c021859b4172', name: 'Ishan Kishan',          runs: 77, balls: 40, fours: 10, sixes: 3, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 1, runOuts: 0, isMoM: true },
    // WK. Stumpings: Usman Khan st Kishan b Axar Patel
    { pid: '86b01728-3275-420a-a85b-a0e55682f1fe', name: 'Abhishek Sharma',       runs: 0,  balls: 4,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'e74b8e5c-dc3b-4850-be15-eb7f47a608d1', name: 'Tilak Varma',           runs: 25, balls: 24, fours: 2, sixes: 1, overs: 2, runsConceded: 11, econ: 5.50,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Shadab c Dube b Tilak
    { pid: 'e3fbffd0-751c-4a9c-9bb3-bf3229c032d9', name: 'Suryakumar Yadav',      runs: 32, balls: 29, fours: 3, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '2980b4bc-7484-446c-bba5-0a99479680db', name: 'Hardik Pandya',          runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 3, runsConceded: 16, econ: 5.33,  wickets: 2, catches: 1, stumpings: 0, runOuts: 0 },
    // Bowling: Farhan c Rinku b Pandya, Usman Tariq b Pandya. Catches: Salman c Pandya b Bumrah
    { pid: '4293e58a-7460-4724-bd00-be0cfd423b3a', name: 'Shivam Dube',            runs: 27, balls: 17, fours: 3, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
    // Catches: Shadab c Dube b Tilak, Nawaz c Dube b Kuldeep
    { pid: '5b33d2c3-790a-46a3-be7c-de05ae7b74e4', name: 'Rinku Singh',            runs: 11, balls: 4,  fours: 1, sixes: 1, overs: 1, runsConceded: 9,  econ: 9.00,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
    // Not out. Bowling: 1-0-9-0. Catches: Farhan c Rinku b Pandya, Faheem c Rinku b Varun
    { pid: '40e543f4-ca65-4b1a-b95a-96f44ac5ed58', name: 'Axar Patel',             runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 4, runsConceded: 29, econ: 7.25,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Babar b Axar, Usman Khan st Kishan b Axar
    { pid: '16241e2e-b5c9-4cd9-84ae-c3e998229301', name: 'Kuldeep Yadav',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 14, econ: 4.67,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Nawaz c Dube b Kuldeep
    { pid: 'dcb4ba76-40db-4ee8-af07-506fa0a54628', name: 'Varun Chakravarthy',     runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 17, econ: 5.67,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Faheem c Rinku b Varun, Abrar lbw b Varun
    { pid: '48b48fa6-106a-44a7-a6a2-6bb249d2aed6', name: 'Jasprit Bumrah',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2, runsConceded: 17, econ: 8.50,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
    // DNB. Bowling: Saim lbw b Bumrah, Salman c Pandya b Bumrah

    // === PAK BATTING (114/10, 18 ov) + BOWLING ===
    { pid: 'b1cc6fb0-1f33-4519-a994-6a3542c3b12c', name: 'Sahibzada Farhan',      runs: 0,  balls: 4,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '8897ac95-3160-43a2-afdf-a98ed645ab03', name: 'Saim Ayub',              runs: 6,  balls: 2,  fours: 0, sixes: 1, overs: 4, runsConceded: 25, econ: 6.25,  wickets: 3, catches: 2, stumpings: 0, runOuts: 0 },
    // Bowling: Kishan b Ayub, Tilak lbw b Ayub, Pandya c Babar b Ayub. Catches: SKY c Ayub b Tariq, Axar c Ayub b Shaheen
    { pid: '0d3eb97f-8707-4bb1-9a18-a1f53387a001', name: 'Salman Ali Agha',        runs: 4,  balls: 4,  fours: 1, sixes: 0, overs: 2, runsConceded: 10, econ: 5.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: Abhishek c Shaheen b Salman
    { pid: '7f063f49-853f-46ae-8501-7bf6f9df28d4', name: 'Babar Azam',             runs: 5,  balls: 7,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
    // Catches: Pandya c Babar b Saim Ayub
    { pid: '39c3f6ca-c36c-4a93-a9e7-95bf4d178fc6', name: 'Usman Khan',             runs: 44, balls: 34, fours: 6, sixes: 1, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    // WK. st Kishan b Axar
    { pid: '09c1111b-7110-4cfa-b2a7-3d6482926464', name: 'Shadab Khan',            runs: 14, balls: 15, fours: 1, sixes: 0, overs: 1, runsConceded: 17, econ: 17.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '82c98d2e-b2e0-42fc-a540-73d9f4f38fdd', name: 'Mohammad Nawaz',         runs: 4,  balls: 5,  fours: 1, sixes: 0, overs: 4, runsConceded: 28, econ: 7.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 1 },
    // Run out credit: Dube run out (Nawaz/Usman Khan)
    { pid: '6dbc36c4-c86d-46b6-b8a0-f2cd00abe82a', name: 'Faheem Ashraf',          runs: 10, balls: 14, fours: 1, sixes: 0, overs: 0, runsConceded: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: 'e97d7d7e-6c3f-4581-82c7-16629b6c5a8b', name: 'Shaheen Shah Afridi',    runs: 23, balls: 19, fours: 2, sixes: 1, overs: 2, runsConceded: 31, econ: 15.50, wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
    // Not out. Bowling: Axar c Ayub b Shaheen. Catches: Abhishek c Shaheen b Salman
    { pid: '307c272d-b959-467a-871b-2132d93f3e89', name: 'Abrar Ahmed',             runs: 0,  balls: 1,  fours: 0, sixes: 0, overs: 3, runsConceded: 38, econ: 12.67, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
    { pid: '338a9168-acbf-405a-be68-662193b36ea7', name: 'Usman Tariq',             runs: 0,  balls: 3,  fours: 0, sixes: 0, overs: 4, runsConceded: 24, econ: 6.00,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
    // Bowling: SKY c Ayub b Tariq
  ],
};

// ============================================================
// Scoring function (same as score-m23.js)
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
  const matches = [m24, m25, m26, m27];

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
