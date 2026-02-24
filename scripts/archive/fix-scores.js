const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

// Match results (all winners are teamA)
const RESULTS = {
  wc_m1: { winner: 'opt_wc_m1_winner_teamA', total_runs: 295 },
  wc_m2: { winner: 'opt_wc_m2_winner_teamA', total_runs: 329 },
  wc_m3: { winner: 'opt_wc_m3_winner_teamA', total_runs: 293 },
};

// Runs scoring tiers (base = 1000)
function calcRunsPoints(diff) {
  if (diff === 0) return 5000;
  if (diff === 1) return 1000;
  if (diff <= 5) return 500;
  if (diff <= 10) return 250;
  if (diff <= 15) return 100;
  return 0;
}

(async () => {
  // Get the 8 unscored bets (score IS null) for m1, m2, m3
  const { data: bets, error } = await sb
    .from('bets')
    .select('bet_id, match_id, user_id, score, answers')
    .in('match_id', ['wc_m1', 'wc_m2', 'wc_m3'])
    .is('score', null);

  if (error) { console.error('Error fetching bets:', error); return; }
  console.log('Found ' + bets.length + ' unscored bets to fix\n');

  // Get user names
  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb
    .from('leaderboard')
    .select('user_id, display_name, total_score, matches_played')
    .in('user_id', userIds);
  const userMap = {};
  (users || []).forEach(u => { userMap[u.user_id] = u; });

  // Track leaderboard adjustments
  const leaderboardAdj = {};

  for (const bet of bets) {
    const mid = bet.match_id;
    const result = RESULTS[mid];
    const answers = bet.answers || {};
    const userName = userMap[bet.user_id] ? userMap[bet.user_id].display_name : bet.user_id.slice(0,8);

    // Winner check
    const winnerKey = Object.keys(answers).find(k => k.includes(mid + '_winner'));
    const userWinner = winnerKey ? answers[winnerKey] : null;
    const winnerCorrect = userWinner === result.winner;
    const winnerPoints = winnerCorrect ? 1000 : 0;

    // Runs check
    const runsKey = Object.keys(answers).find(k => k.includes(mid + '_total_runs'));
    const userRuns = runsKey ? parseInt(answers[runsKey]) : null;
    const diff = userRuns !== null ? Math.abs(result.total_runs - userRuns) : null;
    const runsPoints = diff !== null ? calcRunsPoints(diff) : 0;

    const totalScore = winnerPoints + runsPoints;

    console.log(mid + ' | ' + userName +
      ' | winner=' + (winnerCorrect ? 'CORRECT' : 'WRONG') + ' (+' + winnerPoints + ')' +
      ' | runs bet=' + userRuns + ', actual=' + result.total_runs + ', diff=' + diff + ' (+' + runsPoints + ')' +
      ' | TOTAL=' + totalScore);

    // Update the bet
    const { error: updateErr } = await sb
      .from('bets')
      .update({
        score: totalScore,
        winner_points: winnerPoints,
        total_runs_points: runsPoints,
        player_pick_points: 0,
        side_bet_points: 0,
        runner_points: 0,
        is_locked: true,
        locked_at: new Date().toISOString()
      })
      .eq('bet_id', bet.bet_id);

    if (updateErr) {
      console.error('  ERROR updating bet ' + bet.bet_id + ':', updateErr);
    } else {
      console.log('  -> Bet updated successfully');
    }

    // Track leaderboard adjustment
    if (!leaderboardAdj[bet.user_id]) {
      leaderboardAdj[bet.user_id] = { name: userName, addScore: 0, addMatches: 0 };
    }
    leaderboardAdj[bet.user_id].addScore += totalScore;
    leaderboardAdj[bet.user_id].addMatches += 1;
  }

  // Update leaderboard
  console.log('\n=== LEADERBOARD UPDATES ===');
  for (const [userId, adj] of Object.entries(leaderboardAdj)) {
    const user = userMap[userId];
    const oldScore = user ? user.total_score : 0;
    const oldMatches = user ? user.matches_played : 0;
    const newScore = oldScore + adj.addScore;
    const newMatches = oldMatches + adj.addMatches;

    console.log(adj.name + ': ' + oldScore + ' -> ' + newScore + ' (+' + adj.addScore + '), matches: ' + oldMatches + ' -> ' + newMatches);

    const { error: lbErr } = await sb
      .from('leaderboard')
      .update({
        total_score: newScore,
        matches_played: newMatches,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (lbErr) {
      console.error('  ERROR updating leaderboard for ' + adj.name + ':', lbErr);
    } else {
      console.log('  -> Leaderboard updated');
    }
  }

  // Verify final state
  console.log('\n=== VERIFICATION ===');
  const { data: finalBets } = await sb
    .from('bets')
    .select('match_id, user_id, score, winner_points, total_runs_points')
    .in('match_id', ['wc_m1', 'wc_m2', 'wc_m3'])
    .order('match_id')
    .order('score', { ascending: false, nullsFirst: false });

  finalBets.forEach(b => {
    const name = (userMap[b.user_id] ? userMap[b.user_id].display_name : b.user_id.slice(0,8));
    console.log(b.match_id + ' | ' + name.padEnd(20) + ' | score=' + String(b.score).padStart(5) + ' | winner=' + String(b.winner_points).padStart(5) + ' | runs=' + String(b.total_runs_points).padStart(5));
  });

  const { data: finalLb } = await sb
    .from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false });

  console.log('\n=== FINAL LEADERBOARD ===');
  (finalLb || []).forEach((u, i) => {
    console.log((i+1) + '. ' + u.display_name.padEnd(22) + ' | ' + u.total_score + ' pts | ' + u.matches_played + ' matches');
  });
})();
