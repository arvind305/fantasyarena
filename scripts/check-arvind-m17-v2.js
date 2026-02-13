/**
 * Check Arvind's bet for wc_m17 — using anon key (same as check-match-setup which worked)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Try both keys
const anonSb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
const svcSb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Find Arvind's user_id from leaderboard
  const { data: lb } = await anonSb.from('leaderboard')
    .select('user_id, display_name')
    .ilike('display_name', '%arvind%');
  const arvind = lb[0];
  console.log('Arvind:', arvind.display_name, 'user_id:', arvind.user_id, 'type:', typeof arvind.user_id);

  // Try anon key - all bets for wc_m17
  console.log('\n--- ANON KEY: all bets for wc_m17 ---');
  const { data: anonBets, error: anonErr } = await anonSb.from('bets')
    .select('user_id, match_id, answers, player_picks, side_bet_answers')
    .eq('match_id', 'wc_m17');
  if (anonErr) console.log('ANON ERROR:', anonErr.message);
  else console.log('ANON found', (anonBets || []).length, 'bets');
  for (const b of (anonBets || [])) {
    const name = lb.find(l => l.user_id === b.user_id)?.display_name || b.user_id;
    console.log('  ' + String(name).substring(0, 20).padEnd(22) + ' user_id: ' + b.user_id);
  }

  // Try service role key
  console.log('\n--- SERVICE ROLE KEY: all bets for wc_m17 ---');
  const { data: svcBets, error: svcErr } = await svcSb.from('bets')
    .select('user_id, match_id, answers, player_picks, side_bet_answers')
    .eq('match_id', 'wc_m17');
  if (svcErr) console.log('SVC ERROR:', svcErr.message);
  else console.log('SVC found', (svcBets || []).length, 'bets');
  for (const b of (svcBets || [])) {
    console.log('  user_id: ' + b.user_id);
  }

  // Try fetching Arvind's bets directly with anon key
  console.log('\n--- ANON KEY: Arvind bets ---');
  const { data: arvBets, error: arvErr } = await anonSb.from('bets')
    .select('match_id, answers, player_picks, side_bet_answers, score, is_locked, bet_id')
    .eq('user_id', arvind.user_id);
  if (arvErr) console.log('ERROR:', arvErr.message);
  else {
    console.log('Found', (arvBets || []).length, 'total bets for Arvind');
    const m17 = (arvBets || []).find(b => b.match_id === 'wc_m17');
    if (m17) {
      console.log('\nwc_m17 bet:');
      console.log(JSON.stringify(m17, null, 2));
    } else {
      console.log('\nNo wc_m17 bet found. His matches:');
      for (const b of (arvBets || [])) {
        console.log('  ' + b.match_id + ' | score: ' + b.score + ' | answers: ' + JSON.stringify(b.answers));
      }
    }
  }
})();
