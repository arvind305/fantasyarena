require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const templates = require('../data/side-bet-templates.json').templates;

// Default side bets to add to every match (4 good variety picks)
const DEFAULT_TEMPLATE_IDS = [
  'powerplay_runs_first_innings',  // Phase-wise - How many runs in powerplay?
  'total_sixes_in_match',          // Batting - How many sixes?
  'wides_over_10',                 // Bowling - Wides > 10?
  'will_match_go_to_last_over',    // Match flow - Last over?
];

(async () => {
  const now = new Date();

  // 1. Open ALL non-scored matches
  console.log('=== STEP 1: Open all non-scored matches ===');
  const { data: configs } = await sb.from('match_config')
    .select('match_id, status, lock_time')
    .order('lock_time');

  let opened = 0;
  let locked = 0;
  for (const m of configs) {
    if (m.status === 'SCORED') continue;
    
    const lockDate = new Date(m.lock_time);
    if (lockDate < now) {
      // Past matches -> LOCKED
      if (m.status !== 'LOCKED') {
        await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', m.match_id);
        await sb.from('match_questions').update({ status: 'CLOSED' }).eq('match_id', m.match_id);
        console.log('  LOCKED', m.match_id, '(past lock_time)');
        locked++;
      }
    } else {
      // Future matches -> OPEN
      if (m.status !== 'OPEN') {
        await sb.from('match_config').update({ status: 'OPEN' }).eq('match_id', m.match_id);
        await sb.from('match_questions').update({ status: 'OPEN' }).eq('match_id', m.match_id);
        console.log('  OPENED', m.match_id);
        opened++;
      }
    }
  }
  console.log('Opened:', opened, '| Locked:', locked);

  // 2. Auto-populate side bets for ALL matches that don't have any
  console.log('\n=== STEP 2: Auto-populate side bets ===');
  const defaultTemplates = templates.filter(t => DEFAULT_TEMPLATE_IDS.includes(t.id));
  console.log('Default templates:', defaultTemplates.map(t => t.id).join(', '));

  let added = 0;
  for (const m of configs) {
    // Check if match already has side bets
    const { data: existing } = await sb.from('side_bets')
      .select('side_bet_id')
      .eq('match_id', m.match_id);

    if (existing && existing.length > 0) continue;

    // Add default templates
    const rows = defaultTemplates.map((t, i) => ({
      match_id: m.match_id,
      question_text: t.question_text,
      options: t.options,
      points_correct: t.suggested_points_correct,
      points_wrong: t.suggested_points_wrong,
      display_order: i,
      status: 'OPEN',
    }));

    const { error } = await sb.from('side_bets').insert(rows);
    if (error) {
      console.log('  Error adding to', m.match_id, ':', error.message);
    } else {
      console.log('  Added', rows.length, 'side bets to', m.match_id);
      added++;
    }
  }
  console.log('Matches with new side bets:', added);

  // 3. Summary
  console.log('\n=== FINAL STATE ===');
  const { data: summary } = await sb.from('match_config')
    .select('status')
    .order('status');
  const counts = {};
  for (const s of summary) counts[s.status] = (counts[s.status] || 0) + 1;
  console.log('Match statuses:', JSON.stringify(counts));

  const { data: sbCount } = await sb.from('side_bets').select('match_id');
  const sbMatches = new Set((sbCount || []).map(s => s.match_id));
  console.log('Matches with side bets:', sbMatches.size, 'of 55');
})();
