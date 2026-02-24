require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Check users table for profile info
  const { data: users, error } = await sb.from('users').select('user_id, display_name, email');
  if (error) {
    console.log('Error querying users table:', error.message);
    return;
  }

  console.log('=== USERS TABLE ===');
  for (const u of (users || [])) {
    console.log('uid:', u.user_id, ' name:', u.display_name, ' email:', u.email);
  }

  // Now fix leaderboard entries that show "Player"
  const { data: playerEntries } = await sb.from('leaderboard')
    .select('user_id, display_name')
    .eq('event_id', 't20wc_2026')
    .eq('display_name', 'Player');

  console.log('\n=== FIXING "Player" ENTRIES ===');
  const userMap = {};
  for (const u of (users || [])) {
    userMap[u.user_id] = u.display_name;
  }

  for (const entry of (playerEntries || [])) {
    const realName = userMap[entry.user_id];
    if (realName && realName !== 'Player') {
      const { error: upErr } = await sb.from('leaderboard')
        .update({ display_name: realName })
        .eq('user_id', entry.user_id)
        .eq('event_id', 't20wc_2026');
      if (upErr) {
        console.log('Error updating', entry.user_id, ':', upErr.message);
      } else {
        console.log('Fixed:', entry.user_id, '->', realName);
      }
    } else {
      console.log('No name found for:', entry.user_id);
    }
  }

  // Show final leaderboard
  console.log('\n=== UPDATED LEADERBOARD ===');
  const { data: lb } = await sb.from('leaderboard')
    .select('display_name, total_score, matches_played, rank')
    .eq('event_id', 't20wc_2026')
    .order('rank');
  for (const p of (lb || [])) {
    console.log('  #' + p.rank, p.display_name.padEnd(22), p.total_score + ' pts', '(' + p.matches_played + ' matches)');
  }
})();
