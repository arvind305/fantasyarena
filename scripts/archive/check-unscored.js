const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Get all non-DRAFT matches
  const { data: matches } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .in('status', ['LOCKED', 'SCORED', 'OPEN'])
    .order('lock_time', { ascending: true });

  // Get match results
  const matchIds = matches.map(m => m.match_id);
  const { data: results } = await sb
    .from('match_results')
    .select('match_id, winner, total_runs')
    .in('match_id', matchIds);
  const resultMap = {};
  (results || []).forEach(r => { resultMap[r.match_id] = r; });

  // Get bet counts per match
  const { data: bets } = await sb
    .from('bets')
    .select('match_id, score');
  const betCounts = {};
  const scoredCounts = {};
  (bets || []).forEach(b => {
    betCounts[b.match_id] = (betCounts[b.match_id] || 0) + 1;
    if (b.score !== null) scoredCounts[b.match_id] = (scoredCounts[b.match_id] || 0) + 1;
  });

  // Get player stats counts
  const { data: stats } = await sb
    .from('player_match_stats')
    .select('match_id');
  const statCounts = {};
  (stats || []).forEach(s => { statCounts[s.match_id] = (statCounts[s.match_id] || 0) + 1; });

  console.log('=== Matches Needing Action ===\n');
  console.log('Match'.padEnd(8) + ' | ' + 'Teams'.padEnd(14) + ' | ' + 'Status'.padEnd(7) + ' | ' +
    'Lock Time (IST)'.padEnd(22) + ' | ' + 'Result'.padEnd(12) + ' | ' + 'Bets'.padEnd(5) + ' | ' +
    'Scored'.padEnd(7) + ' | ' + 'Stats'.padEnd(6) + ' | ' + 'Action Needed');
  console.log('-'.repeat(130));

  let actionCount = 0;
  matches.forEach(m => {
    const result = resultMap[m.match_id];
    const bCount = betCounts[m.match_id] || 0;
    const sCount = scoredCounts[m.match_id] || 0;
    const stCount = statCounts[m.match_id] || 0;
    const lockIST = m.lock_time ? new Date(m.lock_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) : '—';
    const isPastLock = m.lock_time && new Date(m.lock_time) < new Date();

    let action = '';
    if (m.status === 'LOCKED' && !result) action = 'NEEDS RESULT + STATS + SCORING';
    else if (m.status === 'LOCKED' && result && stCount === 0) action = 'NEEDS STATS + SCORING';
    else if (m.status === 'LOCKED' && result && stCount > 0 && sCount === 0) action = 'NEEDS SCORING (ready!)';
    else if (m.status === 'OPEN' && isPastLock) action = 'NEEDS LOCKING (past lock time)';
    else if (m.status === 'OPEN') action = '(open for betting)';
    else if (m.status === 'SCORED') return; // skip scored

    actionCount++;
    console.log(
      m.match_id.padEnd(8) + ' | ' +
      (m.team_a + ' v ' + m.team_b).padEnd(14) + ' | ' +
      m.status.padEnd(7) + ' | ' +
      lockIST.padEnd(22) + ' | ' +
      (result ? (result.winner || '').substring(0, 12) : 'NO RESULT').padEnd(12) + ' | ' +
      String(bCount).padStart(4) + ' | ' +
      String(sCount).padStart(6) + ' | ' +
      String(stCount).padStart(5) + ' | ' +
      action
    );
  });

  if (actionCount === 0) console.log('  All matches are scored!');

  console.log('\n=== Already Scored ===');
  const scored = matches.filter(m => m.status === 'SCORED');
  console.log(scored.length + ' matches: ' + scored.map(m => m.match_id + ' (' + m.team_a + 'v' + m.team_b + ')').join(', '));
})();
