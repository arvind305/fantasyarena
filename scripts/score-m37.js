/**
 * Score wc_m37: WI vs ITA — West Indies won by 42 runs
 *
 * WI 165/6 (20 ov) vs ITA 123/10 (18 ov)
 * Total runs: 288. MoM: Shai Hope (75 off 46)
 * Side bet: "Powerplay runs 2nd innings?" → "31-50" (37 runs)
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
  matchId: 'wc_m37',
  eventId: 't20wc_2026',
  label: 'WI vs ITA',
  winner: 'opt_wc_m37_winner_teamA', // WI = teamA
  totalRuns: 288,                     // 165 + 123
  manOfMatch: 'Shai Hope',
  sideBetId: 'ae1164cc-621e-4d08-a119-a567cb36fa08',
  sideBetAnswer: '31-50',
  players: [
    // Shai Hope (c & wk): 75(46), 6x4, 4x6. MoM! 1 catch (Harry Manenti c Shai Hope b Shamar Joseph) + 1 catch (Ali Hasan c Shai Hope b Shamar Joseph)
    { pid: 'bccfa95c-b051-4856-8e12-caeb622f98fe', name: 'Shai Hope',            runs: 75, balls: 46, fours: 6, sixes: 4, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 2, stumpings: 0, runOuts: 0, isMoM: true },
    // Shimron Hetmyer: 1(4), 0x4, 0x6
    { pid: 'a3116e21-8583-4d12-979e-a3159afb7c6d', name: 'Shimron Hetmyer',      runs: 1,  balls: 4,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Sherfane Rutherford: 24*(15), 2x4, 1x6
    { pid: '774a32cf-fe85-4ad4-b852-2aa1c2a20333', name: 'Sherfane Rutherford',  runs: 24, balls: 15, fours: 2, sixes: 1, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Jason Holder: 9(7), 0x4, 1x6. Bowled 3-0-19-0 econ 6.33. 1 catch (Grant Stewart c Jason Holder b Shamar Joseph)
    { pid: '09b53484-fd99-4cf0-b1b2-966724be771f', name: 'Jason Holder',         runs: 9,  balls: 7,  fours: 0, sixes: 1, overs: 3, runsConceded: 19, econ: 6.33, wickets: 0, catches: 1, stumpings: 0, runOuts: 0, isMoM: false },
    // Ben Manenti: 26(21), 2x4, 1x6. Bowled 4-0-37-2 econ 9.25
    { pid: '5f991626-5727-4782-990b-13607d05c401', name: 'Benjamin Manenti',     runs: 26, balls: 21, fours: 2, sixes: 1, overs: 4, runsConceded: 37, econ: 9.25, wickets: 2, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
    // Romario Shepherd: DNP
    { pid: 'aef5bdd1-6ca4-4b8e-839a-f9c7028fe4f1', name: 'Romario Shepherd',    runs: 0,  balls: 0,  fours: 0, sixes: 0, overs: 0, runsConceded: 0,  econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0, isMoM: false },
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
