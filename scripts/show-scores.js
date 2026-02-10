const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCHES = ['wc_m1','wc_m2','wc_m3','wc_m4','wc_m5','wc_m6'];

(async () => {
  const { data: bets, error } = await sb
    .from('bets')
    .select('match_id, user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points')
    .in('match_id', MATCHES)
    .not('score', 'is', null)
    .order('match_id')
    .order('score', { ascending: false });

  if (error) { console.error(error); return; }

  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb
    .from('leaderboard')
    .select('user_id, display_name')
    .in('user_id', userIds);

  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  const { data: configs } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b')
    .in('match_id', MATCHES);
  const matchInfo = {};
  (configs || []).forEach(c => { matchInfo[c.match_id] = c.team_a + ' vs ' + c.team_b; });

  const { data: results } = await sb
    .from('match_results')
    .select('match_id, winner, total_runs')
    .in('match_id', MATCHES);
  const resultMap = {};
  (results || []).forEach(r => { resultMap[r.match_id] = { winner: r.winner, runs: r.total_runs }; });

  console.log('=== MATCH RESULTS (First 6 Matches) ===');
  for (const mid of MATCHES) {
    const r = resultMap[mid];
    const info = matchInfo[mid] || '?';
    console.log('  ' + mid + ': ' + info + ' | Winner: ' + (r ? r.winner : 'N/A') + ' | Total Runs: ' + (r ? r.runs : 'N/A'));
  }

  console.log('');
  console.log('=== SCORED BETS ===');
  console.log('Match    | User            | Score | Winner | Runs | Players | Side  | Runner');
  console.log('---------|-----------------|-------|--------|------|---------|-------|-------');
  bets.forEach(b => {
    const name = (nameMap[b.user_id] || b.user_id.slice(0,8)).substring(0, 15).padEnd(15);
    const line = [
      b.match_id.padEnd(8),
      name,
      String(b.score||0).padStart(5),
      String(b.winner_points||0).padStart(6),
      String(b.total_runs_points||0).padStart(4),
      String(b.player_pick_points||0).padStart(7),
      String(b.side_bet_points||0).padStart(5),
      String(b.runner_points||0).padStart(6),
    ].join(' | ');
    console.log(line);
  });

  // Summary per user
  const totals = {};
  bets.forEach(b => {
    const name = nameMap[b.user_id] || b.user_id.slice(0,8);
    if (totals[name] === undefined) totals[name] = { bets: 0, total: 0 };
    totals[name].bets++;
    totals[name].total += (b.score || 0);
  });
  console.log('');
  console.log('=== TOTALS BY USER ===');
  console.log('User            | Bets | Total Score');
  console.log('----------------|------|------------');
  Object.entries(totals).sort((a,b) => b[1].total - a[1].total).forEach(([name, t]) => {
    const line = name.substring(0,15).padEnd(15) + ' | ' + String(t.bets).padStart(4) + ' | ' + String(t.total).padStart(11);
    console.log(line);
  });

  console.log('');
  console.log('Total scored bets: ' + bets.length);
})();
