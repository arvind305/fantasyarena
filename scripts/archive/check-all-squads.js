const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Get all squads
  const { data: squads, error: sqErr } = await sb.from('squads').select('squad_id, team_code, team_name');
  if (sqErr) { console.error('Squad error:', sqErr); return; }

  // Sort by team_code
  squads.sort((a, b) => a.team_code.localeCompare(b.team_code));

  // Get all players
  const { data: players, error: plErr } = await sb.from('players').select('player_id, squad_id, player_name, player_role, is_captain, is_active');
  if (plErr) { console.error('Player error:', plErr); return; }

  console.log(`Total squads: ${squads.length}`);
  console.log(`Total players: ${players.length}`);
  console.log('');

  const teamGroups = {
    'A': ['USA', 'PAK', 'IND', 'NAM', 'NED'],
    'B': ['ZIM', 'SL', 'AUS', 'OMAN', 'IRE'],
    'C': ['SCO', 'WI', 'ENG', 'ITA', 'NEP'],
    'D': ['NZ', 'RSA', 'UAE', 'AFG', 'CAN']
  };

  for (const [group, teams] of Object.entries(teamGroups)) {
    console.log(`\n========== GROUP ${group} ==========`);
    for (const teamCode of teams) {
      const squad = squads.find(s => s.team_code === teamCode);
      if (!squad) {
        console.log(`\n--- ${teamCode}: NOT FOUND IN DB ---`);
        continue;
      }

      const teamPlayers = players
        .filter(p => p.squad_id === squad.squad_id)
        .sort((a, b) => {
          // Sort: WK first, then BAT, AR, BOWL
          const order = { WK: 0, BAT: 1, AR: 2, BOWL: 3 };
          return (order[a.player_role] || 4) - (order[b.role] || 4);
        });

      console.log(`\n=== ${teamCode} — ${squad.team_name} === (${teamPlayers.length} players)`);
      teamPlayers.forEach((p, i) => {
        const captain = p.is_captain ? ' (C)' : '';
        const active = p.is_active === false ? ' [INACTIVE]' : '';
        console.log(`  ${String(i+1).padStart(2)}. ${p.player_name} — ${p.player_role}${captain}${active}`);
      });
    }
  }
})();
