/**
 * monitor-bets.js
 *
 * Run this to monitor bets in real-time.
 * Usage: node scripts/monitor-bets.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

async function showBets() {
  console.clear();
  console.log('=== BETS MONITOR ===');
  console.log('Time:', new Date().toLocaleTimeString());
  console.log('(Refreshes every 5 seconds. Ctrl+C to stop)\n');

  const { data: bets } = await supabase
    .from('bets')
    .select('user_id, match_id, answers, submitted_at')
    .order('submitted_at', { ascending: false });

  console.log(`Total bets: ${bets?.length || 0}\n`);

  if (bets && bets.length > 0) {
    // Group by user
    const byUser = {};
    bets.forEach(b => {
      const shortId = b.user_id.substring(0, 12) + '...';
      if (!byUser[shortId]) byUser[shortId] = [];
      byUser[shortId].push(b.match_id);
    });

    console.log('Bets by User:');
    Object.entries(byUser).forEach(([userId, matches]) => {
      const isDevUser = userId.startsWith('dev_user');
      const marker = isDevUser ? '(old dev)' : '(Google)';
      console.log(`  ${userId} ${marker}: ${matches.join(', ')}`);
    });

    console.log('\nRecent Bets:');
    bets.slice(0, 5).forEach(bet => {
      const time = new Date(bet.submitted_at).toLocaleTimeString();
      console.log(`  [${time}] ${bet.match_id} by ${bet.user_id.substring(0, 8)}...`);
    });
  }

  console.log('\n====================');
}

// Run every 5 seconds
showBets();
setInterval(showBets, 5000);
