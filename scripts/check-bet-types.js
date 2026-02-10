const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Get ALL bets across all matches
  const { data: bets, error } = await sb
    .from('bets')
    .select('match_id, user_id, answers, player_picks, side_bet_answers, runner_picks')
    .order('match_id');

  if (error) { console.error(error); return; }

  // Group by match
  const byMatch = {};
  bets.forEach(b => {
    if (!byMatch[b.match_id]) byMatch[b.match_id] = [];
    byMatch[b.match_id].push(b);
  });

  // Get user names
  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  // Get match config for status
  const { data: configs } = await sb.from('match_config').select('match_id, team_a, team_b, status');
  const configMap = {};
  (configs || []).forEach(c => { configMap[c.match_id] = c; });

  console.log('Match'.padEnd(8) + ' | ' + 'Teams'.padEnd(14) + ' | ' + 'Status'.padEnd(7) + ' | ' +
    'Bets'.padEnd(4) + ' | ' + 'Has Winner'.padEnd(10) + ' | ' + 'Has Runs'.padEnd(8) + ' | ' +
    'Has Players'.padEnd(11) + ' | ' + 'Has Side'.padEnd(8) + ' | ' + 'Has Runner');
  console.log('-'.repeat(100));

  // Sort match IDs numerically
  const matchIds = Object.keys(byMatch).sort((a, b) => {
    const na = parseInt(a.replace('wc_m', ''));
    const nb = parseInt(b.replace('wc_m', ''));
    return na - nb;
  });

  for (const mid of matchIds) {
    const matchBets = byMatch[mid];
    const config = configMap[mid] || {};

    let hasWinner = 0, hasRuns = 0, hasPlayers = 0, hasSide = 0, hasRunner = 0;

    matchBets.forEach(b => {
      const answers = b.answers || {};
      const winnerKey = Object.keys(answers).find(k => k.includes('_winner'));
      const runsKey = Object.keys(answers).find(k => k.includes('_total_runs'));
      if (winnerKey && answers[winnerKey]) hasWinner++;
      if (runsKey && answers[runsKey]) hasRuns++;
      if (b.player_picks && b.player_picks.length > 0) hasPlayers++;
      if (b.side_bet_answers && Object.keys(b.side_bet_answers).length > 0) hasSide++;
      if (b.runner_picks && b.runner_picks.length > 0) hasRunner++;
    });

    const total = matchBets.length;
    console.log(
      mid.padEnd(8) + ' | ' +
      ((config.team_a || '?') + ' v ' + (config.team_b || '?')).padEnd(14) + ' | ' +
      (config.status || '?').padEnd(7) + ' | ' +
      String(total).padStart(4) + ' | ' +
      (hasWinner + '/' + total).padEnd(10) + ' | ' +
      (hasRuns + '/' + total).padEnd(8) + ' | ' +
      (hasPlayers + '/' + total).padEnd(11) + ' | ' +
      (hasSide + '/' + total).padEnd(8) + ' | ' +
      (hasRunner + '/' + total)
    );
  }
})();
