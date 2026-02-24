const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const arvindId = '104262282893186176547';

  // Step 1: Get memberships
  const { data: memberships } = await sb.from('group_members').select('group_id').eq('user_id', arvindId);
  if (!memberships || memberships.length === 0) { console.log('No memberships'); return; }
  const groupIds = memberships.map(m => m.group_id);

  // Step 2: Get groups (no FK join)
  const { data: groups, error: gErr } = await sb.from('groups').select('*').in('group_id', groupIds);
  if (gErr) { console.error('Groups error:', gErr.message); return; }

  // Step 3: Get members separately
  const { data: allMembers } = await sb.from('group_members').select('group_id, user_id, display_name, score').in('group_id', groupIds);
  const membersByGroup = {};
  (allMembers || []).forEach(m => {
    if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
    membersByGroup[m.group_id].push(m);
  });

  // Step 4: Build result
  const result = groups.map(g => {
    const gMembers = membersByGroup[g.group_id] || [];
    return {
      groupId: g.group_id,
      name: g.name,
      joinCode: g.join_code,
      members: gMembers.map(m => ({ userId: m.user_id, displayName: m.display_name, score: m.score }))
    };
  });

  console.log('Groups for Arvind:');
  console.log(JSON.stringify(result, null, 2));
})();
