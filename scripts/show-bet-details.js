const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCHES = ['wc_m1','wc_m2','wc_m3','wc_m4','wc_m5','wc_m6'];

(async () => {
  // Get all bets (scored or not) for first 6 matches
  const { data: bets, error } = await sb
    .from('bets')
    .select('match_id, user_id, score, winner_points, total_runs_points, answers')
    .in('match_id', MATCHES)
    .order('match_id')
    .order('score', { ascending: false, nullsFirst: false });

  if (error) { console.error(error); return; }

  // Get user names
  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb
    .from('leaderboard')
    .select('user_id, display_name')
    .in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  // Get match config for teams
  const { data: configs } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b')
    .in('match_id', MATCHES);
  const matchTeams = {};
  (configs || []).forEach(c => { matchTeams[c.match_id] = { a: c.team_a, b: c.team_b }; });

  // Get match results
  const { data: results } = await sb
    .from('match_results')
    .select('match_id, winner, total_runs')
    .in('match_id', MATCHES);
  const resultMap = {};
  (results || []).forEach(r => { resultMap[r.match_id] = r; });

  // Get match questions to understand the options
  const { data: questions } = await sb
    .from('match_questions')
    .select('match_id, question_id, kind, options')
    .in('match_id', MATCHES);

  // Build option label maps per match
  const optionLabels = {};
  (questions || []).forEach(q => {
    if (q.options && Array.isArray(q.options)) {
      q.options.forEach(opt => {
        const key = opt.optionId || opt.option_id;
        if (key) {
          optionLabels[key] = opt.label || opt.text || key;
        }
      });
    }
  });

  // Print per match
  for (const mid of MATCHES) {
    const teams = matchTeams[mid];
    const result = resultMap[mid];
    const matchBets = bets.filter(b => b.match_id === mid);

    // Resolve winner display name
    let winnerDisplay = 'N/A';
    if (result) {
      const w = result.winner;
      if (w && w.includes('teamA')) winnerDisplay = teams ? teams.a : 'Team A';
      else if (w && w.includes('teamB')) winnerDisplay = teams ? teams.b : 'Team B';
      else if (w === 'TIE') winnerDisplay = 'TIE';
      else winnerDisplay = w || 'N/A';
    }

    console.log('');
    console.log('=== ' + mid.toUpperCase() + ': ' + (teams ? teams.a + ' vs ' + teams.b : '?') + ' | Winner: ' + winnerDisplay + ' | Total Runs: ' + (result ? result.total_runs : 'N/A') + ' ===');
    console.log('');
    console.log(
      'User'.padEnd(18) + '| ' +
      'User Winner Pick'.padEnd(18) + '| ' +
      'Winner Pts'.padEnd(12) + '| ' +
      'Actual Runs'.padEnd(13) + '| ' +
      'User Runs Bet'.padEnd(15) + '| ' +
      'Runs Pts'.padEnd(10) + '| ' +
      'Runs Calc'
    );
    console.log('-'.repeat(120));

    matchBets.forEach(b => {
      const name = (nameMap[b.user_id] || b.user_id.slice(0,8)).substring(0, 17).padEnd(17);
      const answers = b.answers || {};

      // Find winner answer — keys can be q_wc_m1_winner or wc_m1_winner
      let userWinnerPick = '—';
      const winnerKey = Object.keys(answers).find(k => k.includes(mid + '_winner') || k === mid + '_winner');
      if (winnerKey) {
        const val = answers[winnerKey];
        if (optionLabels[val]) {
          userWinnerPick = optionLabels[val];
        } else if (val && val.includes('teamA')) {
          userWinnerPick = teams ? teams.a : 'Team A';
        } else if (val && val.includes('teamB')) {
          userWinnerPick = teams ? teams.b : 'Team B';
        } else {
          userWinnerPick = val || '—';
        }
      }

      // Find total runs answer — keys can be q_wc_m1_total_runs or wc_m1_total_runs
      let userRunsBet = '—';
      const runsKey = Object.keys(answers).find(k => k.includes(mid + '_total_runs') || k === mid + '_total_runs');
      if (runsKey) {
        userRunsBet = String(answers[runsKey]);
      }

      // Calculate runs explanation
      let runsCalc = '—';
      const actualRuns = result ? result.total_runs : null;
      if (actualRuns !== null && userRunsBet !== '—') {
        const diff = Math.abs(actualRuns - parseInt(userRunsBet));
        const runsPts = b.total_runs_points || 0;
        runsCalc = 'diff=' + diff + ', pts=' + runsPts;
      }

      console.log(
        name + ' | ' +
        userWinnerPick.substring(0, 16).padEnd(16) + ' | ' +
        String(b.winner_points || 0).padStart(10) + ' | ' +
        String(result ? result.total_runs : '—').padStart(11) + ' | ' +
        String(userRunsBet).padStart(13) + ' | ' +
        String(b.total_runs_points || 0).padStart(8) + ' | ' +
        runsCalc
      );
    });
  }
})();
