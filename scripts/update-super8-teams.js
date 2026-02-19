/**
 * Update Super 8 matches with actual qualified teams
 *
 * Seeding: X1=IND, X2=ZIM, X3=WI, X4=RSA, Y1=ENG, Y2=NZ, Y3=PAK, Y4=SL
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEEDING = {
  X1: 'IND', X2: 'ZIM', X3: 'WI', X4: 'RSA',
  Y1: 'ENG', Y2: 'NZ', Y3: 'PAK', Y4: 'SL',
};

// Super 8 matches: match_id → [team_a_seed, team_b_seed]
const MATCHES = {
  wc_m41: ['Y2', 'Y3'],  // NZ vs PAK
  wc_m42: ['Y1', 'Y4'],  // ENG vs SL
  wc_m43: ['X1', 'X4'],  // IND vs RSA
  wc_m44: ['X2', 'X3'],  // ZIM vs WI
  wc_m45: ['Y1', 'Y3'],  // ENG vs PAK
  wc_m46: ['Y2', 'Y4'],  // NZ vs SL
  wc_m47: ['X3', 'X4'],  // WI vs RSA
  wc_m48: ['X1', 'X2'],  // IND vs ZIM
  wc_m49: ['Y1', 'Y2'],  // ENG vs NZ
  wc_m50: ['Y3', 'Y4'],  // PAK vs SL
  wc_m51: ['X2', 'X4'],  // ZIM vs RSA
  wc_m52: ['X1', 'X3'],  // IND vs WI
};

async function main() {
  console.log('Updating Super 8 matches with actual qualified teams...\n');
  console.log('Seeding:', SEEDING);
  console.log('');

  let errors = 0;

  for (const [matchId, [seedA, seedB]] of Object.entries(MATCHES)) {
    const teamA = SEEDING[seedA];
    const teamB = SEEDING[seedB];

    // 1. Update match_config
    const { error: configErr } = await sb.from('match_config')
      .update({ team_a: teamA, team_b: teamB })
      .eq('match_id', matchId);
    if (configErr) {
      console.error(`  ${matchId} match_config ERROR:`, configErr.message);
      errors++;
      continue;
    }

    // 2. Update match_questions WINNER options labels
    const questionId = `q_${matchId}_winner`;
    const newOptions = [
      { label: teamA, optionId: `opt_${matchId}_winner_teamA` },
      { label: teamB, optionId: `opt_${matchId}_winner_teamB` },
      { label: 'Super Over', optionId: `opt_${matchId}_winner_superover` },
    ];
    const { error: qErr } = await sb.from('match_questions')
      .update({ options: newOptions })
      .eq('question_id', questionId);
    if (qErr) {
      console.error(`  ${matchId} match_questions ERROR:`, qErr.message);
      errors++;
      continue;
    }

    console.log(`  ${matchId}: ${seedA}→${teamA} vs ${seedB}→${teamB}`);
  }

  if (errors > 0) {
    console.error(`\n${errors} errors occurred!`);
    process.exit(1);
  }

  // Verify
  console.log('\n--- Verification ---\n');

  const { data: configs } = await sb.from('match_config')
    .select('match_id, team_a, team_b, status')
    .in('match_id', Object.keys(MATCHES))
    .order('match_id');

  console.log('match_config:');
  configs.forEach(c => console.log(`  ${c.match_id}: ${c.team_a} vs ${c.team_b} [${c.status}]`));

  const { data: questions } = await sb.from('match_questions')
    .select('match_id, question_id, options')
    .in('match_id', Object.keys(MATCHES))
    .eq('kind', 'WINNER')
    .order('match_id');

  console.log('\nmatch_questions (WINNER labels):');
  questions.forEach(q => {
    const labels = q.options.map(o => o.label).join(' vs ');
    console.log(`  ${q.match_id}: ${labels}`);
  });

  console.log('\nDone!');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
