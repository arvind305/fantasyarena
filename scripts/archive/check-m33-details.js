const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // 1. Player slots for wc_m33
  console.log('=== PLAYER SLOTS for wc_m33 ===');
  const { data: slots, error: slotsErr } = await sb
    .from('player_slots')
    .select('slot_id, slot_number, multiplier, is_enabled')
    .eq('match_id', 'wc_m33')
    .order('slot_number');
  if (slotsErr) { console.error('Slots error:', slotsErr.message); }
  else if (!slots || !slots.length) { console.log('No player_slots found for wc_m33'); }
  else { console.table(slots); }

  // 2. Active players for SCO and NEP (join through squads)
  console.log('\n=== ACTIVE PLAYERS for SCO & NEP ===');
  const { data: squads, error: squadsErr } = await sb
    .from('squads')
    .select('squad_id, team_code, team_name')
    .in('team_code', ['SCO', 'NEP']);
  if (squadsErr) { console.error('Squads error:', squadsErr.message); return; }

  const squadIds = squads.map(s => s.squad_id);
  const squadMap = Object.fromEntries(squads.map(s => [s.squad_id, s.team_code]));

  const { data: players, error: playersErr } = await sb
    .from('players')
    .select('player_id, player_name, squad_id, player_role, is_active')
    .in('squad_id', squadIds)
    .eq('is_active', true)
    .order('squad_id')
    .order('player_role');
  if (playersErr) { console.error('Players error:', playersErr.message); }
  else if (!players || !players.length) { console.log('No active players found for SCO/NEP'); }
  else {
    const enriched = players.map(p => ({
      player_id: p.player_id,
      player_name: p.player_name,
      team_code: squadMap[p.squad_id],
      player_role: p.player_role
    }));
    const sco = enriched.filter(p => p.team_code === 'SCO');
    const nep = enriched.filter(p => p.team_code === 'NEP');
    console.log(`\nSCO - Scotland (${sco.length} players):`);
    console.table(sco);
    console.log(`\nNEP - Nepal (${nep.length} players):`);
    console.table(nep);
  }

  // 3. Bets for wc_m33
  console.log('\n=== BETS for wc_m33 ===');
  const { data: bets, error: betsErr } = await sb
    .from('bets')
    .select('user_id, submitted_at, score')
    .eq('match_id', 'wc_m33');
  if (betsErr) { console.error('Bets error:', betsErr.message); }
  else {
    console.log(`Total bets placed: ${bets.length}`);
    const uniqueUsers = new Set(bets.map(b => b.user_id));
    console.log(`Unique users who bet: ${uniqueUsers.size}`);
    if (bets.length > 0) {
      console.table(bets.map(b => ({
        user_id: b.user_id.substring(0, 8) + '...',
        submitted_at: b.submitted_at,
        score: b.score
      })));
    }
  }
}

main().catch(console.error);
