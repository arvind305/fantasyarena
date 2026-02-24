const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const newLock = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  console.log('Setting wc_m34 (RSA vs UAE) lock_time to:', newLock);
  console.log('IST:', new Date(newLock).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

  const { error } = await sb.from('match_config')
    .update({ status: 'OPEN', lock_time: newLock })
    .eq('match_id', 'wc_m34');

  if (error) { console.error('Error:', error.message); return; }

  // Verify
  const { data } = await sb.from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .eq('match_id', 'wc_m34')
    .single();
  console.log('Verified:', JSON.stringify(data));
})();
