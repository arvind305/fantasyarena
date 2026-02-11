/**
 * Fix leaderboard ranks and previous_rank.
 * previous_rank = rank BEFORE the most recently scored match.
 * This is computed by subtracting the latest match's bet score from total.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // 1. Find the most recently scored match
  const { data: results } = await sb.from('match_results')
    .select('match_id, completed_at')
    .order('completed_at', { ascending: false })
    .limit(1);
  const latestMatchId = results[0]?.match_id;
  console.log('Latest scored match:', latestMatchId);

  // 2. Get all scored bets
  const { data: allBets } = await sb.from('bets').select('user_id, match_id, score');

  // 3. Build user totals
  const users = {};
  const { data: lbRows } = await sb.from('leaderboard').select('user_id, display_name, event_id');
  for (const row of lbRows) {
    users[row.user_id] = {
      display_name: row.display_name,
      event_id: row.event_id,
      total: 0,
      matches: 0,
      latestMatchScore: 0,
    };
  }

  for (const b of allBets) {
    if (b.score === null || b.score === undefined) continue;
    if (!users[b.user_id]) continue;
    users[b.user_id].total += b.score;
    users[b.user_id].matches++;
    if (b.match_id === latestMatchId) {
      users[b.user_id].latestMatchScore = b.score;
    }
  }

  // 4. Compute current ranks (by total desc)
  const entries = Object.entries(users).map(([uid, u]) => ({
    uid, ...u,
    previousTotal: u.total - u.latestMatchScore,
  }));

  entries.sort((a, b) => b.total - a.total);
  entries.forEach((e, i) => { e.rank = i + 1; });

  // 5. Compute previous ranks (by previousTotal desc)
  const prevEntries = [...entries].sort((a, b) => b.previousTotal - a.previousTotal);
  prevEntries.forEach((e, i) => { e.previous_rank = i + 1; });

  // 6. Update leaderboard
  console.log('\nUser'.padEnd(24) + 'Total'.padStart(7) + '  Rank  PrevRk  LastMatch  Movement');
  console.log('-'.repeat(75));
  for (const e of entries) {
    const movement = e.previous_rank - e.rank;
    const movStr = movement > 0 ? '+' + movement : movement < 0 ? String(movement) : '—';
    console.log(
      e.display_name.padEnd(24) +
      String(e.total).padStart(6) + '  ' +
      String(e.rank).padStart(4) + '  ' +
      String(e.previous_rank).padStart(6) + '  ' +
      String(e.latestMatchScore).padStart(9) + '  ' +
      movStr.padStart(8)
    );

    await sb.from('leaderboard').update({
      total_score: e.total,
      matches_played: e.matches,
      rank: e.rank,
      previous_rank: e.previous_rank,
      last_match_score: e.latestMatchScore,
    }).eq('user_id', e.uid).eq('event_id', e.event_id);
  }

  console.log('\nDone! Ranks and previous_rank updated.');
})();
