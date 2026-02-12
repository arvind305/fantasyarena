/**
 * Re-score wc_m13: RSA vs AFG
 *
 * The super over scoring bug was fixed. This script:
 *   1. Shows BEFORE state (current bet scores, match results, winner options)
 *   2. Resets match to LOCKED and nulls all bet scores
 *   3. Re-triggers scoring via calculate_match_scores RPC
 *   4. Shows AFTER state with diff highlighting
 *
 * IMPORTANT: The scoring RPC INCREMENTS leaderboard totals.
 *   After this script, you MUST run: node scripts/fix-leaderboard.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars. Need REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);
const MATCH_ID = 'wc_m13';
const EVENT_ID = 't20wc_2026';

(async () => {
  try {
    console.log('=== RE-SCORING ' + MATCH_ID.toUpperCase() + ': RSA vs AFG ===');
    console.log('Reason: super over scoring bug fix\n');

    // -------------------------------------------------------
    // STEP 1: Show BEFORE state
    // -------------------------------------------------------
    console.log('========================================');
    console.log('  STEP 1: BEFORE STATE');
    console.log('========================================\n');

    // 1a. Query bets for wc_m13
    const { data: betsBefore, error: betsBeforeErr } = await sb
      .from('bets')
      .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points')
      .eq('match_id', MATCH_ID)
      .order('score', { ascending: false, nullsFirst: false });

    if (betsBeforeErr) {
      console.error('Error querying bets:', betsBeforeErr.message);
      process.exit(1);
    }

    // Get display names
    const userIds = (betsBefore || []).map(b => b.user_id);
    const { data: users } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', userIds);
    const nameMap = {};
    (users || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

    console.log('--- Bets for ' + MATCH_ID + ' (BEFORE) ---');
    console.log('User'.padEnd(22) + '| Score  | Winner | Runs  | Players | Side  | Runner');
    console.log('-'.repeat(85));

    // Save before scores for diff
    const beforeScores = {};
    for (const b of (betsBefore || [])) {
      const name = nameMap[b.user_id] || b.user_id.slice(0, 8);
      beforeScores[b.user_id] = {
        name,
        score: b.score,
        winner_points: b.winner_points,
        total_runs_points: b.total_runs_points,
        player_pick_points: b.player_pick_points,
        side_bet_points: b.side_bet_points,
        runner_points: b.runner_points,
      };
      console.log(
        name.padEnd(21) + ' | ' +
        String(b.score != null ? b.score : 'null').padStart(6) + ' | ' +
        String(b.winner_points != null ? b.winner_points : 'null').padStart(6) + ' | ' +
        String(b.total_runs_points != null ? b.total_runs_points : 'null').padStart(5) + ' | ' +
        String(b.player_pick_points != null ? b.player_pick_points : 'null').padStart(7) + ' | ' +
        String(b.side_bet_points != null ? b.side_bet_points : 'null').padStart(5) + ' | ' +
        String(b.runner_points != null ? b.runner_points : 'null').padStart(6)
      );
    }
    console.log('Total bets: ' + (betsBefore || []).length);

    // 1b. Query match_results
    console.log('\n--- match_results for ' + MATCH_ID + ' ---');
    const { data: matchResult, error: mrErr } = await sb
      .from('match_results')
      .select('*')
      .eq('match_id', MATCH_ID)
      .single();

    if (mrErr) {
      console.error('Error querying match_results:', mrErr.message);
    } else {
      console.log('  winner: "' + matchResult.winner + '"');
      console.log('  total_runs: ' + matchResult.total_runs);
      console.log('  man_of_match: ' + matchResult.man_of_match);
    }

    // 1c. Query match_questions for WINNER kind
    console.log('\n--- match_questions (WINNER) for ' + MATCH_ID + ' ---');
    const { data: winnerQ, error: wqErr } = await sb
      .from('match_questions')
      .select('question_id, kind, options, correct_answer')
      .eq('match_id', MATCH_ID)
      .eq('kind', 'WINNER');

    if (wqErr) {
      console.error('Error querying match_questions:', wqErr.message);
    } else {
      for (const q of (winnerQ || [])) {
        console.log('  question_id: ' + q.question_id);
        console.log('  correct_answer: "' + q.correct_answer + '"');
        console.log('  options:');
        const opts = q.options || [];
        for (const opt of opts) {
          const marker = opt.optionId === q.correct_answer ? ' <-- CORRECT' : '';
          console.log('    optionId: "' + opt.optionId + '" | label: "' + opt.label + '"' + marker);
        }
      }
    }

    // -------------------------------------------------------
    // STEP 2: Reset match for re-scoring
    // -------------------------------------------------------
    console.log('\n========================================');
    console.log('  STEP 2: RESET FOR RE-SCORING');
    console.log('========================================\n');

    // 2a. Set match status back to LOCKED
    console.log('Setting match_config status to LOCKED...');
    const { error: lockErr } = await sb
      .from('match_config')
      .update({ status: 'LOCKED' })
      .eq('match_id', MATCH_ID);

    if (lockErr) {
      console.error('ERROR locking match:', lockErr.message);
      process.exit(1);
    }
    console.log('  OK: match status set to LOCKED');

    // 2b. Null out all bet scores for this match
    console.log('\nResetting all bet scores to null...');
    const { data: resetBets, error: resetErr } = await sb
      .from('bets')
      .update({
        score: null,
        winner_points: null,
        total_runs_points: null,
        player_pick_points: null,
        side_bet_points: null,
        runner_points: null,
      })
      .eq('match_id', MATCH_ID)
      .select('bet_id');

    if (resetErr) {
      console.error('ERROR resetting bet scores:', resetErr.message);
      process.exit(1);
    }
    console.log('  OK: reset ' + (resetBets || []).length + ' bets to null scores');

    // -------------------------------------------------------
    // STEP 3: Re-trigger scoring
    // -------------------------------------------------------
    console.log('\n========================================');
    console.log('  STEP 3: RE-TRIGGER SCORING');
    console.log('========================================\n');

    console.log('Calling calculate_match_scores RPC...');
    console.log('  p_match_id: ' + MATCH_ID);
    console.log('  p_event_id: ' + EVENT_ID);

    const { data: scoreResult, error: scoreErr } = await sb.rpc('calculate_match_scores', {
      p_match_id: MATCH_ID,
      p_event_id: EVENT_ID,
    });

    if (scoreErr) {
      console.error('ERROR from scoring RPC:', scoreErr.message);
      console.error('Full error:', JSON.stringify(scoreErr));
      process.exit(1);
    }
    console.log('  OK: RPC returned:', JSON.stringify(scoreResult));

    // -------------------------------------------------------
    // STEP 4: Show AFTER state with diff
    // -------------------------------------------------------
    console.log('\n========================================');
    console.log('  STEP 4: AFTER STATE');
    console.log('========================================\n');

    const { data: betsAfter, error: betsAfterErr } = await sb
      .from('bets')
      .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points')
      .eq('match_id', MATCH_ID)
      .order('score', { ascending: false, nullsFirst: false });

    if (betsAfterErr) {
      console.error('Error querying bets after:', betsAfterErr.message);
      process.exit(1);
    }

    console.log('--- Bets for ' + MATCH_ID + ' (AFTER) ---');
    console.log('User'.padEnd(22) + '| Score  | Winner | Runs  | Players | Side  | Runner');
    console.log('-'.repeat(85));

    for (const b of (betsAfter || [])) {
      const name = nameMap[b.user_id] || b.user_id.slice(0, 8);
      console.log(
        name.padEnd(21) + ' | ' +
        String(b.score != null ? b.score : 'null').padStart(6) + ' | ' +
        String(b.winner_points != null ? b.winner_points : 'null').padStart(6) + ' | ' +
        String(b.total_runs_points != null ? b.total_runs_points : 'null').padStart(5) + ' | ' +
        String(b.player_pick_points != null ? b.player_pick_points : 'null').padStart(7) + ' | ' +
        String(b.side_bet_points != null ? b.side_bet_points : 'null').padStart(5) + ' | ' +
        String(b.runner_points != null ? b.runner_points : 'null').padStart(6)
      );
    }

    // -------------------------------------------------------
    // STEP 5: Highlight differences
    // -------------------------------------------------------
    console.log('\n--- SCORE DIFFERENCES (BEFORE vs AFTER) ---');
    console.log('User'.padEnd(22) + '| Old Score | New Score | Winner Old | Winner New | Diff');
    console.log('-'.repeat(90));

    let anyDiff = false;
    for (const b of (betsAfter || [])) {
      const before = beforeScores[b.user_id];
      if (!before) continue;

      const oldScore = before.score != null ? before.score : 0;
      const newScore = b.score != null ? b.score : 0;
      const oldWinner = before.winner_points != null ? before.winner_points : 0;
      const newWinner = b.winner_points != null ? b.winner_points : 0;
      const diff = newScore - oldScore;

      const diffStr = diff > 0 ? '+' + diff : diff < 0 ? String(diff) : '0';
      const marker = diff !== 0 ? ' ***' : '';

      if (diff !== 0) anyDiff = true;

      console.log(
        before.name.padEnd(21) + ' | ' +
        String(oldScore).padStart(9) + ' | ' +
        String(newScore).padStart(9) + ' | ' +
        String(oldWinner).padStart(10) + ' | ' +
        String(newWinner).padStart(10) + ' | ' +
        diffStr.padStart(4) + marker
      );
    }

    if (!anyDiff) {
      console.log('\n  No score differences detected. Scores are the same as before.');
    } else {
      console.log('\n  *** = score changed');
    }

    // -------------------------------------------------------
    // FINAL REMINDER
    // -------------------------------------------------------
    console.log('\n========================================');
    console.log('  IMPORTANT: LEADERBOARD NOT YET FIXED');
    console.log('========================================');
    console.log('');
    console.log('The scoring RPC ADDED to leaderboard totals.');
    console.log('The old scores were already in the leaderboard, and now new scores were added on top.');
    console.log('');
    console.log('NOW RUN: node scripts/fix-leaderboard.js to recalculate leaderboard totals');
    console.log('');

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
