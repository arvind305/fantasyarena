require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const { data: bets } = await sb.from('bets').select('user_id,player_picks,runner_picks').eq('match_id', 'wc_m19');
  console.log('Bets:', bets.length);
  const pickedIds = new Set();
  bets.forEach(b => {
    (b.player_picks || []).forEach(p => {
      pickedIds.add(p.player_id);
      console.log('  Pick:', p.player_name, p.player_id.slice(0, 8));
    });
    (b.runner_picks || []).forEach(p => {
      pickedIds.add(p.player_id);
      console.log('  Runner:', p.player_name, p.player_id.slice(0, 8));
    });
  });
  console.log('\nUnique picked IDs:');
  pickedIds.forEach(id => console.log(' ', id));
})();
