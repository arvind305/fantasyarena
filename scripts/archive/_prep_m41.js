require('dotenv').config({path:'ui/.env'});
require('dotenv').config();
const {createClient} = require('@supabase/supabase-js');
const s = createClient(process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Match config
  const {data: cfg} = await s.from('match_config').select('*').eq('match_id', 'wc_m41').single();
  console.log('Match:', cfg.match_id, cfg.team_a, 'vs', cfg.team_b, 'status:', cfg.status);
  console.log('Winner base:', cfg.winner_base_points, 'Wrong:', cfg.winner_wrong_points);
  console.log('Runs base:', cfg.total_runs_base_points);
  console.log('Player slots:', cfg.player_slots_enabled, 'count:', cfg.player_slot_count);

  // Player slots
  const {data: slots} = await s.from('player_slots').select('*').eq('match_id', 'wc_m41').order('slot_number');
  console.log('\nSlots:');
  slots.forEach(sl => console.log(`  S${sl.slot_number}: ${sl.multiplier}x, enabled=${sl.is_enabled}`));

  // Side bets
  const {data: sbs} = await s.from('side_bets').select('*').eq('match_id', 'wc_m41');
  console.log('\nSide bets:', sbs.length);
  sbs.forEach(sb => console.log(`  ${sb.side_bet_id}: "${sb.question_text}" correct=${sb.correct_answer}, pts=${sb.points_correct}/${sb.points_wrong}`));

  // Match questions
  const {data: mqs} = await s.from('match_questions').select('*').eq('match_id', 'wc_m41');
  console.log('\nMatch questions:', mqs.length);
  mqs.forEach(q => console.log(`  ${q.question_id}: kind=${q.kind}, section=${q.section}, status=${q.status}`));

  // Bets
  const {data: users} = await s.from('users').select('user_id, display_name');
  const uMap = {};
  users.forEach(u => { uMap[u.user_id] = u.display_name; });

  const {data: bets} = await s.from('bets').select('*').eq('match_id', 'wc_m41');
  console.log('\nBets:', bets.length);
  for (const b of bets) {
    const name = uMap[b.user_id] || b.user_id;
    const winner = b.answers ? Object.values(b.answers).find(v => typeof v === 'string') : null;
    const picks = (b.player_picks || []).map(p => `${p.player_name}(S${p.slot})`).join(', ');
    const sbAnswers = b.side_bet_answers ? Object.entries(b.side_bet_answers).map(([k,v]) => v).join(', ') : 'none';
    console.log(`  ${name.padEnd(22)} winner=${winner || 'none'}, picks=[${picks}], side_bets=[${sbAnswers}]`);
  }

  // Match results (check if already exists)
  const {data: mr} = await s.from('match_results').select('*').eq('match_id', 'wc_m41').maybeSingle();
  console.log('\nExisting match_results:', mr ? JSON.stringify(mr) : 'NONE');
})();
