const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Check groups table
  const { data: groups, error: gErr } = await sb.from('groups').select('*');
  console.log('=== GROUPS TABLE ===');
  if (gErr) console.error('Error:', gErr.message);
  else if (!groups || groups.length === 0) console.log('No groups found');
  else groups.forEach(g => console.log(JSON.stringify(g)));

  // Check group_members table
  const { data: members, error: mErr } = await sb.from('group_members').select('*');
  console.log('\n=== GROUP_MEMBERS TABLE ===');
  if (mErr) console.error('Error:', mErr.message);
  else if (!members || members.length === 0) console.log('No members found');
  else members.forEach(m => console.log(JSON.stringify(m)));

  // Check RLS policies - try inserting and selecting as anon
  console.log('\n=== RLS CHECK ===');
  const anonSb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

  const { data: anonGroups, error: anonGErr } = await anonSb.from('groups').select('*');
  console.log('Anon select groups:', anonGErr ? `ERROR: ${anonGErr.message}` : `${(anonGroups || []).length} rows`);

  const { data: anonMembers, error: anonMErr } = await anonSb.from('group_members').select('*');
  console.log('Anon select group_members:', anonMErr ? `ERROR: ${anonMErr.message}` : `${(anonMembers || []).length} rows`);

  // Test anon insert into groups
  const testId = 'test_' + Date.now();
  const { error: insertGErr } = await anonSb.from('groups').insert({
    group_id: testId, name: 'Test', join_code: 'TST-0000', created_by: 'test', event_id: 't20wc_2026'
  });
  console.log('Anon insert groups:', insertGErr ? `ERROR: ${insertGErr.message}` : 'OK');

  // Test anon insert into group_members
  const { error: insertMErr } = await anonSb.from('group_members').insert({
    group_id: testId, user_id: 'test', display_name: 'Test', score: 0
  });
  console.log('Anon insert group_members:', insertMErr ? `ERROR: ${insertMErr.message}` : 'OK');

  // Cleanup test data
  await sb.from('group_members').delete().eq('group_id', testId);
  await sb.from('groups').delete().eq('group_id', testId);
  console.log('Test data cleaned up');
})();
