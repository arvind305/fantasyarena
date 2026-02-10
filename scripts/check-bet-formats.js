const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const { data: bets } = await sb
    .from('bets')
    .select('match_id, user_id, answers, player_picks, side_bet_answers')
    .in('match_id', ['wc_m8', 'wc_m9', 'wc_m10'])
    .order('match_id')
    .order('user_id');

  const userIds = [...new Set(bets.map(b => b.user_id))];
  const { data: users } = await sb.from('users').select('user_id, display_name').in('user_id', userIds);
  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  bets.forEach(b => {
    const name = nameMap[b.user_id] || b.user_id.slice(0,12);
    console.log('\n--- ' + b.match_id + ' | ' + name + ' ---');
    console.log('  answers:', JSON.stringify(b.answers));
    console.log('  player_picks:', JSON.stringify(b.player_picks));
    console.log('  side_bet_answers:', JSON.stringify(b.side_bet_answers));
  });
})();
