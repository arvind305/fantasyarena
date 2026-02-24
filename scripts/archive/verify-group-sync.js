/**
 * verify-group-sync.js
 * Checks if the trg_sync_group_scores trigger is installed and working.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log('=== Group Score Sync Trigger Verification ===\n');

  // 1. Check if trigger exists
  const { data: triggers, error: trigErr } = await supabase
    .rpc('check_trigger_exists', { trigger_name: 'trg_sync_group_scores' })
    .maybeSingle();

  // Fallback: query pg_trigger directly via raw SQL
  let triggerExists = false;
  try {
    const { data, error } = await supabase
      .from('pg_catalog.pg_trigger')
      .select('tgname')
      .eq('tgname', 'trg_sync_group_scores')
      .limit(1);
    
    if (error) {
      // Try via RPC
      const { data: rpcData, error: rpcErr } = await supabase.rpc('execute_sql', {
        sql: "SELECT tgname FROM pg_trigger WHERE tgname = 'trg_sync_group_scores'"
      });
      if (!rpcErr && rpcData && rpcData.length > 0) {
        triggerExists = true;
      }
    } else {
      triggerExists = data && data.length > 0;
    }
  } catch (e) {
    // ignore
  }

  // Alternative check: see if there are any group_members with scores > 0
  // which would indicate the trigger is running
  const { data: membersWithScores } = await supabase
    .from('group_members')
    .select('user_id, display_name, score, group_id')
    .gt('score', 0)
    .limit(5);

  console.log('Trigger check (direct query):', triggerExists ? 'FOUND' : 'NOT FOUND via direct query');
  console.log('Group members with scores > 0:', membersWithScores?.length || 0);

  // 2. Compare leaderboard scores with group_members scores
  console.log('\n--- Score Comparison ---');
  
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, display_name, score, group_id')
    .limit(10);

  if (!members || members.length === 0) {
    console.log('No group members found. Cannot verify sync.');
    return;
  }

  const userIds = [...new Set(members.map(m => m.user_id))];
  const { data: lbEntries } = await supabase
    .from('leaderboard')
    .select('user_id, display_name, total_score')
    .in('user_id', userIds);

  const lbMap = {};
  (lbEntries || []).forEach(e => { lbMap[e.user_id] = e; });

  let mismatches = 0;
  for (const member of members) {
    const lb = lbMap[member.user_id];
    const lbScore = lb?.total_score || 0;
    const gmScore = member.score || 0;
    const match = lbScore === gmScore;
    if (!match) mismatches++;
    console.log(
      `  ${member.display_name || member.user_id.slice(0, 8)}: ` +
      `leaderboard=${lbScore}, group_members=${gmScore} ` +
      `${match ? 'OK' : 'MISMATCH'}`
    );
  }

  console.log('\n--- Summary ---');
  if (mismatches === 0 && members.length > 0) {
    const allZero = members.every(m => (m.score || 0) === 0);
    if (allZero) {
      console.log('All group_members scores are 0.');
      console.log('This could mean:');
      console.log('  a) Trigger is NOT installed (scores never synced)');
      console.log('  b) Trigger is installed but no scoring has happened since users joined groups');
      console.log('\nTo install trigger, run: scripts/sql/014_fix_groups_schema.sql');
    } else {
      console.log('All scores match! Trigger appears to be working correctly.');
    }
  } else if (mismatches > 0) {
    console.log(`${mismatches} mismatches found. Trigger may not be installed or may have issues.`);
    console.log('To install/fix trigger, run: scripts/sql/014_fix_groups_schema.sql');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});