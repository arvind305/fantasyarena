const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const MATCH = 'wc_m7';

  // Match config
  const { data: config } = await sb.from('match_config').select('*').eq('match_id', MATCH).single();
  // Match result
  const { data: result } = await sb.from('match_results').select('*').eq('match_id', MATCH).single();
  // All bets
  const { data: bets } = await sb.from('bets')
    .select('match_id, user_id, score, winner_points, total_runs_points, answers')
    .eq('match_id', MATCH)
    .order('score', { ascending: false, nullsFirst: false });

  // User names
  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb.from('leaderboard').select('user_id, display_name, total_score, matches_played').in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u; });

  // Winner display
  let winnerDisplay = '?';
  if (result && result.winner) {
    if (result.winner.includes('teamA')) winnerDisplay = config.team_a;
    else if (result.winner.includes('teamB')) winnerDisplay = config.team_b;
    else winnerDisplay = result.winner;
  }

  console.log('=== ' + MATCH.toUpperCase() + ': ' + config.team_a + ' vs ' + config.team_b +
    ' | Winner: ' + winnerDisplay + ' | Total Runs: ' + (result ? result.total_runs : 'N/A') +
    ' | winner_base=' + config.winner_base_points + ', runs_base=' + config.total_runs_base_points + ' ===\n');

  console.log(
    'User'.padEnd(22) + '| ' +
    'Pick'.padEnd(8) + '| ' +
    'Win Pts'.padEnd(8) + '| ' +
    'Runs Bet'.padEnd(9) + '| ' +
    'Actual'.padEnd(7) + '| ' +
    'Diff'.padEnd(5) + '| ' +
    'Runs Pts'.padEnd(9) + '| ' +
    'Score'.padEnd(6) + '| ' +
    'Scored?'
  );
  console.log('-'.repeat(95));

  bets.forEach(b => {
    const u = nameMap[b.user_id];
    const name = (u ? u.display_name : b.user_id.slice(0,8)).padEnd(21);
    const answers = b.answers || {};

    const winnerKey = Object.keys(answers).find(k => k.includes(MATCH + '_winner'));
    const userWinner = winnerKey ? answers[winnerKey] : null;
    let pickLabel = '—';
    if (userWinner && userWinner.includes('teamA')) pickLabel = config.team_a;
    else if (userWinner && userWinner.includes('teamB')) pickLabel = config.team_b;

    const runsKey = Object.keys(answers).find(k => k.includes(MATCH + '_total_runs'));
    const userRuns = runsKey ? answers[runsKey] : '—';
    const diff = userRuns !== '—' && result ? Math.abs(result.total_runs - parseInt(userRuns)) : '—';

    console.log(
      name + ' | ' +
      pickLabel.padEnd(6) + ' | ' +
      String(b.winner_points || 0).padStart(6) + ' | ' +
      String(userRuns).padStart(7) + ' | ' +
      String(result ? result.total_runs : '—').padStart(5) + ' | ' +
      String(diff).padStart(3) + ' | ' +
      String(b.total_runs_points || 0).padStart(7) + ' | ' +
      String(b.score === null ? 'NULL' : b.score).padStart(5) + ' | ' +
      (b.score !== null ? 'YES' : 'NO')
    );
  });

  // Full leaderboard
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false });

  console.log('\n=== FULL LEADERBOARD ===');
  (lb || []).forEach((u, i) => {
    console.log((i+1) + '. ' + u.display_name.padEnd(22) + ' | ' + String(u.total_score).padStart(6) + ' pts | ' + u.matches_played + ' matches');
  });
})();
