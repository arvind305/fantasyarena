const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const MATCHES = ['wc_m1','wc_m2','wc_m3','wc_m4','wc_m5','wc_m6'];

(async () => {
  // 1. Match config - point values
  const { data: configs } = await sb
    .from('match_config')
    .select('match_id, team_a, team_b, winner_base_points, total_runs_base_points, status')
    .in('match_id', MATCHES);

  console.log('=== MATCH CONFIG (Point Values) ===');
  configs.sort((a,b) => a.match_id.localeCompare(b.match_id));
  configs.forEach(c => {
    console.log(c.match_id + ': ' + c.team_a + ' vs ' + c.team_b +
      ' | winner_pts=' + c.winner_base_points +
      ' | runs_pts=' + c.total_runs_base_points +
      ' | status=' + c.status);
  });

  // 2. Match results
  const { data: results } = await sb
    .from('match_results')
    .select('*')
    .in('match_id', MATCHES);

  console.log('\n=== MATCH RESULTS ===');
  (results || []).sort((a,b) => a.match_id.localeCompare(b.match_id));
  (results || []).forEach(r => {
    console.log(JSON.stringify(r));
  });

  // 3. All bets (including unscored)
  const { data: bets } = await sb
    .from('bets')
    .select('*')
    .in('match_id', MATCHES)
    .order('match_id')
    .order('user_id');

  console.log('\n=== ALL BETS (scored and unscored) ===');
  console.log('Total bets: ' + bets.length);
  bets.forEach(b => {
    console.log(b.match_id + ' | user=' + b.user_id.slice(0,8) +
      ' | score=' + b.score +
      ' | winner_pts=' + b.winner_points +
      ' | runs_pts=' + b.total_runs_points +
      ' | player_pts=' + b.player_pick_points +
      ' | side_pts=' + b.side_bet_points +
      ' | runner_pts=' + b.runner_points +
      ' | answers=' + JSON.stringify(b.answers) +
      ' | player_picks=' + JSON.stringify(b.player_picks) +
      ' | side_bet_answers=' + JSON.stringify(b.side_bet_answers));
  });

  // 4. Player slots for these matches
  const { data: slots } = await sb
    .from('player_slots')
    .select('match_id, slot_number, multiplier')
    .in('match_id', MATCHES);

  console.log('\n=== PLAYER SLOTS ===');
  const slotsByMatch = {};
  (slots || []).forEach(s => {
    if (!slotsByMatch[s.match_id]) slotsByMatch[s.match_id] = [];
    slotsByMatch[s.match_id].push(s);
  });
  Object.keys(slotsByMatch).sort().forEach(mid => {
    const ss = slotsByMatch[mid].sort((a,b) => a.slot_number - b.slot_number);
    console.log(mid + ': ' + ss.map(s => 'slot' + s.slot_number + '=' + s.multiplier + 'x').join(', '));
  });

  // 5. Side bets for these matches
  const { data: sideBets } = await sb
    .from('side_bets')
    .select('match_id, bet_id, side_bet_id, question, correct_points, wrong_points, correct_answer, points_correct, points_wrong')
    .in('match_id', MATCHES);

  console.log('\n=== SIDE BETS ===');
  (sideBets || []).sort((a,b) => a.match_id.localeCompare(b.match_id));
  (sideBets || []).forEach(s => {
    console.log(s.match_id + ': id=' + s.side_bet_id + ' | correct_pts=' + s.correct_points + '/' + s.points_correct +
      ' | wrong_pts=' + s.wrong_points + '/' + s.points_wrong +
      ' | correct_answer=' + s.correct_answer + ' | Q: ' + (s.question || '').slice(0,60));
  });

  // 6. Player match stats
  const { data: stats } = await sb
    .from('player_match_stats')
    .select('match_id, player_id, runs_scored, wickets_taken, catches, stumpings, run_outs, total_fantasy_points')
    .in('match_id', MATCHES);

  console.log('\n=== PLAYER MATCH STATS ===');
  console.log('Total stats entries: ' + (stats || []).length);
  (stats || []).forEach(s => {
    console.log(s.match_id + ' | player=' + s.player_id + ' | runs=' + s.runs_scored + ' | wkts=' + s.wickets_taken + ' | fantasy_pts=' + s.total_fantasy_points);
  });

  // 7. Get user names
  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb
    .from('leaderboard')
    .select('user_id, display_name, total_score')
    .in('user_id', userIds);

  console.log('\n=== USERS ===');
  (users || []).forEach(u => {
    console.log(u.user_id + ' | ' + u.display_name + ' | leaderboard_total=' + u.total_score);
  });

  // 8. Match questions
  const { data: questions } = await sb
    .from('match_questions')
    .select('match_id, question_id, kind, correct_answer, options, points, points_wrong, section')
    .in('match_id', MATCHES);

  console.log('\n=== MATCH QUESTIONS ===');
  (questions || []).sort((a,b) => a.match_id.localeCompare(b.match_id) || a.question_id.localeCompare(b.question_id));
  (questions || []).forEach(q => {
    console.log(q.match_id + ' | ' + q.question_id + ' | kind=' + q.kind + ' | section=' + q.section + ' | correct=' + q.correct_answer + ' | pts=' + q.points + '/' + q.points_wrong);
  });
})();
