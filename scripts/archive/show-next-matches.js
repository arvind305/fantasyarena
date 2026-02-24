const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Get all non-SCORED matches that have bets
  const { data: configs } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b, status, lock_time, winner_base_points, total_runs_base_points')
    .in('status', ['LOCKED', 'OPEN'])
    .order('match_id');

  console.log('=== NON-SCORED MATCHES WITH STATUS ===\n');
  configs.forEach(c => {
    console.log(c.match_id + ': ' + c.team_a + ' vs ' + c.team_b + ' | status=' + c.status + ' | lock=' + c.lock_time);
  });

  // Get matches that are LOCKED (played but not scored)
  const lockedIds = configs.filter(c => c.status === 'LOCKED').map(c => c.match_id);
  console.log('\nLOCKED (need scoring): ' + lockedIds.join(', '));

  if (lockedIds.length === 0) {
    console.log('No locked matches to score.');
    return;
  }

  // Check if results exist
  const { data: results } = await sb
    .from('match_results')
    .select('*')
    .in('match_id', lockedIds);
  const resultMap = {};
  (results || []).forEach(r => { resultMap[r.match_id] = r; });

  console.log('\n=== MATCH RESULTS FOR LOCKED MATCHES ===');
  lockedIds.forEach(mid => {
    const r = resultMap[mid];
    if (r) {
      console.log(mid + ': winner=' + r.winner + ' | total_runs=' + r.total_runs + ' | MOM=' + r.man_of_match);
    } else {
      console.log(mid + ': NO RESULTS ENTERED YET');
    }
  });

  // Get all bets for locked matches
  const { data: bets } = await sb
    .from('bets')
    .select('match_id, user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points, answers, player_picks, side_bet_answers')
    .in('match_id', lockedIds)
    .order('match_id')
    .order('user_id');

  // User names
  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  // Config map
  const configMap = {};
  configs.forEach(c => { configMap[c.match_id] = c; });

  // Side bets config
  const { data: sideBets } = await sb
    .from('side_bets')
    .select('*')
    .in('match_id', lockedIds);
  console.log('\n=== SIDE BETS CONFIG ===');
  (sideBets || []).forEach(s => {
    console.log(s.match_id + ': id=' + s.side_bet_id + ' | Q: ' + (s.question || '').slice(0,70) +
      ' | correct_pts=' + s.correct_points + '/' + s.points_correct +
      ' | wrong_pts=' + s.wrong_points + '/' + s.points_wrong +
      ' | correct_answer=' + s.correct_answer);
  });

  // Player slots
  const { data: slots } = await sb
    .from('player_slots')
    .select('match_id, slot_number, multiplier, is_enabled')
    .in('match_id', lockedIds);
  console.log('\n=== PLAYER SLOTS ===');
  const slotsByMatch = {};
  (slots || []).forEach(s => {
    if (!slotsByMatch[s.match_id]) slotsByMatch[s.match_id] = [];
    slotsByMatch[s.match_id].push(s);
  });
  Object.keys(slotsByMatch).sort().forEach(mid => {
    const ss = slotsByMatch[mid].sort((a,b) => a.slot_number - b.slot_number);
    console.log(mid + ': ' + ss.map(s => 'slot' + s.slot_number + '=' + s.multiplier + 'x' + (s.is_enabled ? '' : ' (disabled)')).join(', '));
  });

  // Player match stats
  const { data: stats } = await sb
    .from('player_match_stats')
    .select('*')
    .in('match_id', lockedIds);
  console.log('\n=== PLAYER MATCH STATS ===');
  console.log('Total entries: ' + (stats || []).length);
  (stats || []).forEach(s => {
    console.log(s.match_id + ' | player=' + s.player_id + ' | fantasy_pts=' + s.total_fantasy_points);
  });

  // Show bets per match
  for (const mid of lockedIds) {
    const config = configMap[mid];
    const result = resultMap[mid];
    const matchBets = bets.filter(b => b.match_id === mid);

    console.log('\n' + '='.repeat(100));
    console.log(mid.toUpperCase() + ': ' + config.team_a + ' vs ' + config.team_b +
      ' | Status: ' + config.status +
      ' | Result: ' + (result ? 'winner=' + result.winner + ', runs=' + result.total_runs : 'NO RESULT'));
    console.log('='.repeat(100));

    console.log(
      'User'.padEnd(22) + '| ' +
      'Pick'.padEnd(6) + '| ' +
      'Runs Bet'.padEnd(9) + '| ' +
      'Players'.padEnd(40) + '| ' +
      'Side Bets'.padEnd(20) + '| ' +
      'Score'
    );
    console.log('-'.repeat(110));

    matchBets.forEach(b => {
      const name = (nameMap[b.user_id] || b.user_id.slice(0,8)).padEnd(21);
      const answers = b.answers || {};

      // Winner pick
      const winnerKey = Object.keys(answers).find(k => k.includes(mid + '_winner'));
      const userWinner = winnerKey ? answers[winnerKey] : null;
      let pickLabel = '—';
      if (userWinner && userWinner.includes('teamA')) pickLabel = config.team_a;
      else if (userWinner && userWinner.includes('teamB')) pickLabel = config.team_b;

      // Runs
      const runsKey = Object.keys(answers).find(k => k.includes(mid + '_total_runs'));
      const userRuns = runsKey ? answers[runsKey] : '—';

      // Player picks
      const pp = b.player_picks || [];
      let playerStr = '—';
      if (pp.length > 0) {
        playerStr = pp.map(p => 'slot' + p.slot + ':' + (p.player_id || '?').slice(0,8)).join(', ');
      }

      // Side bet answers
      const sba = b.side_bet_answers || {};
      let sideStr = '—';
      if (Object.keys(sba).length > 0) {
        sideStr = JSON.stringify(sba).slice(0,18);
      }

      console.log(
        name + ' | ' +
        pickLabel.padEnd(4) + ' | ' +
        String(userRuns).padStart(7) + ' | ' +
        playerStr.padEnd(38) + ' | ' +
        sideStr.padEnd(18) + ' | ' +
        String(b.score === null ? 'NULL' : b.score).padStart(5)
      );
    });
  }

  // Also get match questions for these matches
  const { data: questions } = await sb
    .from('match_questions')
    .select('match_id, question_id, kind, correct_answer, section')
    .in('match_id', lockedIds);
  console.log('\n=== MATCH QUESTIONS ===');
  (questions || []).sort((a,b) => a.match_id.localeCompare(b.match_id) || a.question_id.localeCompare(b.question_id));
  (questions || []).forEach(q => {
    console.log(q.match_id + ' | ' + q.question_id + ' | kind=' + q.kind + ' | section=' + q.section + ' | correct=' + q.correct_answer);
  });
})();
