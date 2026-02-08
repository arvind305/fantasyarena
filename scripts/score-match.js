/**
 * Score a match
 *
 * Usage: node scripts/score-match.js <match_id> <winner_option> <total_runs>
 * Example: node scripts/score-match.js wc_m1 opt_wc_m1_winner_teamA 285
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

async function scoreMatch() {
  const [,, matchId, winnerOption, totalRuns] = process.argv;

  if (!matchId || !winnerOption || !totalRuns) {
    console.log('Usage: node scripts/score-match.js <match_id> <winner_option> <total_runs>');
    console.log('Example: node scripts/score-match.js wc_m1 opt_wc_m1_winner_teamA 285');
    process.exit(1);
  }

  console.log(`\nScoring ${matchId}...`);
  console.log(`  Winner: ${winnerOption}`);
  console.log(`  Total Runs: ${totalRuns}\n`);

  // 1. Set correct answers for the questions
  const winnerQuestionId = `q_${matchId}_winner`;
  const runsQuestionId = `q_${matchId}_total_runs`;

  // Update WINNER question
  const { error: e1 } = await supabase
    .from('match_questions')
    .update({ correct_answer: winnerOption, status: 'CLOSED' })
    .eq('question_id', winnerQuestionId);

  if (e1) {
    console.log('Error setting winner answer:', e1.message);
    return;
  }
  console.log('Set winner answer');

  // Update TOTAL_RUNS question
  const { error: e2 } = await supabase
    .from('match_questions')
    .update({ correct_answer: totalRuns, status: 'CLOSED' })
    .eq('question_id', runsQuestionId);

  if (e2) {
    console.log('Error setting total runs answer:', e2.message);
    return;
  }
  console.log('Set total runs answer');

  // 2. Calculate scores using RPC function
  console.log('\nCalculating scores...');
  const { data, error } = await supabase.rpc('calculate_match_scores', {
    p_match_id: matchId,
    p_event_id: 't20wc_2026'
  });

  if (error) {
    console.log('Error calculating scores:', error.message);
    return;
  }

  console.log('\nScoring results:');
  if (data && data.length > 0) {
    data.forEach(r => {
      console.log(`  User ${r.user_id.substring(0, 12)}...: ${r.match_score} pts (${r.questions_correct}/${r.total_questions} correct)`);
    });
  } else {
    console.log('  No bets to score');
  }

  // 3. Show updated leaderboard
  const { data: lb } = await supabase
    .from('leaderboard')
    .select('user_id, display_name, total_score, matches_played, rank')
    .order('rank', { ascending: true })
    .limit(10);

  console.log('\nLeaderboard after scoring:');
  if (lb && lb.length > 0) {
    lb.forEach(e => {
      console.log(`  #${e.rank} ${e.display_name || e.user_id.substring(0, 12)}: ${e.total_score} pts (${e.matches_played} matches)`);
    });
  } else {
    console.log('  No leaderboard entries yet');
  }

  console.log('\nDone!');
}

scoreMatch();
