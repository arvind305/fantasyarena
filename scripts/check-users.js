require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: allBets } = await sb.from('bets')
    .select('user_id, match_id, score')
    .order('user_id');

  const byUser = {};
  for (const b of (allBets || [])) {
    if (!byUser[b.user_id]) byUser[b.user_id] = [];
    byUser[b.user_id].push(b.match_id + (b.score !== null ? '(' + b.score + ')' : '(unscored)'));
  }

  console.log('=== ALL USERS IN BETS TABLE ===');
  for (const [uid, matches] of Object.entries(byUser)) {
    console.log('uid:', uid);
    console.log('  matches:', matches.join(', '));
  }

  // Lock wc_m8
  console.log('\n=== LOCKING wc_m8 ===');
  const { error: lockErr } = await sb.from('match_config')
    .update({ status: 'LOCKED' })
    .eq('match_id', 'wc_m8');
  if (lockErr) console.log('Error locking:', lockErr.message);
  else console.log('wc_m8 LOCKED');

  await sb.from('match_questions')
    .update({ status: 'CLOSED' })
    .eq('match_id', 'wc_m8');
  console.log('wc_m8 questions CLOSED');
})();
