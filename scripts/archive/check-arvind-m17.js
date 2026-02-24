/**
 * Check Arvind's bet for wc_m17 in detail
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Find Arvind
  const { data: lb } = await sb.from('leaderboard')
    .select('user_id, display_name')
    .ilike('display_name', '%arvind%');

  if (!lb || lb.length === 0) {
    console.log('Arvind not found in leaderboard');
    process.exit(1);
  }

  const arvind = lb[0];
  console.log('Found:', arvind.display_name, '(' + arvind.user_id + ')\n');

  // Get ALL his bets
  const { data: allBets } = await sb.from('bets')
    .select('match_id, answers, player_picks, runner_picks, side_bet_answers, score, is_locked, created_at, updated_at')
    .eq('user_id', arvind.user_id)
    .order('match_id');

  console.log('=== ALL BETS BY ARVIND ===');
  for (const b of (allBets || [])) {
    const hasAnswers = b.answers && Object.keys(b.answers).length > 0;
    const hasPicks = b.player_picks && b.player_picks.length > 0;
    const hasSide = b.side_bet_answers && Object.keys(b.side_bet_answers).length > 0;
    console.log(b.match_id.padEnd(10) + ' | score: ' + String(b.score ?? 'null').padStart(6) +
      ' | answers: ' + (hasAnswers ? 'YES' : 'NO ') +
      ' | picks: ' + (hasPicks ? 'YES' : 'NO ') +
      ' | side: ' + (hasSide ? 'YES' : 'NO ') +
      ' | locked: ' + b.is_locked +
      ' | created: ' + (b.created_at ? new Date(b.created_at).toISOString().slice(0,16) : 'null'));
  }

  // Now check wc_m17 specifically
  console.log('\n=== wc_m17 BET DETAIL ===');
  const m17bet = (allBets || []).find(b => b.match_id === 'wc_m17');
  if (!m17bet) {
    console.log('NO BET FOUND for wc_m17');
  } else {
    console.log('Full bet object:');
    console.log(JSON.stringify(m17bet, null, 2));
  }

  // Also check: are there any bets from anyone for m17 that have empty answers?
  console.log('\n=== ALL wc_m17 BETS ===');
  const { data: m17bets } = await sb.from('bets')
    .select('user_id, bet_id, answers, player_picks, side_bet_answers, created_at, updated_at')
    .eq('match_id', 'wc_m17');

  const { data: allLb } = await sb.from('leaderboard').select('user_id, display_name');
  const nameMap = {};
  for (const l of (allLb || [])) nameMap[l.user_id] = l.display_name;

  for (const b of (m17bets || [])) {
    const name = nameMap[b.user_id] || b.user_id.substring(0, 12);
    const answerKeys = b.answers ? Object.keys(b.answers) : [];
    const pickCount = b.player_picks ? b.player_picks.length : 0;
    const sideKeys = b.side_bet_answers ? Object.keys(b.side_bet_answers) : [];
    console.log(name.padEnd(22) + ' | answer_keys: ' + JSON.stringify(answerKeys) +
      ' | picks: ' + pickCount +
      ' | side_keys: ' + JSON.stringify(sideKeys) +
      ' | created: ' + (b.created_at ? new Date(b.created_at).toISOString().slice(0,16) : 'null'));
  }
})();
