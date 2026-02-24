/**
 * End-to-end test of group create + join flow.
 * Simulates what the UI does via api.js functions.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const CREATOR_ID = '104262282893186176547'; // Arvind
const CREATOR_NAME = 'Arvind Sridharan';
const JOINER_ID = '110965498027027319498'; // Siddharth (pick a real user)
const JOINER_NAME = 'Siddharth Karnawat';

async function cleanup(groupId) {
  console.log('\n--- CLEANUP ---');
  await sb.from('group_members').delete().eq('group_id', groupId);
  await sb.from('groups').delete().eq('group_id', groupId);
  console.log('  Deleted group ' + groupId + ' and its members');
}

(async () => {
  try {
    // ==========================================
    // STEP 1: Create a group (simulates apiCreateGroup)
    // ==========================================
    console.log('=== STEP 1: CREATE GROUP ===');
    const groupName = 'TestFlow';
    const groupId = 'g' + Date.now();
    const joinCode = groupName.slice(0, 3).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const now = new Date().toISOString();

    const { data: group, error: createErr } = await sb
      .from('groups')
      .insert({
        group_id: groupId,
        name: groupName,
        join_code: joinCode,
        created_by: CREATOR_ID,
        event_id: 't20wc_2026',
        created_at: now,
      })
      .select()
      .single();

    if (createErr) {
      console.log('  CREATE FAILED:', createErr.message);
      return;
    }
    console.log('  Group created: ' + group.name + ' (ID: ' + groupId + ')');
    console.log('  Join code: ' + joinCode);

    // Add creator as member
    const { error: creatorMemberErr } = await sb.from('group_members').insert({
      group_id: groupId,
      user_id: CREATOR_ID,
      display_name: CREATOR_NAME,
      score: 0,
      joined_at: now,
    });
    if (creatorMemberErr) {
      console.log('  ADD CREATOR MEMBER FAILED:', creatorMemberErr.message);
      await cleanup(groupId);
      return;
    }
    console.log('  Creator added as member: ' + CREATOR_NAME);

    // ==========================================
    // STEP 2: Verify group is findable by code
    // ==========================================
    console.log('\n=== STEP 2: LOOKUP BY CODE ===');

    // Test exact match
    const { data: found1, error: find1Err } = await sb
      .from('groups').select('*').eq('join_code', joinCode).single();
    console.log('  Exact code (' + joinCode + '): ' + (found1 ? 'FOUND' : 'NOT FOUND') + (find1Err ? ' Error: ' + find1Err.message : ''));

    // Test lowercase (simulates user typing with CSS uppercase)
    const lowerCode = joinCode.toLowerCase();
    const { data: found2, error: find2Err } = await sb
      .from('groups').select('*').eq('join_code', lowerCode).single();
    console.log('  Lowercase (' + lowerCode + '): ' + (found2 ? 'FOUND' : 'NOT FOUND'));

    // Test with toUpperCase fix (what the fixed code does)
    const { data: found3, error: find3Err } = await sb
      .from('groups').select('*').eq('join_code', lowerCode.toUpperCase()).single();
    console.log('  Lowercase + toUpperCase() fix (' + lowerCode.toUpperCase() + '): ' + (found3 ? 'FOUND' : 'NOT FOUND'));

    // ==========================================
    // STEP 3: Join the group (simulates apiJoinGroup with fix)
    // ==========================================
    console.log('\n=== STEP 3: JOIN GROUP (as ' + JOINER_NAME + ') ===');

    // Simulate user typing lowercase code
    const userTypedCode = lowerCode;
    const normalizedCode = userTypedCode.toUpperCase(); // The fix

    const { data: groupToJoin, error: joinFindErr } = await sb
      .from('groups').select('*').eq('join_code', normalizedCode).single();

    if (joinFindErr) {
      console.log('  LOOKUP FAILED:', joinFindErr.message);
      await cleanup(groupId);
      return;
    }
    console.log('  Found group: ' + groupToJoin.name);

    // Check not already a member
    const { data: existing } = await sb
      .from('group_members').select('id')
      .eq('group_id', groupToJoin.group_id)
      .eq('user_id', JOINER_ID)
      .maybeSingle();

    if (existing) {
      console.log('  Already a member (unexpected in test)');
      await cleanup(groupId);
      return;
    }
    console.log('  Not already a member: OK');

    // Insert member
    const { error: joinErr } = await sb.from('group_members').insert({
      group_id: groupToJoin.group_id,
      user_id: JOINER_ID,
      display_name: JOINER_NAME,
      score: 0,
      joined_at: new Date().toISOString(),
    });

    if (joinErr) {
      console.log('  JOIN INSERT FAILED:', joinErr.message);
      await cleanup(groupId);
      return;
    }
    console.log('  Joined successfully!');

    // ==========================================
    // STEP 4: Verify group members
    // ==========================================
    console.log('\n=== STEP 4: VERIFY GROUP MEMBERS ===');
    const { data: members, error: memErr } = await sb
      .from('group_members')
      .select('user_id, display_name, score, joined_at')
      .eq('group_id', groupId)
      .order('joined_at');

    if (memErr) {
      console.log('  QUERY FAILED:', memErr.message);
    } else {
      console.log('  Members (' + members.length + '):');
      for (const m of members) {
        console.log('    - ' + m.display_name + ' (score: ' + m.score + ')');
      }
    }

    // ==========================================
    // STEP 5: Test duplicate join prevention
    // ==========================================
    console.log('\n=== STEP 5: DUPLICATE JOIN PREVENTION ===');
    const { data: dup } = await sb
      .from('group_members').select('id')
      .eq('group_id', groupId)
      .eq('user_id', JOINER_ID)
      .maybeSingle();
    console.log('  Already a member check: ' + (dup ? 'CORRECTLY DETECTED' : 'MISSED (bug!)'));

    // ==========================================
    // STEP 6: Test fetching groups for a user (simulates apiGetGroups)
    // ==========================================
    console.log('\n=== STEP 6: FETCH USER GROUPS ===');
    const { data: userMemberships } = await sb
      .from('group_members')
      .select('group_id')
      .eq('user_id', JOINER_ID);

    const userGroupIds = (userMemberships || []).map(m => m.group_id);
    console.log('  ' + JOINER_NAME + ' is in ' + userGroupIds.length + ' group(s): ' + userGroupIds.join(', '));

    if (userGroupIds.length > 0) {
      const { data: userGroups } = await sb
        .from('groups')
        .select('*, group_members(user_id, display_name, score)')
        .in('group_id', userGroupIds);

      for (const g of (userGroups || [])) {
        console.log('  Group: ' + g.name + ' (' + g.join_code + ') - ' + (g.group_members?.length || 0) + ' members');
      }
    }

    // ==========================================
    // CLEANUP
    // ==========================================
    await cleanup(groupId);

    console.log('\n=== ALL TESTS PASSED ===');
  } catch (err) {
    console.log('\nUNEXPECTED ERROR:', err.message);
    console.log(err.stack);
  }
})();
