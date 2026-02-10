require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Check RLS policies on long_term tables
  const { data, error } = await sb.rpc('exec_sql', {
    sql: "SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('long_term_bets_config', 'long_term_bets') ORDER BY tablename, policyname"
  });
  
  if (error) {
    // Try direct query approach
    console.log('RPC not available, checking via direct query...');
    
    // Test: can anon-key user insert into long_term_bets_config?
    const anonSb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
    
    const { error: e1 } = await anonSb.from('long_term_bets_config').select('*').limit(1);
    console.log('long_term_bets_config SELECT:', e1 ? 'BLOCKED: ' + e1.message : 'OK');
    
    const { error: e2 } = await anonSb.from('long_term_bets').select('*').limit(1);
    console.log('long_term_bets SELECT:', e2 ? 'BLOCKED: ' + e2.message : 'OK');
    
    // Test with service role
    const { error: e3 } = await sb.from('long_term_bets_config').select('*').limit(1);
    console.log('long_term_bets_config SELECT (service_role):', e3 ? 'BLOCKED: ' + e3.message : 'OK');
    
    const { data: configData } = await sb.from('long_term_bets_config').select('*');
    console.log('\nExisting long_term_bets_config rows:', (configData || []).length);
    if (configData) configData.forEach(c => console.log('  event_id:', c.event_id, 'is_locked:', c.is_locked));
    
    const { data: betsData } = await sb.from('long_term_bets').select('user_id, event_id').limit(10);
    console.log('Existing long_term_bets rows:', (betsData || []).length);
  } else {
    console.log('RLS Policies:');
    console.log(JSON.stringify(data, null, 2));
  }
})();
