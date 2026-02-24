/**
 * Fix player_pick_points for matches wc_m33 through wc_m39
 *
 * Root cause: The deployed scoring RPC function has a bug that produces
 * incorrect player_pick_points for these matches. The data (player_match_stats,
 * player_slots, bets) is all correct — only the calculated results are wrong.
 *
 * This script:
 * 1. Recalculates correct player_pick_points from raw data
 * 2. Updates bets with correct player_pick_points and total score
 * 3. Recalculates leaderboard totals from SUM(bets.score)
 * 4. Recalculates leaderboard ranks
 * 5. Prints before/after comparison
 */
require('dotenv').config({path:'ui/.env'});
require('dotenv').config();
const {createClient} = require('@supabase/supabase-js');
const s = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const AFFECTED_MATCHES = ['wc_m33', 'wc_m34', 'wc_m35', 'wc_m36', 'wc_m37', 'wc_m38', 'wc_m39'];
const EVENT_ID = 't20wc_2026';
const DRY_RUN = process.argv.includes('--dry-run');

(async () => {
  if (DRY_RUN) console.log('=== DRY RUN MODE (no changes will be made) ===\n');

  const {data: users} = await s.from('users').select('user_id, display_name');
  const uMap = {};
  users.forEach(u => { uMap[u.user_id] = u.display_name; });

  let totalBetsFixed = 0;
  let totalPointsAdded = 0;

  // Snapshot leaderboard before
  const {data: lbBefore} = await s.from('leaderboard')
    .select('user_id, total_score, rank')
    .eq('event_id', EVENT_ID)
    .order('rank');

  const lbBeforeMap = {};
  lbBefore.forEach(r => { lbBeforeMap[r.user_id] = r; });

  for (const matchId of AFFECTED_MATCHES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  Fixing ${matchId}`);
    console.log(`${'='.repeat(60)}`);

    // Get player slots
    const {data: slots} = await s.from('player_slots')
      .select('slot_number, multiplier, is_enabled')
      .eq('match_id', matchId).eq('is_enabled', true).order('slot_number');

    if (!slots || slots.length === 0) {
      console.log('  No enabled player slots, skipping');
      continue;
    }

    // Get player stats
    const {data: stats} = await s.from('player_match_stats')
      .select('player_id, total_fantasy_points')
      .eq('match_id', matchId);

    if (!stats || stats.length === 0) {
      console.log('  No player stats, skipping');
      continue;
    }

    const fpMap = {};
    stats.forEach(st => { fpMap[st.player_id] = st.total_fantasy_points; });

    // Get all bets
    const {data: bets} = await s.from('bets')
      .select('bet_id, user_id, player_picks, player_pick_points, winner_points, total_runs_points, runner_points, side_bet_points, score')
      .eq('match_id', matchId);

    if (!bets || bets.length === 0) {
      console.log('  No bets, skipping');
      continue;
    }

    console.log(`  Slots: ${slots.map(sl => `S${sl.slot_number}:${sl.multiplier}x`).join(', ')}`);
    console.log(`  Players with stats: ${stats.length}`);
    console.log(`  Bets: ${bets.length}`);
    console.log('');

    for (const bet of bets) {
      const picks = bet.player_picks || [];
      if (picks.length === 0) continue;

      // Calculate correct player_pick_points
      let correctPlayerPickPts = 0;
      const details = [];
      for (const pick of picks) {
        const slot = slots.find(sl => sl.slot_number === pick.slot);
        const fp = fpMap[pick.player_id];
        const mult = slot?.multiplier || 0;
        const pts = (fp != null && mult) ? Math.round(fp * mult) : 0;
        correctPlayerPickPts += pts;
        details.push(`S${pick.slot}:${(pick.player_name || '?').split(' ').pop()}(${fp ?? '?'}×${mult}=${pts})`);
      }

      const oldPlayerPickPts = bet.player_pick_points || 0;
      const diff = correctPlayerPickPts - oldPlayerPickPts;

      if (diff === 0) continue; // already correct

      // Calculate new total score
      const newScore = (bet.winner_points || 0) + (bet.total_runs_points || 0) +
        correctPlayerPickPts + (bet.runner_points || 0) + (bet.side_bet_points || 0);

      const name = uMap[bet.user_id] || bet.user_id;
      console.log(`  ${name.padEnd(22)} player_pick: ${oldPlayerPickPts} → ${correctPlayerPickPts} (+${diff}), score: ${bet.score} → ${newScore}`);
      console.log(`    ${details.join(', ')}`);

      if (!DRY_RUN) {
        const {error} = await s.from('bets')
          .update({
            player_pick_points: correctPlayerPickPts,
            score: newScore,
          })
          .eq('bet_id', bet.bet_id);

        if (error) {
          console.error(`    ERROR updating bet: ${error.message}`);
        }
      }

      totalBetsFixed++;
      totalPointsAdded += diff;
    }
  }

  // Recalculate leaderboard totals
  console.log(`\n${'='.repeat(60)}`);
  console.log('  Recalculating leaderboard');
  console.log(`${'='.repeat(60)}`);

  // For each user, sum ALL their bet scores
  const {data: allUsers} = await s.from('leaderboard')
    .select('user_id')
    .eq('event_id', EVENT_ID);

  for (const lb of allUsers) {
    const {data: userBets} = await s.from('bets')
      .select('score')
      .eq('user_id', lb.user_id)
      .not('score', 'is', null);

    const totalScore = userBets.reduce((sum, b) => sum + (b.score || 0), 0);
    const matchesPlayed = userBets.length;

    if (!DRY_RUN) {
      await s.from('leaderboard')
        .update({
          total_score: totalScore,
          matches_played: matchesPlayed,
          updated_at: new Date().toISOString(),
        })
        .eq('event_id', EVENT_ID)
        .eq('user_id', lb.user_id);
    }
  }

  // Recalculate ranks
  if (!DRY_RUN) {
    // Get all leaderboard entries sorted by total_score DESC
    const {data: lbEntries} = await s.from('leaderboard')
      .select('user_id, total_score')
      .eq('event_id', EVENT_ID)
      .order('total_score', {ascending: false});

    let rank = 1;
    let prevScore = null;
    let sameRankCount = 0;
    for (let i = 0; i < lbEntries.length; i++) {
      if (prevScore !== null && lbEntries[i].total_score < prevScore) {
        rank = i + 1;
      }
      await s.from('leaderboard')
        .update({ rank })
        .eq('event_id', EVENT_ID)
        .eq('user_id', lbEntries[i].user_id);
      prevScore = lbEntries[i].total_score;
    }
  }

  // Print before/after leaderboard
  console.log('\n  LEADERBOARD COMPARISON:');
  console.log('  ' + 'User'.padEnd(22) + ' | ' + 'Before'.padStart(8) + ' | ' + 'After'.padStart(8) + ' | ' + 'Change'.padStart(8) + ' | Rank');
  console.log('  ' + '-'.repeat(75));

  const {data: lbAfter} = await s.from('leaderboard')
    .select('user_id, total_score, rank')
    .eq('event_id', EVENT_ID)
    .order('rank');

  for (const after of lbAfter) {
    const before = lbBeforeMap[after.user_id];
    const beforeScore = before?.total_score || 0;
    const beforeRank = before?.rank || '?';
    const diff = after.total_score - beforeScore;
    const name = uMap[after.user_id] || after.user_id;
    const rankChange = before ? `${beforeRank} → ${after.rank}` : `new:${after.rank}`;
    console.log(
      '  ' + name.padEnd(22) + ' | ' +
      String(beforeScore).padStart(8) + ' | ' +
      String(after.total_score).padStart(8) + ' | ' +
      (diff >= 0 ? '+' + diff : String(diff)).padStart(8) + ' | ' +
      rankChange
    );
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Matches fixed: ${AFFECTED_MATCHES.length}`);
  console.log(`  Bets corrected: ${totalBetsFixed}`);
  console.log(`  Total points added: +${totalPointsAdded}`);
  if (DRY_RUN) {
    console.log('\n  This was a DRY RUN. Run without --dry-run to apply changes.');
  } else {
    console.log('\n  All changes applied successfully!');
  }
})();
