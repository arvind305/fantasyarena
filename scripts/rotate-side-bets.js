/**
 * rotate-side-bets.js — Rotates side bet templates daily for upcoming matches.
 * Matches that already have bets placed on their side bets are left unchanged.
 * Only matches with 0 user responses get refreshed templates.
 *
 * Usage: node scripts/rotate-side-bets.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const allTemplates = require('../data/side-bet-templates.json').templates;

// Pick 4 random templates (different from a given set)
function pickRandom(exclude, count) {
  const available = allTemplates.filter(t => !exclude.includes(t.id));
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

(async () => {
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Get upcoming matches (within 3 days, not scored)
  const { data: configs } = await sb.from('match_config')
    .select('match_id, lock_time, status')
    .gte('lock_time', now.toISOString())
    .lte('lock_time', threeDays.toISOString())
    .neq('status', 'SCORED');

  console.log('Checking', (configs || []).length, 'upcoming matches for side bet rotation...');

  for (const m of (configs || [])) {
    // Get current side bets
    const { data: current } = await sb.from('side_bets')
      .select('side_bet_id, question_text')
      .eq('match_id', m.match_id);

    if (!current || current.length === 0) continue;

    // Check if any user has answered these side bets
    const { data: betsWithAnswers } = await sb.from('bets')
      .select('side_bet_answers')
      .eq('match_id', m.match_id)
      .not('side_bet_answers', 'is', null);

    const hasUserAnswers = (betsWithAnswers || []).some(b => {
      const answers = b.side_bet_answers;
      return answers && typeof answers === 'object' && Object.keys(answers).length > 0;
    });

    if (hasUserAnswers) {
      console.log(' ', m.match_id, '- has user answers, skipping rotation');
      continue;
    }

    // Rotate: delete old, add new random templates
    const picked = pickRandom([], 4);
    await sb.from('side_bets').delete().eq('match_id', m.match_id);
    const rows = picked.map((t, i) => ({
      match_id: m.match_id,
      question_text: t.question_text,
      options: t.options,
      points_correct: t.suggested_points_correct,
      points_wrong: t.suggested_points_wrong,
      display_order: i,
      status: 'OPEN',
    }));
    await sb.from('side_bets').insert(rows);
    console.log(' ', m.match_id, '- rotated to:', picked.map(t => t.id).join(', '));
  }

  console.log('Done.');
})();
