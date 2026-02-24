/**
 * Score wc_m36: IND vs NED — India won by 17 runs
 *
 * IND 193/6 (20 ov) vs NED 176/7 (20 ov)
 * Total runs: 369. MoM: Shivam Dube (66 off 31 + 2/35)
 * Side bet: "Powerplay runs 1st innings?" → "51-80" (51 runs)
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
  matchId: 'wc_m36',
  eventId: 't20wc_2026',
  label: 'IND vs NED',
  winner: 'opt_wc_m36_winner_teamA', // IND = teamA
  totalRuns: 369,                     // 193 + 176
  manOfMatch: 'Shivam Dube',
  sideBetId: 'e2549832-0b57-46fc-bcb1-06171a8b84b3',
  sideBetAnswer: '51-80',
  players: [
    // === User-picked players ===
    // Abhishek Sharma: 0(3), 0x4, 0x6. Bowled 1-0-10-0 econ 10.00
    { pid: '86b01728-3275-420a-a85b-a0e55682f1fe', name: 'Abhishek Sharma',      runs: 0,  balls: 3,  fours: 0, sixes: 0, overs: 1, runsConceded: 10, econ: 10.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Ishan Kishan (wk): 18(7), 2x4, 1x6
    { pid: '00f4c503-3020-48eb-811d-c021859b4172', name: 'Ishan Kishan',         runs: 18, balls: 7,  fours: 2, sixes: 1, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Tilak Varma: 31(27), 3x4, 1x6
    { pid: 'e74b8e5c-dc3b-4850-be15-eb7f47a608d1', name: 'Tilak Varma',          runs: 31, balls: 27, fours: 3, sixes: 1, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Suryakumar Yadav (c): 34(28), 2x4, 1x6
    { pid: 'e3fbffd0-751c-4a9c-9bb3-bf3229c032d9', name: 'Suryakumar Yadav',    runs: 34, balls: 28, fours: 2, sixes: 1, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Hardik Pandya: 30(21), 0x4, 3x6. Bowled 3-0-40-1 econ 13.33
    { pid: '2980b4bc-7484-446c-bba5-0a99479680db', name: 'Hardik Pandya',        runs: 30, balls: 21, fours: 0, sixes: 3, overs: 3, runsConceded: 40, econ: 13.33, wickets: 1, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Varun Chakravarthy: DNB. Bowled 3-0-14-3 econ 4.67
    { pid: 'dcb4ba76-40db-4ee8-af07-506fa0a54628', name: 'Varun Chakravarthy',   runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 14, econ: 4.67, wickets: 3, catches: 1, stumpings: 0, runOuts: 0, isMoM: false },
    // Jasprit Bumrah: DNB. Bowled 3-0-17-1 econ 5.67
    { pid: '48b48fa6-106a-44a7-a6a2-6bb249d2aed6', name: 'Jasprit Bumrah',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 17, econ: 5.67, wickets: 1, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Arshdeep Singh: DNB. Bowled 3-0-22-0 econ 7.33
    { pid: '17c8c38b-55b0-4499-8791-6ae85b5fb9c8', name: 'Arshdeep Singh',       runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3, runsConceded: 22, econ: 7.33, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Kuldeep Yadav: DNP
    { pid: '16241e2e-b5c9-4cd9-84ae-c3e998229301', name: 'Kuldeep Yadav',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
  ],
};

(async () => {
  console.log(`=== Scoring ${match.matchId}: ${match.label} ===\n`);

  console.log('Fantasy Points:');
  for (const p of match.players) {
    p.fantasyPoints = calcFantasyPoints(p);
    if (p.fantasyPoints > 0) console.log(`  ${p.name}: ${p.fantasyPoints} pts`);
  }

  console.log('\nStep 1: Inserting player_match_stats...');
  const statsRows = match.players.map(p => ({
    match_id: match.matchId, player_id: p.pid,
    runs: p.runs, balls_faced: p.balls, fours: p.fours, sixes: p.sixes,
    strike_rate: p.balls > 0 ? Math.round((p.runs / p.balls) * 10000) / 100 : 0,
    overs_bowled: p.overs, runs_conceded: p.runsConceded, economy_rate: p.econ,
    wickets: p.wickets, catches: p.catches, stumpings: p.stumpings, run_outs: p.runOuts,
    total_fantasy_points: p.fantasyPoints, is_man_of_match: p.isMoM,
    has_century: p.runs >= 100, has_five_wicket_haul: p.wickets >= 5, has_hat_trick: false,
  }));
  const { error: statsErr } = await sb.from('player_match_stats').upsert(statsRows, { onConflict: 'match_id,player_id' });
  if (statsErr) { console.error('Stats error:', statsErr.message); return; }
  console.log(`  Inserted ${statsRows.length} player stats`);

  console.log('\nStep 2: Inserting match_results...');
  const { error: resErr } = await sb.from('match_results').upsert({
    match_id: match.matchId, winner: match.winner, total_runs: match.totalRuns, man_of_match: match.manOfMatch,
  }, { onConflict: 'match_id' });
  if (resErr) { console.error('Results error:', resErr.message); return; }
  console.log('  Done');

  console.log('\nStep 3: Updating side bet answer...');
  const { error: sbErr } = await sb.from('side_bets')
    .update({ correct_answer: match.sideBetAnswer, status: 'SCORED' })
    .eq('side_bet_id', match.sideBetId);
  if (sbErr) { console.error('Side bet error:', sbErr.message); return; }
  console.log(`  Side bet answer set to "${match.sideBetAnswer}"`);

  console.log('\nStep 4: Calling calculate_match_scores RPC...');
  const { error: rpcErr } = await sb.rpc('calculate_match_scores', { p_match_id: match.matchId, p_event_id: match.eventId });
  if (rpcErr) { console.error('RPC error:', rpcErr.message); return; }
  console.log('  Scoring complete');

  console.log('\nStep 5: Updating match status to SCORED...');
  const { error: mcErr } = await sb.from('match_config').update({ status: 'SCORED' }).eq('match_id', match.matchId);
  if (mcErr) { console.error('Status error:', mcErr.message); return; }
  console.log('  Status set to SCORED');

  console.log('\nStep 6: Verifying scores...');
  const { data: users } = await sb.from('users').select('user_id,display_name');
  const umap = {}; users.forEach(u => umap[u.user_id] = u.display_name);
  const { data: bets } = await sb.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', match.matchId);
  if (bets) {
    for (const b of bets) console.log(`  ${umap[b.user_id] || b.user_id}: total=${b.score}, winner=${b.winner_points}, runs=${b.total_runs_points}, players=${b.player_pick_points}, side=${b.side_bet_points}`);
  }

  const { data: lb } = await sb.from('leaderboard').select('rank, display_name, total_score, matches_played').order('rank').limit(15);
  if (lb) { console.log('\nLeaderboard:'); lb.forEach(r => console.log(`  #${r.rank} ${r.display_name}: ${r.total_score} pts (${r.matches_played} matches)`)); }

  console.log('\nDone!');
})();
