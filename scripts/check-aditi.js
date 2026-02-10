const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Find Aditi's user_id
  const { data: users } = await sb
    .from('leaderboard')
    .select('user_id, display_name, total_score, matches_played')
    .ilike('display_name', '%Aditi%');

  if (!users || users.length === 0) { console.log('Aditi not found'); return; }
  const aditi = users[0];
  console.log('User: ' + aditi.display_name + ' | ID: ' + aditi.user_id);
  console.log('Leaderboard: ' + aditi.total_score + ' pts, ' + aditi.matches_played + ' matches\n');

  // Get ALL her bets across all matches
  const { data: bets } = await sb
    .from('bets')
    .select('match_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points, answers, player_picks, side_bet_answers')
    .eq('user_id', aditi.user_id)
    .order('match_id');

  console.log('Total bets found: ' + bets.length + '\n');

  // Get match config for team names
  const matchIds = bets.map(b => b.match_id);
  const { data: configs } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b, status')
    .in('match_id', matchIds);
  const configMap = {};
  (configs || []).forEach(c => { configMap[c.match_id] = c; });

  // Get match results
  const { data: results } = await sb
    .from('match_results')
    .select('match_id, winner, total_runs')
    .in('match_id', matchIds);
  const resultMap = {};
  (results || []).forEach(r => { resultMap[r.match_id] = r; });

  console.log('Match'.padEnd(8) + ' | ' + 'Teams'.padEnd(14) + ' | ' + 'Status'.padEnd(7) + ' | ' +
    'Score'.padEnd(6) + ' | ' + 'Winner Pts'.padEnd(10) + ' | ' + 'Runs Pts'.padEnd(8) + ' | ' +
    'User Pick'.padEnd(12) + ' | ' + 'Correct'.padEnd(10) + ' | ' + 'Runs Bet'.padEnd(8) + ' | ' + 'Actual Runs');
  console.log('-'.repeat(120));

  bets.forEach(b => {
    const config = configMap[b.match_id] || {};
    const result = resultMap[b.match_id];
    const answers = b.answers || {};

    // Find winner pick
    const winnerKey = Object.keys(answers).find(k => k.includes(b.match_id + '_winner'));
    const userWinner = winnerKey ? answers[winnerKey] : '—';
    let winnerLabel = '—';
    if (userWinner && userWinner.includes('teamA')) winnerLabel = config.team_a || 'Team A';
    else if (userWinner && userWinner.includes('teamB')) winnerLabel = config.team_b || 'Team B';

    // Correct winner
    let correctLabel = '—';
    if (result) {
      if (result.winner && result.winner.includes('teamA')) correctLabel = config.team_a || 'Team A';
      else if (result.winner && result.winner.includes('teamB')) correctLabel = config.team_b || 'Team B';
      else correctLabel = result.winner || '—';
    }

    // Runs
    const runsKey = Object.keys(answers).find(k => k.includes(b.match_id + '_total_runs'));
    const userRuns = runsKey ? answers[runsKey] : '—';

    console.log(
      b.match_id.padEnd(8) + ' | ' +
      ((config.team_a || '?') + ' v ' + (config.team_b || '?')).padEnd(14) + ' | ' +
      (config.status || '?').padEnd(7) + ' | ' +
      String(b.score === null ? 'NULL' : b.score).padStart(5) + ' | ' +
      String(b.winner_points || 0).padStart(10) + ' | ' +
      String(b.total_runs_points || 0).padStart(8) + ' | ' +
      winnerLabel.padEnd(12) + ' | ' +
      correctLabel.padEnd(10) + ' | ' +
      String(userRuns).padStart(8) + ' | ' +
      String(result ? result.total_runs : '—').padStart(6)
    );
  });
})();
