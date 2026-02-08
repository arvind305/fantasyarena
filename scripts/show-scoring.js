/**
 * Show matches that need scoring and their options
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

async function showScoring() {
  // Load tournament data
  const tournamentPath = path.join(__dirname, '../ui/public/data/t20wc_2026.json');
  const tournament = JSON.parse(fs.readFileSync(tournamentPath, 'utf8'));

  // Get bets
  const { data: bets } = await supabase.from('bets').select('match_id, answers, score');
  const matchesWithBets = [...new Set(bets.map(b => b.match_id))];

  console.log('========================================');
  console.log('  MATCHES NEEDING SCORING');
  console.log('========================================\n');

  for (const matchId of matchesWithBets.sort()) {
    const matchNum = parseInt(matchId.replace('wc_m', ''));
    const match = tournament.matches.find(m => m.match_id === matchNum);

    const matchBets = bets.filter(b => b.match_id === matchId);
    const scored = matchBets.filter(b => b.score !== null).length;

    console.log(`${matchId}: ${match.teams[0]} vs ${match.teams[1]}`);
    console.log(`  Date: ${match.date} ${match.time_gmt} GMT`);
    console.log(`  Bets: ${matchBets.length} (${scored} scored)`);
    console.log(`  `);
    console.log(`  To score this match, run:`);
    console.log(`  node scripts/score-match.js ${matchId} <WINNER> <TOTAL_RUNS>`);
    console.log(`  `);
    console.log(`  WINNER options:`);
    console.log(`    opt_${matchId}_winner_teamA = ${match.teams[0]}`);
    console.log(`    opt_${matchId}_winner_teamB = ${match.teams[1]}`);
    console.log(`  `);
    console.log(`  TOTAL_RUNS: Enter the actual combined runs (e.g., 320)`);
    console.log('');
    console.log('----------------------------------------');
    console.log('');
  }
}

showScoring();
