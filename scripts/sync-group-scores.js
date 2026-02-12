/**
 * sync-group-scores.js
 *
 * One-time backfill script: syncs group_members.score from leaderboard.total_score.
 *
 * The trg_sync_group_scores trigger only fires on future leaderboard updates,
 * so existing group_members rows may still have score=0. This script fixes that.
 *
 * Usage: node scripts/sync-group-scores.js
 * Safe to run multiple times (idempotent).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing environment variables:');
  if (!url) console.error('  - REACT_APP_SUPABASE_URL (from ui/.env)');
  if (!key) console.error('  - SUPABASE_SERVICE_ROLE_KEY (from .env)');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log('=== Sync Group Member Scores from Leaderboard ===\n');

  // 1. Fetch all group_members
  const { data: members, error: membersErr } = await supabase
    .from('group_members')
    .select('id, user_id, display_name, score, group_id');

  if (membersErr) {
    console.error('Failed to fetch group_members:', membersErr.message);
    process.exit(1);
  }

  if (!members || members.length === 0) {
    console.log('No group members found. Nothing to sync.');
    return;
  }

  console.log(`Found ${members.length} group_members entries.`);

  // 2. Fetch all leaderboard entries (for t20wc_2026 event)
  const { data: lbEntries, error: lbErr } = await supabase
    .from('leaderboard')
    .select('user_id, total_score')
    .eq('event_id', 't20wc_2026');

  if (lbErr) {
    console.error('Failed to fetch leaderboard:', lbErr.message);
    process.exit(1);
  }

  // Build a lookup: user_id (as string) -> total_score
  // leaderboard.user_id is UUID, group_members.user_id is TEXT (after migration 014)
  const lbMap = {};
  for (const entry of (lbEntries || [])) {
    lbMap[String(entry.user_id)] = entry.total_score || 0;
  }

  console.log(`Found ${Object.keys(lbMap).length} leaderboard entries.\n`);

  // 3. Compare and update where they differ
  let updated = 0;
  let alreadyCorrect = 0;
  let noLeaderboardEntry = 0;
  const errors = [];

  for (const member of members) {
    const lbScore = lbMap[String(member.user_id)];
    const currentScore = member.score || 0;

    if (lbScore === undefined) {
      // User has no leaderboard entry (hasn't placed any bets)
      noLeaderboardEntry++;
      continue;
    }

    if (currentScore === lbScore) {
      alreadyCorrect++;
      continue;
    }

    // Score differs -- update it
    const { error: updateErr } = await supabase
      .from('group_members')
      .update({ score: lbScore })
      .eq('id', member.id);

    if (updateErr) {
      errors.push({ member, error: updateErr.message });
      console.error(
        `  ERROR updating ${member.display_name || member.user_id}: ${updateErr.message}`
      );
    } else {
      updated++;
      console.log(
        `  Updated ${member.display_name || member.user_id}: ${currentScore} -> ${lbScore}`
      );
    }
  }

  // 4. Summary
  console.log('\n=== Summary ===');
  console.log(`  Total group_members:    ${members.length}`);
  console.log(`  Already correct:        ${alreadyCorrect}`);
  console.log(`  Updated:                ${updated}`);
  console.log(`  No leaderboard entry:   ${noLeaderboardEntry}`);
  if (errors.length > 0) {
    console.log(`  Errors:                 ${errors.length}`);
  }
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
