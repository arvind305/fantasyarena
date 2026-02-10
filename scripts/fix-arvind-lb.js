const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const ARVIND_ID = '104262282893186176547';

  // Recalculate from all scored bets
  const { data: bets } = await sb
    .from('bets')
    .select('match_id, score')
    .eq('user_id', ARVIND_ID)
    .not('score', 'is', null);

  let totalScore = 0;
  let matchesPlayed = 0;
  let lastMatchScore = 0;

  bets.forEach(b => {
    totalScore += b.score;
    matchesPlayed++;
    lastMatchScore = b.score; // last in order
  });

  console.log('Arvind scored bets: ' + bets.length);
  bets.forEach(b => console.log('  ' + b.match_id + ': ' + b.score));
  console.log('Correct total: ' + totalScore + ', matches: ' + matchesPlayed);

  // Update leaderboard
  const { error } = await sb
    .from('leaderboard')
    .update({
      total_score: totalScore,
      matches_played: matchesPlayed,
      last_match_score: lastMatchScore,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', ARVIND_ID);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Fixed! Arvind total_score=' + totalScore + ', matches=' + matchesPlayed);
  }

  // Verify
  const { data: lb } = await sb
    .from('leaderboard')
    .select('display_name, total_score, matches_played')
    .order('total_score', { ascending: false });

  console.log('\n=== CORRECTED LEADERBOARD ===');
  lb.forEach((u, i) => {
    console.log((i+1) + '. ' + u.display_name.padEnd(22) + ' | ' + u.total_score + ' pts | ' + u.matches_played + ' matches');
  });
})();
