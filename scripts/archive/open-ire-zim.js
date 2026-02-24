const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // First check current state
  const { data: before } = await sb.from('match_config')
    .select('match_id, team_a, team_b, status, lock_time')
    .eq('match_id', 'wc_m32')
    .single();

  console.log('BEFORE:', before);

  // Update to OPEN with a new lock_time far enough in the future (user will manually close)
  // Set lock_time to 11:59 PM IST today = 6:29 PM UTC
  const { data, error } = await sb.from('match_config')
    .update({ status: 'OPEN', lock_time: '2026-02-17T18:29:00+00:00' })
    .eq('match_id', 'wc_m32')
    .select();

  if (error) {
    console.error('Error updating:', error);
    return;
  }

  console.log('AFTER:', data[0]);
  console.log('\nwc_m32 (IRE vs ZIM) is now OPEN for betting.');
  console.log('Lock time set to 11:59 PM IST (18:29 UTC) — user will manually close.');
})();
