require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Get squad IDs for the 6 teams
  const { data: squads } = await sb.from('squads').select('squad_id, team_code, team_name');
  const teamCodes = ['AFG', 'UAE', 'ENG', 'ITA', 'AUS', 'SL'];
  const relevantSquads = squads.filter(s => teamCodes.includes(s.team_code));

  for (const squad of relevantSquads) {
    const { data: players } = await sb
      .from('players')
      .select('player_id, player_name, player_role')
      .eq('squad_id', squad.squad_id)
      .order('player_name');

    console.log('\n=== ' + squad.team_code + ' - ' + squad.team_name + ' (' + players.length + ' players) ===');
    for (const p of players) {
      console.log(p.player_id + '  ' + p.player_name.padEnd(30) + p.player_role);
    }
  }
})();
