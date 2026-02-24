/**
 * Score wc_m40: AUS vs OMAN
 * Result: AUS won (chased 105 in 9.4 overs)
 * Total runs: 104 + 108 = 212
 * Total wickets: 10 + 1 = 11
 * MoM: Adam Zampa (4/21)
 */
require('dotenv').config({path:'ui/.env'});
require('dotenv').config();
const {createClient} = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MATCH_ID = 'wc_m40';
const EVENT_ID = 't20wc_2026';

// Player IDs from DB
const AUS = {
  'Adam Zampa':       '147047d1-0717-471e-9329-0b916344d0ce',
  'Cameron Green':    '8421a5d0-91c1-4e4b-b966-f4266322b9a0',
  'Glenn Maxwell':    'f7851482-92db-4f06-a8e1-fcefe7517752',
  'Josh Inglis':      '2abe4511-befd-4497-94e7-6a680d69e703',
  'Marcus Stoinis':   'fc46c6f8-8459-4634-8ce5-896688ae3d73',
  'Mitchell Marsh':   '03649be4-88cd-48ae-89bc-a203a300cb2a',
  'Nathan Ellis':     '5023ac85-6b6d-4013-b6c4-4607ce9b2a39',
  'Travis Head':      '1c75176d-3750-4628-adf5-6f6065d6fb93',
  'Xavier Bartlett':  '357ccbb4-e2e5-4780-8159-496b8ef108fa',
  'Tim David':        '9e57bc63-fbca-4ca5-98c8-78137d5e9aa0',
  'Matt Renshaw':     '604dc74c-bc4f-4abe-ba43-cfb7f64acd95',
  'Ben Dwarshuis':    '70a5f69a-6e22-495b-859f-a63e60ce79b1',
  'Cooper Connolly':  '7ac81336-1e8d-4669-916a-bdd64f4efd48',
  'Steve Smith':      '78fcad0f-f7da-4c8e-adcd-bd403bfc3020',
  'Matthew Kuhnemann':'587f0701-b024-4de4-91a4-31f352a14d20',
};

const OMAN = {
  'Aamir Kaleem':     'e1c047b7-cca0-4b61-bdef-dd8d5350eea3',
  'Jatinder Singh':   '1f1aef9f-4fb9-448d-a64c-854317fc6d78',
  'Karan Sonavale':   '967b20f6-f73e-405c-8f78-071f4491fe66',
  'Hammad Mirza':     'f9092b2d-5815-48d9-bf20-9b24f786febe',
  'Wasim Ali':        '22391649-9b78-49f9-84cb-4773d0aac57f',
  'Mohammad Nadeem':  'ad7b641b-6308-459b-8e70-c34c055f0abe',
  'Vinayak Shukla':   '010dab20-5432-47de-899d-c95c39743c35',
  'Jiten Ramanandi':  'a0a91c86-5171-469a-8303-09ee69c6d7c3',
  'Shakeel Ahmed':    '07928e72-0b57-47e6-80d9-87921ccbe956',
  'Jay Odedra':       '59150c7c-e685-4bd7-8339-79d4dc19852c',
  'Shafiq Jan':       '359ac11e-e5a0-41cf-9a6e-692659b153a9',
};

// Player stats from scorecard
// Format: { runs, balls_faced, fours, sixes, wickets, overs_bowled, runs_conceded, catches, is_man_of_match, ... }
const playerStats = {
  // === OMAN BATTING + BOWLING ===
  [OMAN['Aamir Kaleem']]: {
    runs: 0, balls_faced: 1, fours: 0, sixes: 0,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [OMAN['Jatinder Singh']]: {
    runs: 17, balls_faced: 15, fours: 3, sixes: 0,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [OMAN['Karan Sonavale']]: {
    runs: 12, balls_faced: 11, fours: 2, sixes: 0,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [OMAN['Hammad Mirza']]: {
    runs: 16, balls_faced: 13, fours: 1, sixes: 1,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [OMAN['Wasim Ali']]: {
    runs: 32, balls_faced: 33, fours: 4, sixes: 0,
    wickets: 0, overs_bowled: 1, runs_conceded: 18, catches: 0,
  },
  [OMAN['Mohammad Nadeem']]: {
    runs: 2, balls_faced: 3, fours: 0, sixes: 0,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [OMAN['Vinayak Shukla']]: {
    runs: 9, balls_faced: 8, fours: 1, sixes: 0,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [OMAN['Jiten Ramanandi']]: {
    runs: 1, balls_faced: 3, fours: 0, sixes: 0,
    wickets: 0, overs_bowled: 0.4, runs_conceded: 10, catches: 0,
  },
  [OMAN['Shakeel Ahmed']]: {
    runs: 3, balls_faced: 7, fours: 0, sixes: 0,
    wickets: 1, overs_bowled: 4, runs_conceded: 29, catches: 0,
  },
  [OMAN['Jay Odedra']]: {
    runs: 4, balls_faced: 3, fours: 1, sixes: 0,
    wickets: 0, overs_bowled: 2, runs_conceded: 21, catches: 0,
  },
  [OMAN['Shafiq Jan']]: {
    runs: 0, balls_faced: 1, fours: 0, sixes: 0,
    wickets: 0, overs_bowled: 2, runs_conceded: 30, catches: 0,
  },

  // === AUS BATTING + BOWLING ===
  [AUS['Mitchell Marsh']]: {
    runs: 64, balls_faced: 33, fours: 7, sixes: 4,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [AUS['Travis Head']]: {
    runs: 32, balls_faced: 19, fours: 6, sixes: 0,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [AUS['Josh Inglis']]: {
    runs: 12, balls_faced: 6, fours: 2, sixes: 0,
    wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0,
  },
  [AUS['Xavier Bartlett']]: {
    runs: 0, balls_faced: 0, fours: 0, sixes: 0,
    wickets: 2, overs_bowled: 4, runs_conceded: 27, catches: 1,
    // caught Shakeel Ahmed off Zampa's bowling
  },
  [AUS['Marcus Stoinis']]: {
    runs: 0, balls_faced: 0, fours: 0, sixes: 0,
    wickets: 1, overs_bowled: 2, runs_conceded: 16, catches: 0,
  },
  [AUS['Nathan Ellis']]: {
    runs: 0, balls_faced: 0, fours: 0, sixes: 0,
    wickets: 1, overs_bowled: 2, runs_conceded: 14, catches: 0,
  },
  [AUS['Cameron Green']]: {
    runs: 0, balls_faced: 0, fours: 0, sixes: 0,
    wickets: 0, overs_bowled: 2, runs_conceded: 11, catches: 1,
    // caught Vinayak Shukla off Stoinis bowling → catch goes to Green
  },
  [AUS['Adam Zampa']]: {
    runs: 0, balls_faced: 0, fours: 0, sixes: 0,
    wickets: 4, overs_bowled: 3.2, runs_conceded: 21, catches: 0,
    is_man_of_match: true,
  },
  [AUS['Glenn Maxwell']]: {
    runs: 0, balls_faced: 0, fours: 0, sixes: 0,
    wickets: 2, overs_bowled: 3, runs_conceded: 13, catches: 0,
  },
  // DNB players who played (fielding only — no bat/bowl stats)
  [AUS['Tim David']]:       { runs: 0, balls_faced: 0, fours: 0, sixes: 0, wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0 },
  [AUS['Matt Renshaw']]:    { runs: 0, balls_faced: 0, fours: 0, sixes: 0, wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0 },
  [AUS['Ben Dwarshuis']]:   { runs: 0, balls_faced: 0, fours: 0, sixes: 0, wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0 },
  [AUS['Cooper Connolly']]: { runs: 0, balls_faced: 0, fours: 0, sixes: 0, wickets: 0, overs_bowled: 0, runs_conceded: 0, catches: 0 },
};

// Side bet answer
const SIDE_BET_ID = '5ee0ac06-285b-4c4b-a546-80b4eb98009f';
const SIDE_BET_ANSWER = '9-12'; // 11 total wickets

async function run() {
  console.log('=== SCORING wc_m40: AUS vs OMAN ===\n');

  // Step 1: Save match results
  console.log('Step 1: Saving match results...');
  const { error: resErr } = await supabase
    .from('match_results')
    .upsert({
      match_id: MATCH_ID,
      winner: 'opt_wc_m40_winner_teamA',
      total_runs: 212,
      side_bet_answers: { [SIDE_BET_ID]: SIDE_BET_ANSWER },
      man_of_match: 'Adam Zampa',
      completed_at: new Date().toISOString(),
    }, { onConflict: 'match_id' });
  if (resErr) { console.error('Error saving results:', resErr); return; }
  console.log('  Winner: AUS (opt_wc_m40_winner_teamA)');
  console.log('  Total runs: 212');
  console.log('  MoM: Adam Zampa');
  console.log('  Side bet (wickets): 9-12 (actual: 11)');

  // Set correct_answer on side_bets table
  await supabase.from('side_bets').update({ correct_answer: SIDE_BET_ANSWER }).eq('side_bet_id', SIDE_BET_ID);

  // Update match status to LOCKED (if not already)
  await supabase.from('match_config').update({ status: 'LOCKED' }).eq('match_id', MATCH_ID);
  console.log('  Match status → LOCKED\n');

  // Step 2: Insert player stats
  console.log('Step 2: Inserting player stats...');
  const rows = Object.entries(playerStats).map(([playerId, s]) => {
    const ballsFaced = s.balls_faced || 0;
    const runs = s.runs || 0;
    const oversB = s.overs_bowled || 0;
    const runsConceded = s.runs_conceded || 0;

    return {
      match_id: MATCH_ID,
      player_id: playerId,
      runs,
      balls_faced: ballsFaced,
      fours: s.fours || 0,
      sixes: s.sixes || 0,
      strike_rate: ballsFaced > 0 ? Math.round((runs / ballsFaced) * 10000) / 100 : 0,
      wickets: s.wickets || 0,
      overs_bowled: oversB,
      runs_conceded: runsConceded,
      economy_rate: oversB > 0 ? Math.round((runsConceded / oversB) * 100) / 100 : 0,
      catches: s.catches || 0,
      run_outs: s.run_outs || 0,
      stumpings: s.stumpings || 0,
      is_man_of_match: s.is_man_of_match || false,
      has_century: (s.runs || 0) >= 100,
      has_five_wicket_haul: (s.wickets || 0) >= 5,
      has_hat_trick: s.has_hat_trick || false,
    };
  });

  const { error: statsErr } = await supabase
    .from('player_match_stats')
    .upsert(rows, { onConflict: 'match_id,player_id' });
  if (statsErr) { console.error('Error inserting stats:', statsErr); return; }
  console.log(`  Inserted ${rows.length} player stats rows`);

  // Verify key players
  const keyPlayers = [
    'Mitchell Marsh', 'Travis Head', 'Adam Zampa', 'Glenn Maxwell',
    'Marcus Stoinis', 'Nathan Ellis', 'Xavier Bartlett', 'Hammad Mirza',
  ];
  for (const name of keyPlayers) {
    const id = AUS[name] || OMAN[name];
    const s = playerStats[id];
    const fp = (s.runs || 0) + (s.fours || 0) * 10 + (s.sixes || 0) * 20
      + (s.wickets || 0) * 20 + (s.catches || 0) * 5
      + ((s.runs || 0) >= 100 ? 200 : 0) + ((s.wickets || 0) >= 5 ? 200 : 0)
      + (s.is_man_of_match ? 200 : 0);
    console.log(`  ${name}: ${s.runs}r ${s.fours}x4 ${s.sixes}x6 ${s.wickets}w ${s.catches}c ${s.is_man_of_match ? 'MoM' : ''} → ~${fp} fantasy pts`);
  }

  // Step 3: Calculate player points + score bets
  console.log('\nStep 3: Triggering scoring RPC...');
  const { data: ppData, error: ppErr } = await supabase.rpc('calculate_all_player_points', { p_match_id: MATCH_ID });
  if (ppErr) { console.error('Error calculating player points:', ppErr); return; }
  console.log('  Player points calculated');

  const { data: scoreData, error: scoreErr } = await supabase.rpc('calculate_match_scores', {
    p_match_id: MATCH_ID,
    p_event_id: EVENT_ID,
  });
  if (scoreErr) { console.error('Error scoring:', scoreErr); return; }
  console.log('  Scoring complete:', JSON.stringify(scoreData));

  // Step 4: Verify - check leaderboard
  console.log('\nStep 4: Verifying leaderboard...');
  const { data: lb } = await supabase
    .from('leaderboard')
    .select('user_id, total_score, rank')
    .eq('event_id', EVENT_ID)
    .order('rank');

  const { data: users } = await supabase.from('users').select('user_id, display_name');
  const userMap = {};
  (users || []).forEach(u => { userMap[u.user_id] = u.display_name; });

  console.log('\n  Rank | User                  | Total Score');
  console.log('  -----|----------------------|------------');
  (lb || []).forEach(r => {
    console.log(`  ${String(r.rank).padStart(4)} | ${(userMap[r.user_id] || r.user_id).substring(0,20).padEnd(20)} | ${r.total_score}`);
  });

  // Step 5: Check individual bet scores for this match
  console.log('\n=== BET SCORES FOR wc_m40 ===');
  const { data: bets } = await supabase.from('bets').select('user_id, score, answers, player_picks, side_bet_answers').eq('match_id', MATCH_ID);
  (bets || []).forEach(b => {
    const name = userMap[b.user_id] || b.user_id;
    console.log(`  ${name}: score=${b.score}`);
  });

  console.log('\nDone!');
}

run().catch(console.error);
