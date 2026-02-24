const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

// Test with anon key (same as frontend)
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const arvindId = '104262282893186176547';
  const aditiId = '111161241536267635314';

  // Simulate apiGetGroups for Arvind
  console.log('=== apiGetGroups for Arvind ===');
  const { data: memberships, error: memberError } = await sb
    .from('group_members')
    .select('group_id')
    .eq('user_id', arvindId);
  console.log('Memberships:', memberships, 'Error:', memberError?.message);

  if (memberships && memberships.length > 0) {
    const groupIds = memberships.map(m => m.group_id);
    console.log('Group IDs:', groupIds);
    const { data: groups, error: groupError } = await sb
      .from('groups')
      .select('*, group_members(user_id, display_name, score)')
      .in('group_id', groupIds);
    console.log('Groups:', JSON.stringify(groups, null, 2));
    console.log('Error:', groupError?.message);
  }

  // Simulate apiGetGroups for Aditi
  console.log('\n=== apiGetGroups for Aditi ===');
  const { data: aditiMemberships } = await sb
    .from('group_members')
    .select('group_id')
    .eq('user_id', aditiId);
  console.log('Memberships:', aditiMemberships);

  if (aditiMemberships && aditiMemberships.length > 0) {
    const groupIds = aditiMemberships.map(m => m.group_id);
    const { data: groups } = await sb
      .from('groups')
      .select('*, group_members(user_id, display_name, score)')
      .in('group_id', groupIds);
    console.log('Groups:', JSON.stringify(groups, null, 2));
  }
})();
