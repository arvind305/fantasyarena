const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Find the mystery user - starts with 10012248
  const { data: bets } = await sb
    .from('bets')
    .select('user_id')
    .like('user_id', '10012248%');

  if (!bets || bets.length === 0) { console.log('No bets found for 10012248*'); return; }
  const userId = bets[0].user_id;
  console.log('Full user_id: ' + userId);

  // Check users table
  const { data: user, error: userErr } = await sb
    .from('users')
    .select('*')
    .eq('user_id', userId);
  console.log('\n=== USERS TABLE ===');
  console.log('Error:', userErr);
  console.log('Data:', JSON.stringify(user, null, 2));

  // Check leaderboard
  const { data: lb, error: lbErr } = await sb
    .from('leaderboard')
    .select('*')
    .eq('user_id', userId);
  console.log('\n=== LEADERBOARD TABLE ===');
  console.log('Error:', lbErr);
  console.log('Data:', JSON.stringify(lb, null, 2));

  // Check all their bets
  const { data: allBets } = await sb
    .from('bets')
    .select('match_id, score, answers')
    .eq('user_id', userId);
  console.log('\n=== ALL BETS ===');
  (allBets || []).forEach(b => {
    console.log(b.match_id + ' | score=' + b.score + ' | answers=' + JSON.stringify(b.answers));
  });
})();
