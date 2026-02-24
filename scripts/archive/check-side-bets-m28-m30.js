require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const { data, error } = await sb
    .from('side_bets')
    .select('*')
    .in('match_id', ['wc_m28', 'wc_m29', 'wc_m30'])
    .order('match_id');

  if (error) { console.error('Error:', error.message); return; }

  for (const s of data) {
    console.log('\n' + s.match_id + ':');
    console.log(JSON.stringify(s, null, 2));
  }
})();
