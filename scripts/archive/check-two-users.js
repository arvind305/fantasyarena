const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function showUser(name) {
  const { data: users } = await sb
    .from('leaderboard')
    .select('user_id, display_name, total_score, matches_played, rank')
    .ilike('display_name', '%' + name + '%');

  if (!users || users.length === 0) { console.log(name + ' not found in leaderboard'); return; }
  const user = users[0];
  console.log('='.repeat(120));
  console.log('User: ' + user.display_name + ' | Rank: #' + user.rank + ' | Total: ' + user.total_score + ' pts | Matches: ' + user.matches_played);
  console.log('='.repeat(120));

  const { data: bets } = await sb
    .from('bets')
    .select('match_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points, answers, player_picks, runner_picks, side_bet_answers')
    .eq('user_id', user.user_id)
    .order('match_id');

  if (!bets || bets.length === 0) { console.log('No bets found\n'); return; }

  const matchIds = bets.map(b => b.match_id);
  const { data: configs } = await sb.from('match_config').select('match_id, team_a, team_b, status').in('match_id', matchIds);
  const configMap = {};
  (configs || []).forEach(c => { configMap[c.match_id] = c; });

  const { data: results } = await sb.from('match_results').select('match_id, winner, total_runs').in('match_id', matchIds);
  const resultMap = {};
  (results || []).forEach(r => { resultMap[r.match_id] = r; });

  console.log(
    'Match'.padEnd(8) + ' | ' + 'Teams'.padEnd(14) + ' | ' + 'Status'.padEnd(7) + ' | ' +
    'Score'.padEnd(6) + ' | ' + 'WinPts'.padEnd(6) + ' | ' + 'RunPts'.padEnd(6) + ' | ' +
    'PlyrPts'.padEnd(7) + ' | ' + 'SidePts'.padEnd(7) + ' | ' + 'RunrPts'.padEnd(7) + ' | ' +
    'Pick'.padEnd(8) + ' | ' + 'Correct'.padEnd(8) + ' | ' + 'RunsBet'.padEnd(7) + ' | ' + 'Actual'
  );
  console.log('-'.repeat(120));

  let calcTotal = 0;
  let scored = 0;

  bets.forEach(b => {
    const config = configMap[b.match_id] || {};
    const result = resultMap[b.match_id];
    const answers = b.answers || {};

    const winnerKey = Object.keys(answers).find(k => k.includes(b.match_id + '_winner'));
    const userWinner = winnerKey ? answers[winnerKey] : '';
    let winnerLabel = '—';
    if (userWinner && userWinner.includes('teamA')) winnerLabel = config.team_a || 'Team A';
    else if (userWinner && userWinner.includes('teamB')) winnerLabel = config.team_b || 'Team B';

    let correctLabel = '—';
    if (result) {
      if (result.winner && result.winner.includes('teamA')) correctLabel = config.team_a || 'Team A';
      else if (result.winner && result.winner.includes('teamB')) correctLabel = config.team_b || 'Team B';
      else correctLabel = result.winner || '—';
    }

    const runsKey = Object.keys(answers).find(k => k.includes(b.match_id + '_total_runs'));
    const userRuns = runsKey ? answers[runsKey] : '—';

    if (b.score !== null) { calcTotal += b.score; scored++; }

    console.log(
      b.match_id.padEnd(8) + ' | ' +
      ((config.team_a || '?') + ' v ' + (config.team_b || '?')).padEnd(14) + ' | ' +
      (config.status || '?').padEnd(7) + ' | ' +
      String(b.score === null ? '—' : b.score).padStart(5) + ' | ' +
      String(b.winner_points || 0).padStart(6) + ' | ' +
      String(b.total_runs_points || 0).padStart(6) + ' | ' +
      String(b.player_pick_points || 0).padStart(7) + ' | ' +
      String(b.side_bet_points || 0).padStart(7) + ' | ' +
      String(b.runner_points || 0).padStart(7) + ' | ' +
      winnerLabel.padEnd(8) + ' | ' +
      correctLabel.padEnd(8) + ' | ' +
      String(userRuns).padStart(7) + ' | ' +
      String(result ? result.total_runs : '—').padStart(6)
    );
  });

  console.log('-'.repeat(120));
  console.log('Calculated total from bets: ' + calcTotal + ' (scored ' + scored + ' matches) | Leaderboard says: ' + user.total_score);
  console.log('');
}

(async () => {
  await showUser('Shashank');
  await showUser('Ravi Kumar');
})();
