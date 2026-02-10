const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  // Check what columns exist
  const { data: sample, error } = await sb.from('players').select('*').limit(1);
  if (error) { console.error('Error:', error); return; }
  console.log('Sample player columns:', Object.keys(sample[0]));
  console.log('Sample:', JSON.stringify(sample[0], null, 2));

  // Check squads table
  const { data: squad, error: sqErr } = await sb.from('squads').select('*').limit(1);
  if (sqErr) { console.error('Squad error:', sqErr); return; }
  console.log('\nSample squad columns:', Object.keys(squad[0]));
  console.log('Sample:', JSON.stringify(squad[0], null, 2));

  // Get ZIM and OMAN players
  const { data: zimPlayers } = await sb.from('players').select('player_id, name, squad_id').limit(5);
  console.log('\nFirst 5 players:', JSON.stringify(zimPlayers, null, 2));

  // Try to find ZIM squad
  const { data: squads } = await sb.from('squads').select('squad_id, team_code, team_name');
  console.log('\nAll squads:');
  squads.forEach(s => console.log(s.squad_id + ' | ' + s.team_code + ' | ' + s.team_name));

  // Get ZIM and OMAN squad IDs
  const zimSquad = squads.find(s => s.team_code === 'ZIM');
  const omanSquad = squads.find(s => s.team_code === 'OMAN');
  console.log('\nZIM squad:', zimSquad);
  console.log('OMAN squad:', omanSquad);

  if (zimSquad) {
    const { data: zimP } = await sb.from('players').select('player_id, name').eq('squad_id', zimSquad.squad_id);
    console.log('\nZIM players (' + zimP.length + '):');
    zimP.forEach(p => console.log('  ' + p.player_id.slice(0,8) + ' | ' + p.name));
  }

  if (omanSquad) {
    const { data: omanP } = await sb.from('players').select('player_id, name').eq('squad_id', omanSquad.squad_id);
    console.log('\nOMAN players (' + omanP.length + '):');
    omanP.forEach(p => console.log('  ' + p.player_id.slice(0,8) + ' | ' + p.name));
  }
})();
