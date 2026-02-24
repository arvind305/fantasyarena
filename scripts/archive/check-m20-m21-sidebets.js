const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const MATCHES = ['wc_m20', 'wc_m21'];

  // Get match config
  const { data: configs } = await sb.from('match_config').select('*').in('match_id', MATCHES);
  // Get match results
  const { data: results } = await sb.from('match_results').select('*').in('match_id', MATCHES);
  // Get side bets config
  const { data: sideBets } = await sb.from('side_bets').select('*').in('match_id', MATCHES).order('match_id').order('display_order');
  // Get all bets for these matches
  const { data: bets } = await sb.from('bets').select('*').in('match_id', MATCHES);
  // Get leaderboard for display names
  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name, total_score, rank').in('user_id', userIds);
  const nameMap = {};
  (lb || []).forEach(u => { nameMap[u.user_id] = u; });

  for (const matchId of MATCHES) {
    const config = configs.find(c => c.match_id === matchId);
    const result = results.find(r => r.match_id === matchId);
    const matchSideBets = sideBets.filter(s => s.match_id === matchId);
    const matchBets = bets.filter(b => b.match_id === matchId);

    console.log('='.repeat(120));
    console.log('Match: ' + matchId + ' | ' + (config ? config.team_a + ' v ' + config.team_b : '?') + ' | Status: ' + (config ? config.status : '?'));
    console.log('='.repeat(120));

    // Show match result
    if (result) {
      console.log('\nMATCH RESULT:');
      console.log('  Winner: ' + result.winner);
      console.log('  Total Runs: ' + result.total_runs);
      console.log('  Side Bet Answers: ' + JSON.stringify(result.side_bet_answers, null, 2));
    } else {
      console.log('\nNO MATCH RESULT FOUND');
    }

    // Show side bets config
    console.log('\nSIDE BETS CONFIG:');
    if (matchSideBets.length === 0) {
      console.log('  No side bets configured');
    } else {
      matchSideBets.forEach((sb, i) => {
        console.log('  Side Bet #' + (i+1) + ': ' + sb.question_text);
        console.log('    ID: ' + sb.side_bet_id);
        console.log('    Options: ' + JSON.stringify(sb.options));
        console.log('    Correct Answer: ' + (sb.correct_answer || 'NOT SET'));
        console.log('    Points Correct: ' + sb.points_correct + ' | Points Wrong: ' + sb.points_wrong);
      });
    }

    // Show all user bets for this match
    console.log('\nUSER BETS (' + matchBets.length + ' bets):');
    console.log('-'.repeat(120));
    matchBets.forEach(b => {
      const user = nameMap[b.user_id] || {};
      const answers = b.answers || {};
      const sba = b.side_bet_answers || {};

      const winnerKey = Object.keys(answers).find(k => k.includes(matchId + '_winner'));
      const userWinner = winnerKey ? answers[winnerKey] : '—';
      const runsKey = Object.keys(answers).find(k => k.includes(matchId + '_total_runs'));
      const userRuns = runsKey ? answers[runsKey] : '—';

      console.log('  ' + (user.display_name || b.user_id).padEnd(20) + ' | Score: ' + String(b.score === null ? '—' : b.score).padStart(5) +
        ' | Win: ' + String(b.winner_points || 0).padStart(5) + ' | Runs: ' + String(b.total_runs_points || 0).padStart(5) +
        ' | Plyr: ' + String(b.player_pick_points || 0).padStart(5) + ' | Side: ' + String(b.side_bet_points || 0).padStart(5) +
        ' | Runr: ' + String(b.runner_points || 0).padStart(5));
      console.log('    Winner pick: ' + userWinner);
      console.log('    Runs pick: ' + userRuns);
      console.log('    Side bet answers: ' + JSON.stringify(sba));
      console.log('    Player picks: ' + JSON.stringify(b.player_picks));
      console.log('    Runner picks: ' + JSON.stringify(b.runner_picks));
      console.log('');
    });
  }
})();
