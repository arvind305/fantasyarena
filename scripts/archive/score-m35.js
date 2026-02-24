/**
 * Score wc_m35: PAK vs NAM — Pakistan won by 102 runs
 *
 * PAK 199/3 (20 ov) vs NAM 97/10 (17.3 ov)
 * Total runs: 296. MoM: Sahibzada Farhan (100* off 58)
 * Side bet: "Who will give lesser runs?" → "Spinners" (117 vs 174)
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
  matchId: 'wc_m35',
  eventId: 't20wc_2026',
  label: 'PAK vs NAM',
  winner: 'opt_wc_m35_winner_teamA', // PAK = teamA
  totalRuns: 296,                     // 199 + 97
  manOfMatch: 'Sahibzada Farhan',
  sideBetId: '8f8ceeb4-f86f-4b71-9d2b-094cefafd322',
  sideBetAnswer: 'Spinners',
  players: [
    // Saim Ayub: 14(12), 2x4, 0x6. Bowled 2-0-10-0 econ 5.00. 1 catch (Zane Green)
    { pid: '8897ac95-3160-43a2-afdf-a98ed645ab03', name: 'Saim Ayub',            runs: 14, balls: 12, fours: 2, sixes: 0, overs: 2, runsConceded: 10, econ: 5.00, wickets: 0, catches: 1, stumpings: 0, runOuts: 0, isMoM: false },
    // Sahibzada Farhan: 100*(58), 11x4, 4x6. MoM! Century!
    { pid: 'b1cc6fb0-1f33-4519-a994-6a3542c3b12c', name: 'Sahibzada Farhan',    runs: 100, balls: 58, fours: 11, sixes: 4, overs: 0, runsConceded: 0, econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
    // Salman Ali Agha (c): 38(23), 3x4, 2x6. 1 run out (Loftie-Eaton)
    { pid: '0d3eb97f-8707-4bb1-9a18-a1f53387a001', name: 'Salman Ali Agha',     runs: 38, balls: 23, fours: 3, sixes: 2, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 1, isMoM: false },
    // Usman Tariq: DNB. Bowled 3.3-1-16-4 econ 4.57
    { pid: '338a9168-acbf-405a-be68-662193b36ea7', name: 'Usman Tariq',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 3,  runsConceded: 16, econ: 4.57, wickets: 4, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Mohammad Nawaz: DNB. Bowled 4-0-22-1 econ 5.50
    { pid: '82c98d2e-b2e0-42fc-a540-73d9f4f38fdd', name: 'Mohammad Nawaz',      runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 4,  runsConceded: 22, econ: 5.50, wickets: 1, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Salman Mirza: DNB. Bowled 2-0-11-1 econ 5.50
    { pid: '810fb8c0-dd86-48b1-95c3-b69a04fc0a27', name: 'Salman Mirza',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 2,  runsConceded: 11, econ: 5.50, wickets: 1, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Gerhard Erasmus (c): 7(6), 1x4, 0x6. Bowled 3-0-25-1 econ 8.33
    { pid: '15068c87-21ad-4004-8509-d8247dfb33ec', name: 'Gerhard Erasmus',      runs: 7,  balls: 6,  fours: 1, sixes: 0, overs: 3,  runsConceded: 25, econ: 8.33, wickets: 1, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Bernard Scholtz: 1(2), 0x4, 0x6. Bowled 4-0-33-0 econ 8.25
    { pid: '4f1fc19e-163b-4c5a-828b-544b2a822cb8', name: 'Bernard Scholtz',     runs: 1,  balls: 2,  fours: 0, sixes: 0, overs: 4,  runsConceded: 33, econ: 8.25, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Jack Brassell: 1*(1), 0x4, 0x6. Bowled 4-0-48-2 econ 12.00
    { pid: 'cd3a3c00-75ec-4024-a828-6d5558753ffd', name: 'Jack Brassell',       runs: 1,  balls: 1,  fours: 0, sixes: 0, overs: 4,  runsConceded: 48, econ: 12.00, wickets: 2, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Babar Azam: DNB, did not bowl
    { pid: '7f063f49-853f-46ae-8501-7bf6f9df28d4', name: 'Babar Azam',          runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,  runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Naseem Shah: DNP
    { pid: 'dfafa4bd-d207-473c-b3d8-a3dc9ad54236', name: 'Naseem Shah',         runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,  runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Shaheen Shah Afridi: DNP
    { pid: 'e97d7d7e-6c3f-4581-82c7-16629b6c5a8b', name: 'Shaheen Shah Afridi', runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,  runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Malan Kruger: DNP
    { pid: 'd0d71d09-e71a-4943-a4a5-4666aadcd77a', name: 'Malan Kruger',        runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0,  runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
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
