require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  for (const mid of ['wc_m42', 'wc_m43']) {
    console.log(`\n=== ${mid} ===`);
    const { data: mc } = await sb.from('match_config').select('*').eq('match_id', mid).single();
    console.log('team_a:', mc.team_a, '| team_b:', mc.team_b, '| status:', mc.status);

    const { data: sb_data } = await sb.from('side_bets').select('side_bet_id, question, options, correct_answer').eq('match_id', mid);
    console.log('Side bets:', JSON.stringify(sb_data, null, 2));

    const { data: bets } = await sb.from('bets').select('user_id').eq('match_id', mid);
    console.log('Bets count:', bets?.length || 0);
  }
}
main().catch(console.error);
