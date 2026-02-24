/**
 * Show side bets, player slots, and user bets for given matches.
 * Usage: node scripts/check-match-setup.js wc_m16 wc_m17 wc_m18
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

const matchIds = process.argv.slice(2);
if (matchIds.length === 0) {
  console.log('Usage: node scripts/check-match-setup.js wc_m16 wc_m17 wc_m18');
  process.exit(0);
}

(async () => {
  for (const mid of matchIds) {
    const { data: mc } = await sb.from('match_config').select('*').eq('match_id', mid).single();
    console.log('=== ' + mid + ': ' + mc.team_a + ' vs ' + mc.team_b + ' ===');
    console.log('  Status: ' + mc.status);
    console.log('  Winner base points: ' + mc.winner_base_points);
    console.log('  Total runs base points: ' + mc.total_runs_base_points);
    console.log();

    // Side bets
    const { data: sbs } = await sb.from('side_bets').select('*').eq('match_id', mid);
    for (const s of (sbs || [])) {
      console.log('  Side bet: ' + s.question_text);
      console.log('    Options: ' + JSON.stringify(s.options));
      console.log('    Points: correct=' + s.points_correct + ', wrong=' + s.points_wrong);
      console.log('    ID: ' + s.side_bet_id);
    }
    console.log();

    // Player slots
    const { data: ps } = await sb.from('player_slots').select('*').eq('match_id', mid).order('slot_number');
    console.log('  Player slots:');
    for (const p of (ps || [])) {
      console.log('    Slot ' + p.slot_number + ': ' + p.multiplier + 'x' + (p.is_enabled ? '' : ' (DISABLED)'));
    }
    console.log();

    // Match questions
    const { data: qs } = await sb.from('match_questions').select('*').eq('match_id', mid).order('kind');
    console.log('  Match questions:');
    for (const q of (qs || [])) {
      console.log('    [' + q.kind + '] ' + q.question_id + ' — pts: ' + q.points);
      if (q.options) {
        for (const opt of q.options) {
          console.log('      ' + (opt.optionId || opt.option_id) + ' → ' + (opt.label || opt.text));
        }
      }
    }
    console.log();

    // Bets placed
    const { data: bets } = await sb.from('bets').select('user_id, answers, player_picks, side_bet_answers').eq('match_id', mid);
    const { data: lb } = await sb.from('leaderboard').select('user_id, display_name');
    const nameMap = {};
    for (const l of (lb || [])) nameMap[l.user_id] = l.display_name;

    console.log('  Bets placed: ' + (bets || []).length);
    for (const b of (bets || [])) {
      const name = nameMap[b.user_id] || b.user_id.substring(0, 12);
      const picks = (b.player_picks || []).map(p => p.player_name || 'unknown').join(', ');
      console.log('    ' + name + ': winner=' + (b.answers?.['q_' + mid + '_winner'] || '?') +
        ', runs=' + (b.answers?.['q_' + mid + '_total_runs'] || '?') +
        ', players=[' + picks + ']');
    }
    console.log('\n');
  }
})();
