const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Get squad IDs for SCO and NEP
  const { data: squads } = await sb.from('squads').select('squad_id, team_code').in('team_code', ['SCO', 'NEP']);
  if (!squads) { console.error('No squads found'); return; }
  const squadMap = {};
  squads.forEach(s => { squadMap[s.squad_id] = s.team_code; });

  const { data, error } = await sb
    .from('players')
    .select('player_id, player_name, squad_id, player_role')
    .in('squad_id', squads.map(s => s.squad_id))
    .eq('is_active', true)
    .order('player_name');
  if (error) { console.error(error.message); return; }
  data.forEach(p => console.log(p.player_id, squadMap[p.squad_id], p.player_name, p.player_role));
})();
