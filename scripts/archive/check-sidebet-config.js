require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Check player_slots for these matches to understand the config
  for (const mid of ['wc_m42', 'wc_m43']) {
    console.log(`\n=== ${mid} ===`);

    // Check ALL side_bets for this match (maybe different query needed)
    const { data: allSb } = await sb.from('side_bets')
      .select('*')
      .eq('match_id', mid);
    console.log('side_bets rows:', allSb?.length || 0, allSb);

    // Check match_questions for ALL sections
    const { data: allMq } = await sb.from('match_questions')
      .select('question_id, question_text, options, section, correct_answer')
      .eq('match_id', mid);
    console.log('match_questions rows:', allMq?.length || 0);
    for (const q of (allMq || [])) {
      console.log(`  ${q.question_id}: [${q.section}] "${q.question_text}"`);
      console.log(`    options: ${JSON.stringify(q.options)}`);
      console.log(`    correct_answer: ${q.correct_answer}`);
    }

    // The UUIDs from user bets - check if they're player_slots or something else
    const { data: ps } = await sb.from('player_slots')
      .select('slot_id, slot_number, label, multiplier')
      .eq('match_id', mid);
    console.log('player_slots:', ps?.length || 0);
  }
}
main().catch(console.error);
