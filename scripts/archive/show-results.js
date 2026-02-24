const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

async function showResults() {
  // Load tournament data for team names
  const tournamentPath = path.join(__dirname, '../ui/public/data/t20wc_2026.json');
  const tournament = JSON.parse(fs.readFileSync(tournamentPath, 'utf8'));

  const matchMap = {};
  tournament.matches.forEach(m => {
    matchMap[`wc_m${m.match_id}`] = { teams: m.teams, date: m.date };
  });

  // Get all questions with correct answers set
  const { data: questions } = await supabase
    .from('match_questions')
    .select('match_id, question_id, kind, correct_answer, points, status')
    .order('match_id');

  console.log('=== MATCH RESULTS IN DATABASE ===\n');

  const byMatch = {};
  questions.forEach(q => {
    if (!byMatch[q.match_id]) byMatch[q.match_id] = { questions: [], answered: 0 };
    byMatch[q.match_id].questions.push(q);
    if (q.correct_answer) byMatch[q.match_id].answered++;
  });

  // Show scored matches
  console.log('SCORED MATCHES (with results):');
  console.log('-'.repeat(60));

  Object.entries(byMatch).sort().forEach(([matchId, data]) => {
    if (data.answered === 0) return;

    const match = matchMap[matchId];
    const teams = match ? match.teams.join(' vs ') : 'Unknown';
    const date = match ? match.date : '';

    console.log(`\n${matchId}: ${teams} (${date})`);

    data.questions.forEach(q => {
      if (!q.correct_answer) return;

      if (q.kind === 'WINNER') {
        const winnerTeam = q.correct_answer.includes('teamA') ? match.teams[0] : match.teams[1];
        console.log(`  Winner: ${winnerTeam}`);
      } else if (q.kind === 'TOTAL_RUNS') {
        console.log(`  Total Runs: ${q.correct_answer}`);
      } else {
        console.log(`  ${q.kind}: ${q.correct_answer}`);
      }
    });
  });

  // Show unscored matches with bets
  const { data: bets } = await supabase.from('bets').select('match_id');
  const matchesWithBets = [...new Set(bets.map(b => b.match_id))];

  console.log('\n\nUNSCORED MATCHES (with bets, awaiting results):');
  console.log('-'.repeat(60));

  matchesWithBets.sort().forEach(matchId => {
    const data = byMatch[matchId];
    if (!data || data.answered > 0) return; // Already scored

    const match = matchMap[matchId];
    const teams = match ? match.teams.join(' vs ') : 'Unknown';
    const date = match ? match.date : '';

    console.log(`${matchId}: ${teams} (${date}) - NEEDS SCORING`);
  });

  // Summary
  console.log('\n\nSUMMARY:');
  console.log('-'.repeat(60));
  const totalMatches = Object.keys(byMatch).length;
  const scoredMatches = Object.values(byMatch).filter(d => d.answered > 0).length;
  console.log(`Total matches with questions: ${totalMatches}`);
  console.log(`Matches scored: ${scoredMatches}`);
  console.log(`Matches with bets awaiting scoring: ${matchesWithBets.filter(m => byMatch[m] && byMatch[m].answered === 0).length}`);
}

showResults();
