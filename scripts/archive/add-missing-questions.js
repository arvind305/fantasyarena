/**
 * Add missing questions for matches 1-5
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

async function addMissingQuestions() {
  // Load tournament data
  const tournamentPath = path.join(__dirname, '../ui/public/data/t20wc_2026.json');
  const tournament = JSON.parse(fs.readFileSync(tournamentPath, 'utf8'));

  // Get first 5 matches
  const matchesToAdd = tournament.matches.slice(0, 5);

  const questions = [];

  for (const match of matchesToAdd) {
    const matchId = `wc_m${match.match_id}`;
    const [teamA, teamB] = match.teams;

    // WINNER question
    questions.push({
      question_id: `q_${matchId}_winner`,
      match_id: matchId,
      kind: 'WINNER',
      type: 'TEAM_PICK',
      text: `Who will win the match?`,
      description: `${teamA} vs ${teamB}`,
      points: 100,
      options: JSON.stringify([
        { id: `opt_${matchId}_winner_teamA`, label: teamA },
        { id: `opt_${matchId}_winner_teamB`, label: teamB }
      ]),
      correct_answer: null,
      status: 'CLOSED' // These matches are already played
    });

    // TOTAL_RUNS question
    questions.push({
      question_id: `q_${matchId}_total_runs`,
      match_id: matchId,
      kind: 'TOTAL_RUNS',
      type: 'NUMERIC',
      text: `Total runs in the match?`,
      description: 'Combined runs by both teams',
      points: 100,
      options: null,
      correct_answer: null,
      status: 'CLOSED'
    });
  }

  console.log('Adding questions for matches:', matchesToAdd.map(m => `wc_m${m.match_id}`).join(', '));

  const { data, error } = await supabase
    .from('match_questions')
    .upsert(questions, { onConflict: 'question_id' });

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Added', questions.length, 'questions');
  }

  // Verify
  const { data: verify } = await supabase
    .from('match_questions')
    .select('match_id, kind, status')
    .in('match_id', ['wc_m1', 'wc_m2', 'wc_m3', 'wc_m4', 'wc_m5']);

  console.log('\nVerification:');
  verify.forEach(q => console.log('  ', q.match_id, q.kind, q.status));
}

addMissingQuestions();
