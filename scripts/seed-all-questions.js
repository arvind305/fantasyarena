/**
 * seed-all-questions.js
 *
 * Generates and uploads standard questions for ALL 55 matches to Supabase.
 * Run with: node scripts/seed-all-questions.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

// Load tournament data
const tournamentPath = path.join(__dirname, '../ui/public/data/t20wc_2026.json');
const tournament = JSON.parse(fs.readFileSync(tournamentPath, 'utf8'));

// Points configuration
const POINTS_CONFIG = {
  winner: 1000,
  totalRuns: 1000,
  superOverMultiplier: 5
};

function generateQuestionsForMatch(match) {
  const matchId = `wc_m${match.match_id}`;
  const [teamA, teamB] = match.teams;
  const questions = [];

  // 1. WINNER question
  questions.push({
    question_id: `q_${matchId}_winner`,
    match_id: matchId,
    section: 'STANDARD',
    kind: 'WINNER',
    type: 'TEAM_PICK',
    text: 'Who will win the match?',
    points: POINTS_CONFIG.winner,
    points_wrong: 0,
    options: [
      { optionId: `opt_${matchId}_winner_teamA`, label: teamA },
      { optionId: `opt_${matchId}_winner_teamB`, label: teamB },
      { optionId: `opt_${matchId}_winner_superover`, label: 'Super Over' }
    ],
    sort_order: 1,
    status: 'active',
    disabled: false
  });

  // 2. TOTAL_RUNS question
  questions.push({
    question_id: `q_${matchId}_total_runs`,
    match_id: matchId,
    section: 'STANDARD',
    kind: 'TOTAL_RUNS',
    type: 'NUMERIC_INPUT',
    text: 'Predict the total runs scored in the match (both innings combined)',
    points: POINTS_CONFIG.totalRuns,
    points_wrong: 0,
    options: [],
    sort_order: 2,
    status: 'active',
    disabled: false
  });

  return questions;
}

async function seedAllQuestions() {
  console.log('🏏 Seeding questions for all matches...\n');

  // First, clear existing questions (optional - comment out to append)
  console.log('Clearing existing questions...');
  const { error: deleteError } = await supabase
    .from('match_questions')
    .delete()
    .neq('question_id', ''); // Delete all

  if (deleteError) {
    console.log('Warning: Could not clear existing questions:', deleteError.message);
  }

  let totalQuestions = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const match of tournament.matches) {
    // Skip TBC matches (knockouts with undetermined teams)
    if (match.is_tbc && match.teams.includes('TBC')) {
      console.log(`⏭️  Skipping match ${match.match_id} (TBC teams)`);
      continue;
    }

    const questions = generateQuestionsForMatch(match);
    totalQuestions += questions.length;

    for (const q of questions) {
      const { error } = await supabase
        .from('match_questions')
        .upsert(q, { onConflict: 'question_id' });

      if (error) {
        console.log(`❌ Error for ${q.question_id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log(`✅ Match ${match.match_id}: ${match.teams.join(' vs ')} - ${questions.length} questions`);
  }

  console.log('\n========================================');
  console.log(`📊 Summary:`);
  console.log(`   Total matches: ${tournament.matches.length}`);
  console.log(`   Questions created: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('========================================\n');

  // Verify
  const { data: allQuestions } = await supabase
    .from('match_questions')
    .select('match_id')
    .order('match_id');

  const uniqueMatches = [...new Set(allQuestions?.map(q => q.match_id) || [])];
  console.log(`✅ Verified: ${allQuestions?.length || 0} questions across ${uniqueMatches.length} matches in Supabase`);
}

seedAllQuestions().catch(console.error);
