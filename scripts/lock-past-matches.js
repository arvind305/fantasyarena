/**
 * Lock all matches whose lock_time has passed but are still OPEN.
 * Also locks their bets and match_questions.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const now = new Date().toISOString();

  // Find OPEN matches whose lock_time has passed
  const { data: openPast } = await sb.from('match_config')
    .select('match_id, team_a, team_b, lock_time, status')
    .eq('status', 'OPEN')
    .lt('lock_time', now);

  if (!openPast || openPast.length === 0) {
    console.log('No OPEN matches past their lock time. All good.');
    return;
  }

  console.log('Found', openPast.length, 'OPEN matches past lock_time:');
  for (const m of openPast) {
    console.log(' ', m.match_id, m.team_a, 'v', m.team_b, '- lock:', m.lock_time);

    // Lock match config
    await sb.from('match_config').update({ status: 'LOCKED' }).eq('match_id', m.match_id);

    // Lock match questions
    await sb.from('match_questions').update({ status: 'CLOSED' }).eq('match_id', m.match_id);

    // Lock all bets for this match
    const { data: locked } = await sb.from('bets')
      .update({ is_locked: true })
      .eq('match_id', m.match_id)
      .select('bet_id');
    console.log('    Locked', locked?.length || 0, 'bets');
  }

  console.log('\nDone! All past-lock-time matches are now LOCKED.');
})();
