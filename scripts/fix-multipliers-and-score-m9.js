const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

// ==========================================
// M9 SCORECARD: RSA vs CAN — RSA won, 369 total runs
// ==========================================
const M9_MATCH_ID = 'wc_m9';
const M9_WINNER = 'opt_wc_m9_winner_teamA'; // RSA = teamA
const M9_TOTAL_RUNS = 369; // 213 + 156

const m9PlayerStats = [
  // === RSA BATTING + BOWLING + FIELDING ===
  { name: 'Aiden Markram',    team: 'RSA', runs: 59, balls: 32, fours: 10, sixes: 1, overs: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Quinton de Kock',  team: 'RSA', runs: 25, balls: 22, fours: 2,  sixes: 0, overs: 0,  econ: null, wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
  { name: 'Ryan Rickelton',   team: 'RSA', runs: 33, balls: 21, fours: 3,  sixes: 1, overs: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Dewald Brevis',    team: 'RSA', runs: 6,  balls: 6,  fours: 1,  sixes: 0, overs: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'David Miller',     team: 'RSA', runs: 39, balls: 23, fours: 1,  sixes: 3, overs: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Tristan Stubbs',   team: 'RSA', runs: 34, balls: 19, fours: 2,  sixes: 2, overs: 0,  econ: null, wickets: 0, catches: 2, stumpings: 0, runOuts: 0 },
  { name: 'Marco Jansen',     team: 'RSA', runs: 0,  balls: 0,  fours: 0,  sixes: 0, overs: 4,  econ: 7.50, wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Corbin Bosch',     team: 'RSA', runs: 0,  balls: 0,  fours: 0,  sixes: 0, overs: 4,  econ: 6.75, wickets: 1, catches: 1, stumpings: 0, runOuts: 0 },
  { name: 'Kagiso Rabada',    team: 'RSA', runs: 0,  balls: 0,  fours: 0,  sixes: 0, overs: 4,  econ: 10.00,wickets: 1, catches: 2, stumpings: 0, runOuts: 0 },
  { name: 'Keshav Maharaj',   team: 'RSA', runs: 0,  balls: 0,  fours: 0,  sixes: 0, overs: 4,  econ: 7.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Lungi Ngidi',      team: 'RSA', runs: 0,  balls: 0,  fours: 0,  sixes: 0, overs: 4,  econ: 7.75, wickets: 4, catches: 0, stumpings: 0, runOuts: 0 },

  // === CAN BATTING + BOWLING + FIELDING ===
  { name: 'Dilpreet Bajwa',   team: 'CAN', runs: 0,  balls: 1,  fours: 0,  sixes: 0, overs: 4,  econ: 10.00, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Yuvraj Samra',     team: 'CAN', runs: 12, balls: 8,  fours: 3,  sixes: 0, overs: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Navneet Dhaliwal', team: 'CAN', runs: 64, balls: 49, fours: 7,  sixes: 1, overs: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Nicholas Kirton',  team: 'CAN', runs: 4,  balls: 3,  fours: 1,  sixes: 0, overs: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { name: 'Shreyas Movva',    team: 'CAN', runs: 9,  balls: 11, fours: 2,  sixes: 0, overs: 0,  econ: null,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Harsh Thaker',     team: 'CAN', runs: 33, balls: 29, fours: 2,  sixes: 2, overs: 0,  econ: null,  wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { name: 'Saad Bin Zafar',   team: 'CAN', runs: 11, balls: 12, fours: 1,  sixes: 0, overs: 3,  econ: 12.67, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Jaskaran Singh',   team: 'CAN', runs: 0,  balls: 1,  fours: 0,  sixes: 0, overs: 4,  econ: 12.25, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Dilon Heyliger',   team: 'CAN', runs: 4,  balls: 5,  fours: 0,  sixes: 0, overs: 1,  econ: 13.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
  { name: 'Kaleem Sana',      team: 'CAN', runs: 5,  balls: 3,  fours: 1,  sixes: 0, overs: 4,  econ: 9.50,  wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
  { name: 'Ansh Patel',       team: 'CAN', runs: 0,  balls: 0,  fours: 0,  sixes: 0, overs: 4,  econ: 7.75,  wickets: 3, catches: 0, stumpings: 0, runOuts: 0 },
];

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
  pts += p.catches * 5;
  pts += p.runOuts * 5;
  pts += p.stumpings * 5;
  if (p.runs >= 100) pts += 200;
  if (p.wickets >= 5) pts += 200;
  return pts;
}

async function findPlayerInDB(name, teamCode, dbPlayers, squadMap) {
  const nameLower = name.toLowerCase().trim();
  const teamSquadId = squadMap[teamCode];
  const teamPlayers = dbPlayers.filter(p => p.squad_id === teamSquadId);

  let match = teamPlayers.find(p => p.player_name.toLowerCase() === nameLower);
  if (match) return match;

  const parts = nameLower.split(' ');
  const lastName = parts[parts.length - 1];
  match = teamPlayers.find(p => p.player_name.toLowerCase().includes(lastName));
  if (match) return match;

  const firstName = parts[0];
  match = teamPlayers.find(p => p.player_name.toLowerCase().includes(firstName));
  return match;
}

(async () => {
  // ==========================================
  // STEP 1: Update ALL slot multipliers to 3x/2x/1x
  // ==========================================
  console.log('=== STEP 1: UPDATE SLOT MULTIPLIERS ===');

  const updates = [
    { slot: 1, mult: 3 },
    { slot: 2, mult: 2 },
    { slot: 3, mult: 1 },
  ];

  for (const u of updates) {
    const { error } = await sb
      .from('player_slots')
      .update({ multiplier: u.mult })
      .eq('slot_number', u.slot);
    if (error) console.error('Error updating slot ' + u.slot + ':', error);
    else console.log('Slot ' + u.slot + ' -> ' + u.mult + 'x (all matches)');
  }

  // ==========================================
  // STEP 2: Recalculate M8 player pick points with new multipliers
  // ==========================================
  console.log('\n=== STEP 2: RECALCULATE M8 BETS ===');

  const { data: m8Bets } = await sb
    .from('bets')
    .select('bet_id, user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, player_picks')
    .eq('match_id', 'wc_m8');

  const { data: m8Stats } = await sb
    .from('player_match_stats')
    .select('player_id, total_fantasy_points')
    .eq('match_id', 'wc_m8');
  const m8StatsMap = {};
  (m8Stats || []).forEach(s => { m8StatsMap[s.player_id] = s.total_fantasy_points; });

  // Get user names
  const allUserIds = [...new Set(m8Bets.map(b => b.user_id))];
  const { data: users } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', allUserIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  const newMultipliers = { 1: 3, 2: 2, 3: 1 };

  for (const bet of m8Bets) {
    const picks = bet.player_picks || [];
    if (picks.length === 0) continue; // No player picks, no change needed

    let newPlayerPts = 0;
    picks.forEach(pick => {
      const fantasyPts = m8StatsMap[pick.player_id] || 0;
      const mult = newMultipliers[pick.slot] || 1;
      newPlayerPts += Math.round(fantasyPts * mult);
    });

    const oldPlayerPts = bet.player_pick_points;
    const newScore = bet.winner_points + bet.total_runs_points + newPlayerPts + bet.side_bet_points;
    const oldScore = bet.score;

    console.log(
      (nameMap[bet.user_id] || bet.user_id.slice(0,8)).padEnd(20) +
      ' | player_pts: ' + oldPlayerPts + ' -> ' + newPlayerPts +
      ' | score: ' + oldScore + ' -> ' + newScore
    );

    await sb.from('bets').update({
      player_pick_points: newPlayerPts,
      score: newScore
    }).eq('bet_id', bet.bet_id);
  }

  // ==========================================
  // STEP 3: Insert M9 player stats and score
  // ==========================================
  console.log('\n=== STEP 3: SCORE M9 ===');

  // Get squad IDs
  const { data: squads } = await sb.from('squads').select('squad_id, team_code').in('team_code', ['RSA', 'CAN']);
  const squadMap = {};
  squads.forEach(s => { squadMap[s.team_code] = s.squad_id; });

  const squadIds = squads.map(s => s.squad_id);
  const { data: dbPlayers } = await sb.from('players').select('player_id, player_name, squad_id').in('squad_id', squadIds);
  console.log('DB players for RSA/CAN: ' + dbPlayers.length);

  // Match and calculate
  const statsToInsert = [];
  let unmatched = 0;

  console.log('\nPlayer'.padEnd(22) + '| Team | Runs | Wkts | Cat | Fantasy | DB Match');
  console.log('-'.repeat(95));

  for (const p of m9PlayerStats) {
    const fantasyPts = calcFantasyPoints(p);
    const dbPlayer = await findPlayerInDB(p.name, p.team, dbPlayers, squadMap);

    console.log(
      p.name.padEnd(22) + '| ' + p.team.padEnd(5) + '| ' +
      String(p.runs).padStart(4) + ' | ' + String(p.wickets).padStart(4) + ' | ' +
      String(p.catches).padStart(3) + ' | ' + String(fantasyPts).padStart(7) + ' | ' +
      (dbPlayer ? dbPlayer.player_name + ' (' + dbPlayer.player_id.slice(0,8) + ')' : 'NOT FOUND')
    );

    if (!dbPlayer) { unmatched++; continue; }

    statsToInsert.push({
      match_id: M9_MATCH_ID,
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

  if (unmatched > 0) console.log('\nWARNING: ' + unmatched + ' players not found in DB');

  // Insert stats
  await sb.from('player_match_stats').delete().eq('match_id', M9_MATCH_ID);
  const { error: statsErr } = await sb.from('player_match_stats').insert(statsToInsert);
  if (statsErr) { console.error('Error inserting m9 stats:', statsErr); return; }
  console.log('\nInserted ' + statsToInsert.length + ' player stats for m9');

  // Insert match results
  const { error: resultErr } = await sb.from('match_results').upsert({
    match_id: M9_MATCH_ID,
    winner: M9_WINNER,
    total_runs: M9_TOTAL_RUNS,
    completed_at: new Date().toISOString()
  }, { onConflict: 'match_id' });
  if (resultErr) { console.error('Error inserting m9 results:', resultErr); return; }
  console.log('M9 result saved: winner=RSA, total_runs=369');

  // Update match questions
  await sb.from('match_questions').update({ correct_answer: M9_WINNER }).eq('match_id', M9_MATCH_ID).eq('kind', 'WINNER');
  await sb.from('match_questions').update({ correct_answer: String(M9_TOTAL_RUNS) }).eq('match_id', M9_MATCH_ID).eq('kind', 'TOTAL_RUNS');

  // Score m9 via RPC
  console.log('\nScoring m9 via RPC...');
  const { data: scoreResult, error: scoreErr } = await sb
    .rpc('calculate_match_scores', { p_match_id: M9_MATCH_ID, p_event_id: 't20wc_2026' });
  if (scoreErr) { console.error('Scoring error:', scoreErr); return; }
  console.log('M9 scoring result:', JSON.stringify(scoreResult));

  // ==========================================
  // STEP 4: Recalculate FULL leaderboard from all scored bets
  // ==========================================
  console.log('\n=== STEP 4: RECALCULATE FULL LEADERBOARD ===');

  const { data: allBets } = await sb
    .from('bets')
    .select('user_id, match_id, score')
    .not('score', 'is', null);

  const totals = {};
  allBets.forEach(b => {
    if (!totals[b.user_id]) totals[b.user_id] = { score: 0, matches: 0, lastScore: 0 };
    totals[b.user_id].score += b.score;
    totals[b.user_id].matches++;
    totals[b.user_id].lastScore = b.score;
  });

  // Get all user names
  const allIds = Object.keys(totals);
  const { data: allUsers } = await sb.from('users').select('user_id, display_name').in('user_id', allIds);
  const allNameMap = {};
  (allUsers || []).forEach(u => { allNameMap[u.user_id] = u.display_name; });

  // Also get leaderboard names for users who might not be in users table
  const { data: lbUsers } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', allIds);
  (lbUsers || []).forEach(u => { if (!allNameMap[u.user_id]) allNameMap[u.user_id] = u.display_name; });

  for (const [userId, t] of Object.entries(totals)) {
    const name = allNameMap[userId] || 'Player';
    await sb.from('leaderboard').update({
      total_score: t.score,
      matches_played: t.matches,
      last_match_score: t.lastScore,
      display_name: name,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);
  }
  console.log('Leaderboard recalculated from all scored bets');

  // ==========================================
  // STEP 5: Show final results
  // ==========================================

  // M8 scores
  console.log('\n=== M8 FINAL SCORES (recalculated) ===');
  const { data: m8Final } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points')
    .eq('match_id', 'wc_m8').order('score', { ascending: false });

  console.log('User'.padEnd(22) + '| Score | Winner | Runs | Players');
  console.log('-'.repeat(65));
  m8Final.forEach(b => {
    console.log(
      (nameMap[b.user_id] || allNameMap[b.user_id] || b.user_id.slice(0,8)).padEnd(21) + ' | ' +
      String(b.score).padStart(5) + ' | ' + String(b.winner_points).padStart(6) + ' | ' +
      String(b.total_runs_points).padStart(4) + ' | ' + String(b.player_pick_points).padStart(7)
    );
  });

  // M9 scores
  console.log('\n=== M9 FINAL SCORES ===');
  const { data: m9Final } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points')
    .eq('match_id', M9_MATCH_ID).order('score', { ascending: false });

  console.log('User'.padEnd(22) + '| Score | Winner | Runs | Players');
  console.log('-'.repeat(65));
  m9Final.forEach(b => {
    console.log(
      (allNameMap[b.user_id] || b.user_id.slice(0,8)).padEnd(21) + ' | ' +
      String(b.score).padStart(5) + ' | ' + String(b.winner_points).padStart(6) + ' | ' +
      String(b.total_runs_points).padStart(4) + ' | ' + String(b.player_pick_points).padStart(7)
    );
  });

  // Leaderboard
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false });

  console.log('\n=== FINAL LEADERBOARD ===');
  lb.forEach((u, i) => {
    console.log((i+1) + '. ' + u.display_name.padEnd(22) + ' | ' + u.total_score + ' pts | ' + u.matches_played + ' matches');
  });
})();
