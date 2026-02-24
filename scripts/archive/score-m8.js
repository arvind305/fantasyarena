const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCH_ID = 'wc_m8';
const WINNER = 'opt_wc_m8_winner_teamA'; // ZIM = teamA
const TOTAL_RUNS = 209; // 103 + 106

// Parsed scorecard data
const playerStats = [
  // === OMAN BATTING + BOWLING + FIELDING ===
  { name: 'Aamir Kaleem',      team: 'OMAN', runs: 5,  balls: 7,  fours: 1, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Jatinder Singh',    team: 'OMAN', runs: 5,  balls: 5,  fours: 1, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Hammad Mirza',      team: 'OMAN', runs: 0,  balls: 5,  fours: 0, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Karan Sonavale',    team: 'OMAN', runs: 0,  balls: 6,  fours: 0, sixes: 0, overs: 0.3, econ: 12.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Wasim Ali',         team: 'OMAN', runs: 3,  balls: 8,  fours: 0, sixes: 0, overs: 2,   econ: 5.00,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { name: 'Sufyan Mehmood',    team: 'OMAN', runs: 25, balls: 39, fours: 2, sixes: 0, overs: 3,   econ: 4.00,  wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Vinayak Shukla',    team: 'OMAN', runs: 28, balls: 21, fours: 4, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { name: 'Jiten Ramanandi',   team: 'OMAN', runs: 1,  balls: 3,  fours: 0, sixes: 0, overs: 1,   econ: 9.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Nadeem Khan',       team: 'OMAN', runs: 20, balls: 18, fours: 1, sixes: 1, overs: 3,   econ: 9.30,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Shakeel Ahmed',     team: 'OMAN', runs: 4,  balls: 5,  fours: 0, sixes: 0, overs: 2,   econ: 13.50, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Shah Faisal',       team: 'OMAN', runs: 5,  balls: 2,  fours: 1, sixes: 0, overs: 2,   econ: 6.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },

  // === ZIMBABWE BATTING + BOWLING + FIELDING ===
  { name: 'Brian Bennett',       team: 'ZIM', runs: 48, balls: 36, fours: 7, sixes: 0, overs: 2,   econ: 9.00,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { name: 'Tadiwanashe Marumani',team: 'ZIM', runs: 21, balls: 11, fours: 5, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Dion Myers',          team: 'ZIM', runs: 0,  balls: 2,  fours: 0, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
  { name: 'Brendan Taylor',      team: 'ZIM', runs: 31, balls: 30, fours: 3, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 3, stumpings: 0, runOuts: 0 },
  { name: 'Sikandar Raza',       team: 'ZIM', runs: 5,  balls: 2,  fours: 1, sixes: 0, overs: 4,   econ: 4.25,  wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Tashinga Musekiwa',   team: 'ZIM', runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,   econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { name: 'Brad Evans',          team: 'ZIM', runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3.5, econ: 4.70,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Wellington Masakadza',team: 'ZIM', runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,   econ: 6.00,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Richard Ngarava',     team: 'ZIM', runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   econ: 4.25,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Blessing Muzarabani', team: 'ZIM', runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,   econ: 4.00,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
];

// Fantasy points calculation (from scoring RPC)
function calcFantasyPoints(p) {
  let pts = 0;
  pts += p.runs;                          // 1 point per run
  pts += p.fours * 10;                    // 10 points per four
  pts += p.sixes * 20;                    // 20 points per six
  if (p.balls > 0) {                      // Strike rate as points
    pts += Math.round((p.runs / p.balls) * 100);
  }
  pts += p.wickets * 20;                  // 20 points per wicket
  if (p.overs >= 1 && p.econ !== null) {  // Economy bonus
    if (p.econ <= 6) pts += 100;
    else if (p.econ <= 8) pts += 50;
    else if (p.econ <= 10) pts += 25;
  }
  pts += p.catches * 5;                   // 5 per catch
  pts += p.runOuts * 5;                   // 5 per run out
  pts += p.stumpings * 5;                 // 5 per stumping
  if (p.runs >= 100) pts += 200;          // Century bonus
  if (p.wickets >= 5) pts += 200;         // 5-wicket bonus
  return pts;
}

(async () => {
  // Get squad IDs for ZIM and OMAN
  const { data: squads } = await sb.from('squads').select('squad_id, team_code').in('team_code', ['ZIM', 'OMAN']);
  const squadMap = {};
  squads.forEach(s => { squadMap[s.team_code] = s.squad_id; });

  // Get all players for both squads
  const squadIds = squads.map(s => s.squad_id);
  const { data: dbPlayers, error: pErr } = await sb
    .from('players')
    .select('player_id, player_name, squad_id')
    .in('squad_id', squadIds);

  if (pErr) { console.error('Error fetching players:', pErr); return; }
  console.log('DB players for ZIM/OMAN: ' + dbPlayers.length);

  // Build lookup: squad_id -> team_code
  const squadToTeam = {};
  squads.forEach(s => { squadToTeam[s.squad_id] = s.team_code; });

  // Match scorecard names to DB player IDs
  function findPlayer(name, team) {
    const nameLower = name.toLowerCase().trim();
    const teamSquadId = squadMap[team];
    const teamPlayers = dbPlayers.filter(p => p.squad_id === teamSquadId);

    // Exact match
    let match = teamPlayers.find(p => p.player_name.toLowerCase() === nameLower);
    if (match) return match;

    // Last name match
    const parts = nameLower.split(' ');
    const lastName = parts[parts.length - 1];
    match = teamPlayers.find(p => p.player_name.toLowerCase().includes(lastName));
    if (match) return match;

    // First name match
    const firstName = parts[0];
    match = teamPlayers.find(p => p.player_name.toLowerCase().includes(firstName));
    return match;
  }

  // Check player_match_stats schema
  const { data: schemaCheck, error: schemaErr } = await sb.from('player_match_stats').select('*').limit(0);
  // Just get column info from an empty query - we'll use what we know from the scoring RPC

  // Calculate and display
  console.log('\n=== FANTASY POINTS CALCULATION ===');
  console.log('Player'.padEnd(25) + '| Team | Runs | Wkts | Cat | SR     | Econ  | Fantasy | DB Match');
  console.log('-'.repeat(110));

  const statsToInsert = [];
  let unmatchedCount = 0;

  for (const p of playerStats) {
    const fantasyPts = calcFantasyPoints(p);
    const dbPlayer = findPlayer(p.name, p.team);
    const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '—';

    console.log(
      p.name.padEnd(25) + '| ' +
      p.team.padEnd(5) + '| ' +
      String(p.runs).padStart(4) + ' | ' +
      String(p.wickets).padStart(4) + ' | ' +
      String(p.catches).padStart(3) + ' | ' +
      String(sr).padStart(6) + ' | ' +
      String(p.econ !== null ? p.econ.toFixed(2) : '—').padStart(5) + ' | ' +
      String(fantasyPts).padStart(7) + ' | ' +
      (dbPlayer ? dbPlayer.player_name + ' (' + dbPlayer.player_id.slice(0,8) + ')' : 'NOT FOUND')
    );

    if (!dbPlayer) {
      unmatchedCount++;
      continue;
    }

    statsToInsert.push({
      match_id: MATCH_ID,
      player_id: dbPlayer.player_id,
      runs: p.runs,
      balls_faced: p.balls,
      fours: p.fours,
      sixes: p.sixes,
      strike_rate: p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(2)) : 0,
      overs_bowled: p.overs >= 1 ? p.overs : (p.overs > 0 ? p.overs : 0),
      runs_conceded: p.econ !== null && p.overs > 0 ? Math.round(p.econ * p.overs) : 0,
      wickets: p.wickets,
      economy_rate: p.econ || 0,
      catches: p.catches,
      stumpings: p.stumpings,
      run_outs: p.runOuts,
      has_century: p.runs >= 100,
      has_five_wicket_haul: p.wickets >= 5,
      has_hat_trick: false,
      is_man_of_match: false,
      total_fantasy_points: fantasyPts
    });
  }

  if (unmatchedCount > 0) {
    console.log('\nWARNING: ' + unmatchedCount + ' players not found in DB — they will be skipped');
  }

  // Step 1: Insert player match stats
  console.log('\n=== INSERTING PLAYER MATCH STATS ===');
  await sb.from('player_match_stats').delete().eq('match_id', MATCH_ID);

  const { error: statsErr } = await sb
    .from('player_match_stats')
    .insert(statsToInsert);

  if (statsErr) {
    console.error('Error inserting stats:', statsErr);
    console.error('Attempting one-by-one to find the problem...');
    for (const stat of statsToInsert) {
      const { error: singleErr } = await sb.from('player_match_stats').insert(stat);
      if (singleErr) {
        console.error('  Failed: ' + stat.player_id.slice(0,8) + ' — ' + singleErr.message);
      }
    }
    return;
  }
  console.log('Inserted ' + statsToInsert.length + ' player stats');

  // Step 2: Insert/update match results
  console.log('\n=== INSERTING MATCH RESULTS ===');
  const { error: resultErr } = await sb
    .from('match_results')
    .upsert({
      match_id: MATCH_ID,
      winner: WINNER,
      total_runs: TOTAL_RUNS,
      completed_at: new Date().toISOString()
    }, { onConflict: 'match_id' });

  if (resultErr) {
    console.error('Error inserting results:', resultErr);
    return;
  }
  console.log('Match result saved: winner=' + WINNER + ', total_runs=' + TOTAL_RUNS);

  // Step 3: Update match_questions with correct answers
  await sb.from('match_questions').update({ correct_answer: WINNER }).eq('match_id', MATCH_ID).eq('kind', 'WINNER');
  await sb.from('match_questions').update({ correct_answer: String(TOTAL_RUNS) }).eq('match_id', MATCH_ID).eq('kind', 'TOTAL_RUNS');
  console.log('Match questions updated with correct answers');

  // Step 4: Score the match via RPC
  console.log('\n=== SCORING MATCH ===');
  const { data: scoreResult, error: scoreErr } = await sb
    .rpc('calculate_match_scores', { p_match_id: MATCH_ID, p_event_id: 't20wc_2026' });

  if (scoreErr) {
    console.error('Scoring error:', scoreErr);
    return;
  }
  console.log('Scoring result:', JSON.stringify(scoreResult));

  // Step 5: Show results
  console.log('\n=== FINAL SCORES FOR ' + MATCH_ID.toUpperCase() + ' ===');
  const { data: bets } = await sb
    .from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', MATCH_ID)
    .order('score', { ascending: false });

  const userIds = bets.map(b => b.user_id);
  const { data: users } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  console.log('User'.padEnd(22) + '| Score | Winner | Runs | Players | Side');
  console.log('-'.repeat(70));
  bets.forEach(b => {
    console.log(
      (nameMap[b.user_id] || b.user_id.slice(0,8)).padEnd(21) + ' | ' +
      String(b.score).padStart(5) + ' | ' +
      String(b.winner_points).padStart(6) + ' | ' +
      String(b.total_runs_points).padStart(4) + ' | ' +
      String(b.player_pick_points).padStart(7) + ' | ' +
      String(b.side_bet_points).padStart(4)
    );
  });

  // Show updated leaderboard
  const { data: lb } = await sb
    .from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false });

  console.log('\n=== LEADERBOARD AFTER M8 ===');
  (lb || []).forEach((u, i) => {
    console.log((i+1) + '. ' + u.display_name.padEnd(22) + ' | ' + u.total_score + ' pts | ' + u.matches_played + ' matches');
  });
})();
