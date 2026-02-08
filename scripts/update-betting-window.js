/**
 * update-betting-window.js
 *
 * Opens betting for matches within today + N days, closes all others.
 * Run daily with: node scripts/update-betting-window.js
 *
 * Optional: Pass days as argument: node scripts/update-betting-window.js 3
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

// Days ahead to keep betting open (default 2)
const DAYS_AHEAD = parseInt(process.argv[2]) || 2;

async function updateBettingWindow() {
  // Load tournament data
  const tournamentPath = path.join(__dirname, '../ui/public/data/t20wc_2026.json');
  const tournament = JSON.parse(fs.readFileSync(tournamentPath, 'utf8'));

  // Calculate date range
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + DAYS_AHEAD);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  console.log(`\n🏏 Updating Betting Window`);
  console.log(`   Today: ${todayStr}`);
  console.log(`   Cutoff: ${cutoffStr} (today + ${DAYS_AHEAD} days)\n`);

  // Find matches within range
  const matchesInRange = tournament.matches.filter(m => {
    return m.date >= todayStr && m.date <= cutoffStr && !m.is_tbc;
  });

  const openMatchIds = matchesInRange.map(m => `wc_m${m.match_id}`);

  console.log(`Matches to open (${matchesInRange.length}):`);
  matchesInRange.forEach(m => {
    console.log(`   wc_m${m.match_id}: ${m.teams.join(' vs ')} | ${m.date}`);
  });

  // 1. Close ALL matches first
  const { error: closeErr } = await supabase
    .from('match_questions')
    .update({ status: 'closed' })
    .neq('status', '');

  if (closeErr) {
    console.log('\n❌ Error closing matches:', closeErr.message);
    return;
  }
  console.log('\n✅ Closed all matches');

  // 2. Open only the matches in range
  if (openMatchIds.length > 0) {
    const { error: openErr } = await supabase
      .from('match_questions')
      .update({ status: 'active' })
      .in('match_id', openMatchIds);

    if (openErr) {
      console.log('❌ Error opening matches:', openErr.message);
      return;
    }
    console.log(`✅ Opened ${openMatchIds.length} matches`);
  }

  // 3. Verify
  const { data: activeQuestions } = await supabase
    .from('match_questions')
    .select('match_id')
    .eq('status', 'active');

  const activeMatches = [...new Set(activeQuestions?.map(q => q.match_id) || [])];
  console.log(`\n📊 Verification: ${activeMatches.length} matches now open for betting`);
  console.log(`   ${activeMatches.sort().join(', ')}\n`);
}

updateBettingWindow().catch(console.error);
