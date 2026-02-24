require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  for (const mid of ['wc_m42', 'wc_m43']) {
    console.log(`\n=== ${mid} ===`);

    // Side bets table
    const { data: sideBets } = await sb.from('side_bets')
      .select('side_bet_id, question, options, correct_answer, points')
      .eq('match_id', mid);
    console.log('Side bets:', JSON.stringify(sideBets, null, 2));

    // Match questions with section SIDE
    const { data: mq } = await sb.from('match_questions')
      .select('question_id, question_text, options, section, status')
      .eq('match_id', mid)
      .eq('section', 'SIDE');
    console.log('Match questions (SIDE):', JSON.stringify(mq, null, 2));

    // Check what users bet on side bets
    const { data: bets } = await sb.from('bets')
      .select('user_id, side_bet_answers')
      .eq('match_id', mid);
    console.log('User side bet answers:');
    for (const b of (bets || [])) {
      console.log(`  ${b.user_id.slice(0,10)}...: ${JSON.stringify(b.side_bet_answers)}`);
    }
  }
}
main().catch(console.error);
