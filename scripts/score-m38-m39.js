/**
 * Score M38 (SL vs ZIM) and M39 (AFG vs CAN)
 *
 * M38: ZIM won, MoM Sikandar Raza, Total 360 (178+182)
 *   Side bet: death overs (16-20) 1st inn = ~56 runs → "51-70"
 * M39: AFG won, MoM Ibrahim Zadran, Total 318 (200+118)
 *   Side bet: wickets in 1st inn powerplay = 2 → "2"
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fantasy points formula (mirrors DB function)
function calcFP(s) {
  let pts = 0;
  pts += (s.runs || 0);
  pts += (s.fours || 0) * 10;
  pts += (s.sixes || 0) * 20;
  if ((s.balls_faced || 0) > 0) {
    const sr = ((s.runs || 0) / (s.balls_faced || 1)) * 100;
    pts += Math.round(sr);
  }
  pts += (s.wickets || 0) * 20;
  if ((s.overs_bowled || 0) > 0) {
    const eco = (s.runs_conceded || 0) / (s.overs_bowled || 1);
    if (eco <= 6) pts += 100;
    else if (eco <= 8) pts += 50;
    else if (eco <= 10) pts += 25;
  }
  pts += (s.catches || 0) * 5;
  pts += (s.run_outs || 0) * 5;
  pts += (s.stumpings || 0) * 5;
  if (s.has_century) pts += 200;
  if (s.has_five_wicket_haul) pts += 200;
  if (s.has_hat_trick) pts += 200;
  if (s.is_man_of_match) pts += 200;
  return pts;
}

// Player IDs from DB
const P = {
  // SL
  nissanka:    '73d37545-f2cc-47b1-bb5b-101df7a116c9',
  kPerera:     '212c738a-ca84-44a9-a507-bee597334904',
  kMendis:     '7b34f95f-265c-4c77-8e73-e6a4c1f13053',
  rathnayake:  '7ac8bc50-8ca1-4936-8c40-33cc341338df',
  kamindu:     '3661bb86-d105-4ce0-8137-cc5d1163f709',
  shanaka:     'f9a5da0b-91d5-466c-a3c0-842920583f6e',
  wellalage:   'cf59f01a-259f-4766-a682-a8e457ef056c',
  hemantha:    '1c4a3523-8d73-48db-a87b-b533d7bca0c8',
  theekshana:  '0232e4df-19a4-446b-8ed5-c5c315a585ef',
  madushanka:  '8d286875-d813-41b4-a385-1845f4b87abc',
  madushan:    '6668519e-bd68-41a0-b7c7-b21026a5711f',
  // ZIM
  bennett:     'd29ed31e-1273-4c85-b41d-620ce3346f43',
  marumani:    'ba145648-8522-41cd-8d6c-d0661e157e8a',
  burl:        'ea5d51b6-51c8-40d5-a99e-747262504a57',
  raza:        '22c9211a-456d-4991-885f-d9894900f8de',
  musekiwa:    'aca42505-189c-4e9e-b805-e3b5d742104e',
  munyonga:    'b3293066-687c-4df7-b4f1-01ea79c815a1',
  muzarabani:  'b30f4347-3e41-4fad-a42f-0b3cc459f491',
  masakadza:   'a64083eb-bd1d-4849-941d-d516cfba48bf',
  bEvans:      'a19c6877-7cd4-4a3a-b4cc-90273aa0bdce',
  cremer:      '15e1cddd-0323-4e1f-b512-90e2ff562819',
  myers:       '00fc8bb4-ab72-4ab5-b25c-6817e1c39b20',
  // AFG
  gurbaz:      'e3e62b5d-4870-426f-bd1b-02ea1c46ca89',
  iZadran:     '51211070-9cb6-4a3f-ae5e-b2942e48bb98',
  naib:        '7160b6a0-c7f8-40c5-b5e4-a2c082e144cf',
  atal:        'a2d62f67-d8ed-4223-b674-8cb6b615ad19',
  omarzai:     'f3b15726-d5e4-4c12-b970-afbe36b1cb1f',
  rasooli:     '5d1a02fe-feea-47fe-8347-05a3c88ef0f2',
  nabi:        '548ba945-68ff-4c5e-a8d2-eda82106cee4',
  rashid:      '397b4521-6d80-481c-8492-0c32358ea194',
  mujeeb:      '00825a0f-f20e-4bf1-a15e-a888eb0cf6d2',
  sharifi:     '028d27f1-4e35-41fa-865b-cd6e49526128',
  ahmadzai:    '53b6f42d-8346-4069-9509-9fd87dc193cd',
  // CAN
  samra:       '0c1bcebc-d5e9-400f-8719-d2f3ca56404d',
  bajwa:       'dd4a9951-79a9-4eb6-b47e-8ff0e3f95670',
  dhaliwal:    '20c91435-f8b9-4e10-8dde-42f1969814db',
  thaker:      '944b660b-4f52-4d6d-9b8d-fa15cdcb4d32',
  kirton:      'c810146d-a88f-43f1-97e3-27b038be655b',
  movva:       'bc7f39e8-a41d-40db-98c5-41f379e1fdf9',
  saadBZ:      '8af61d05-9a0b-4902-9a13-c97c3008095b',
  heyliger:    'be33276f-b261-4a36-8066-5874d239fbb2',
  jaskaran:    '5f6241d3-a7dc-4b3d-8864-864e14b14e8b',
  anshPatel:   '6b546382-db71-4e42-a28c-32b6ab3b6a34',
  kaleemSana:  'd1237260-5c39-457b-ac7e-bc028ece252f',
};

// ===================== M38: SL vs ZIM =====================
const m38Stats = [
  // SL Batting + Bowling + Fielding
  { match_id:'wc_m38', player_id:P.nissanka, runs:62, balls_faced:41, fours:8, sixes:0, strike_rate:151.22, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.kPerera, runs:22, balls_faced:14, fours:4, sixes:0, strike_rate:157.14, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.kMendis, runs:14, balls_faced:20, fours:0, sixes:0, strike_rate:70.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.rathnayake, runs:44, balls_faced:25, fours:3, sixes:2, strike_rate:176.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.kamindu, runs:7, balls_faced:5, fours:1, sixes:0, strike_rate:140.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.shanaka, runs:6, balls_faced:7, fours:0, sixes:0, strike_rate:85.71, wickets:1, overs_bowled:3, runs_conceded:26, economy_rate:8.67, catches:2, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.wellalage, runs:15, balls_faced:8, fours:3, sixes:0, strike_rate:187.50, wickets:1, overs_bowled:4, runs_conceded:27, economy_rate:6.75, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.hemantha, runs:0, balls_faced:1, fours:0, sixes:0, strike_rate:0.00, wickets:2, overs_bowled:4, runs_conceded:36, economy_rate:9.00, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.theekshana, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:3.5, runs_conceded:47, economy_rate:13.43, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.madushanka, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:3, runs_conceded:20, economy_rate:6.67, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.madushan, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:2, runs_conceded:23, economy_rate:11.50, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  // ZIM Batting + Bowling + Fielding
  { match_id:'wc_m38', player_id:P.bennett, runs:63, balls_faced:48, fours:8, sixes:0, strike_rate:131.25, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.marumani, runs:34, balls_faced:26, fours:5, sixes:1, strike_rate:130.77, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:1, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.burl, runs:23, balls_faced:12, fours:2, sixes:1, strike_rate:191.67, wickets:1, overs_bowled:2, runs_conceded:16, economy_rate:8.00, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.raza, runs:45, balls_faced:26, fours:2, sixes:4, strike_rate:173.08, wickets:0, overs_bowled:4, runs_conceded:36, economy_rate:9.00, catches:0, run_outs:0, stumpings:0, is_man_of_match:true, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.musekiwa, runs:1, balls_faced:2, fours:0, sixes:0, strike_rate:50.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.munyonga, runs:8, balls_faced:3, fours:0, sixes:1, strike_rate:266.67, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.muzarabani, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:2, overs_bowled:4, runs_conceded:38, economy_rate:9.50, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.masakadza, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:3, runs_conceded:23, economy_rate:7.67, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.bEvans, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:2, overs_bowled:3, runs_conceded:35, economy_rate:11.67, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.cremer, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:2, overs_bowled:4, runs_conceded:27, economy_rate:6.75, catches:3, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m38', player_id:P.myers, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
];

// ===================== M39: AFG vs CAN =====================
const m39Stats = [
  // AFG Batting + Bowling + Fielding
  { match_id:'wc_m39', player_id:P.gurbaz, runs:30, balls_faced:20, fours:5, sixes:0, strike_rate:150.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.iZadran, runs:95, balls_faced:56, fours:7, sixes:5, strike_rate:169.64, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:1, run_outs:0, stumpings:0, is_man_of_match:true, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.naib, runs:1, balls_faced:2, fours:0, sixes:0, strike_rate:50.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.atal, runs:44, balls_faced:32, fours:2, sixes:2, strike_rate:137.50, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.omarzai, runs:13, balls_faced:7, fours:0, sixes:1, strike_rate:185.71, wickets:1, overs_bowled:2, runs_conceded:18, economy_rate:9.00, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.rasooli, runs:4, balls_faced:4, fours:0, sixes:0, strike_rate:100.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.nabi, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:4, overs_bowled:4, runs_conceded:7, economy_rate:1.75, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.rashid, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:2, overs_bowled:4, runs_conceded:19, economy_rate:4.75, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.mujeeb, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:1, overs_bowled:4, runs_conceded:23, economy_rate:5.75, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.sharifi, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:3, runs_conceded:24, economy_rate:8.00, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.ahmadzai, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:3, runs_conceded:22, economy_rate:7.33, catches:2, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  // CAN Batting + Bowling + Fielding
  { match_id:'wc_m39', player_id:P.samra, runs:17, balls_faced:14, fours:3, sixes:0, strike_rate:121.43, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.bajwa, runs:13, balls_faced:7, fours:0, sixes:2, strike_rate:185.71, wickets:0, overs_bowled:3, runs_conceded:18, economy_rate:6.00, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.dhaliwal, runs:0, balls_faced:5, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.thaker, runs:30, balls_faced:24, fours:3, sixes:1, strike_rate:125.00, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.kirton, runs:10, balls_faced:12, fours:2, sixes:0, strike_rate:83.33, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.movva, runs:2, balls_faced:6, fours:0, sixes:0, strike_rate:33.33, wickets:0, overs_bowled:0, runs_conceded:0, economy_rate:null, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.saadBZ, runs:28, balls_faced:26, fours:3, sixes:1, strike_rate:107.69, wickets:0, overs_bowled:3, runs_conceded:35, economy_rate:11.67, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.heyliger, runs:3, balls_faced:8, fours:0, sixes:0, strike_rate:37.50, wickets:1, overs_bowled:4, runs_conceded:41, economy_rate:10.25, catches:1, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.jaskaran, runs:7, balls_faced:13, fours:0, sixes:1, strike_rate:53.85, wickets:3, overs_bowled:4, runs_conceded:52, economy_rate:13.00, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.anshPatel, runs:2, balls_faced:5, fours:0, sixes:0, strike_rate:40.00, wickets:0, overs_bowled:3, runs_conceded:24, economy_rate:8.00, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
  { match_id:'wc_m39', player_id:P.kaleemSana, runs:0, balls_faced:0, fours:0, sixes:0, strike_rate:0.00, wickets:0, overs_bowled:3, runs_conceded:23, economy_rate:7.67, catches:0, run_outs:0, stumpings:0, is_man_of_match:false, has_century:false, has_five_wicket_haul:false, has_hat_trick:false },
];

async function scoreMatch(matchId, winner, totalRuns, sideBetId, sideBetAnswer, stats) {
  console.log(`\n========== Scoring ${matchId} ==========`);

  // Calculate and set fantasy points for each player
  for (const s of stats) {
    s.total_fantasy_points = calcFP(s);
  }

  // Print top 5 for verification
  const sorted = [...stats].sort((a, b) => b.total_fantasy_points - a.total_fantasy_points);
  console.log('Top 5 fantasy scorers:');
  sorted.slice(0, 5).forEach(s => {
    const id = Object.entries(P).find(([k, v]) => v === s.player_id)?.[0] || s.player_id;
    console.log(`  ${id}: ${s.total_fantasy_points} pts`);
  });

  // 1. Insert match_results
  console.log('\n1. Inserting match_results...');
  const { error: resErr } = await supabase.from('match_results').upsert({
    match_id: matchId,
    winner: winner,
    total_runs: totalRuns,
  }, { onConflict: 'match_id' });
  if (resErr) { console.error('match_results error:', resErr); return; }
  console.log('   Done.');

  // 2. Update side bet correct answer
  console.log('2. Setting side bet answer...');
  const { error: sbErr } = await supabase.from('side_bets')
    .update({ correct_answer: sideBetAnswer })
    .eq('side_bet_id', sideBetId);
  if (sbErr) { console.error('side_bets error:', sbErr); return; }
  console.log(`   Side bet answer: ${sideBetAnswer}`);

  // 3. Insert player_match_stats
  console.log('3. Inserting player_match_stats...');
  // Delete existing stats first (in case of re-run)
  await supabase.from('player_match_stats').delete().eq('match_id', matchId);
  const { error: psErr } = await supabase.from('player_match_stats').insert(stats);
  if (psErr) { console.error('player_match_stats error:', psErr); return; }
  console.log(`   Inserted ${stats.length} player records.`);

  // 4. Calculate player fantasy points via RPC
  console.log('4. Calculating player fantasy points via RPC...');
  const { error: fpErr } = await supabase.rpc('calculate_all_player_points', { p_match_id: matchId });
  if (fpErr) { console.error('calculate_all_player_points error:', fpErr); return; }
  console.log('   Done.');

  // 5. Score all bets via RPC
  console.log('5. Scoring bets via RPC...');
  const { data: scoreData, error: scErr } = await supabase.rpc('calculate_match_scores', {
    p_match_id: matchId,
    p_event_id: 't20wc_2026',
  });
  if (scErr) { console.error('calculate_match_scores error:', scErr); return; }
  console.log('   Result:', scoreData);

  // 6. Update match status to SCORED
  console.log('6. Updating match status to SCORED...');
  const { error: stErr } = await supabase.from('match_config')
    .update({ status: 'SCORED' })
    .eq('match_id', matchId);
  if (stErr) { console.error('status update error:', stErr); return; }
  console.log('   Done.');

  // 7. Verify - check bet scores
  console.log('7. Verifying bet scores...');
  const { data: bets } = await supabase.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', matchId);
  if (bets) {
    bets.forEach(b => {
      console.log(`   User ${b.user_id.substring(0, 8)}...: score=${b.score}, winner=${b.winner_points}, runs=${b.total_runs_points}, player=${b.player_pick_points}, side=${b.side_bet_points}`);
    });
  }

  console.log(`\n${matchId} SCORED SUCCESSFULLY.`);
}

async function main() {
  // Score M38: SL vs ZIM — ZIM won
  await scoreMatch(
    'wc_m38',
    'opt_wc_m38_winner_teamB',  // ZIM
    360,                         // 178 + 182
    '10db9ce5-6f40-4e63-855a-e7431cf9da4d',  // side bet ID
    '51-70',                     // death overs runs in 1st innings
    m38Stats
  );

  // Score M39: AFG vs CAN — AFG won
  await scoreMatch(
    'wc_m39',
    'opt_wc_m39_winner_teamA',  // AFG
    318,                         // 200 + 118
    '9e525321-ed07-49b3-8e27-d1401b11f784',  // side bet ID
    '2',                         // wickets in 1st inn powerplay
    m39Stats
  );

  // Final leaderboard check
  console.log('\n========== LEADERBOARD (Top 15) ==========');
  const { data: lb } = await supabase.from('leaderboard')
    .select('rank, display_name, total_score, matches_played')
    .order('rank', { ascending: true })
    .limit(15);
  if (lb) {
    lb.forEach(r => console.log(`  #${r.rank} ${r.display_name}: ${r.total_score} pts (${r.matches_played} matches)`));
  }
}

main().catch(err => console.error('FATAL:', err));
