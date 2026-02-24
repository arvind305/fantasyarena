const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // 1. Get side bet for wc_m31
  const { data: sb31 } = await sb.from('side_bets').select('*').eq('match_id', 'wc_m31');
  console.log('=== Side Bet for wc_m31 ===');
  console.log(JSON.stringify(sb31, null, 2));

  // 2. Get match questions for wc_m31
  const { data: mq31 } = await sb.from('match_questions').select('*').eq('match_id', 'wc_m31');
  console.log('\n=== Match Questions for wc_m31 ===');
  mq31.forEach(q => console.log(`  ${q.kind}: ${q.question_id} | options: ${JSON.stringify(q.options)}`));

  // 3. Get NZ + CAN player IDs
  const { data: squads } = await sb.from('squads').select('squad_id, team_code').in('team_code', ['NZ', 'CAN']);
  const nzSquad = squads.find(s => s.team_code === 'NZ');
  const canSquad = squads.find(s => s.team_code === 'CAN');

  const { data: nzPlayers } = await sb.from('players').select('player_id, player_name, player_role, is_active')
    .eq('squad_id', nzSquad.squad_id).eq('is_active', true);
  const { data: canPlayers } = await sb.from('players').select('player_id, player_name, player_role, is_active')
    .eq('squad_id', canSquad.squad_id).eq('is_active', true);

  console.log('\n=== NZ Players (active) ===');
  nzPlayers.forEach(p => console.log(`  { pid: '${p.player_id}', name: '${p.player_name}' },  // ${p.player_role}`));

  console.log('\n=== CAN Players (active) ===');
  canPlayers.forEach(p => console.log(`  { pid: '${p.player_id}', name: '${p.player_name}' },  // ${p.player_role}`));

  // 4. Get bets for wc_m31
  const { data: bets31 } = await sb.from('bets').select('user_id, match_id, answers, player_picks, side_bet_answers').eq('match_id', 'wc_m31');
  console.log(`\n=== Bets for wc_m31: ${bets31?.length || 0} ===`);

  // 5. Side bet for wc_m32
  const { data: sb32 } = await sb.from('side_bets').select('*').eq('match_id', 'wc_m32');
  console.log('\n=== Side Bet for wc_m32 ===');
  console.log(JSON.stringify(sb32, null, 2));

  // 6. Bets for wc_m32
  const { data: bets32 } = await sb.from('bets').select('user_id, match_id').eq('match_id', 'wc_m32');
  console.log(`\n=== Bets for wc_m32: ${bets32?.length || 0} ===`);
})();
