const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const MATCH = 'wc_m21'; // USA v NED - last scored match

  // Get player_match_stats for this match
  const { data: stats } = await sb
    .from('player_match_stats')
    .select('*, players!inner(player_name, player_role, squads!inner(team_code))')
    .eq('match_id', MATCH);

  console.log('=== Player Match Stats for ' + MATCH + ' ===\n');
  if (!stats || stats.length === 0) {
    console.log('No player stats found!');
    return;
  }

  // Show all columns for each player
  console.log('Players with stats (' + stats.length + '):\n');
  stats.sort((a, b) => (b.total_fantasy_points || 0) - (a.total_fantasy_points || 0));
  stats.forEach(s => {
    console.log(s.players.player_name + ' (' + s.players.squads.team_code + ') - ' + s.players.player_role);
    // Print all stat columns
    const { players, ...statCols } = s;
    console.log('  ' + JSON.stringify(statCols));
    console.log('');
  });

  // Get player slots config for this match
  const { data: slots } = await sb
    .from('player_slots')
    .select('*')
    .eq('match_id', MATCH)
    .order('slot_number');

  console.log('\n=== Player Slots Config ===');
  (slots || []).forEach(sl => {
    console.log('  Slot ' + sl.slot_number + ': multiplier=' + sl.multiplier + ' enabled=' + sl.is_enabled);
  });

  // Get 3 sample bets to show player pick scoring
  const { data: bets } = await sb
    .from('bets')
    .select('user_id, player_picks, player_pick_points')
    .eq('match_id', MATCH)
    .limit(3);

  const userIds = bets.map(b => b.user_id);
  const { data: lb } = await sb.from('leaderboard').select('user_id, display_name').in('user_id', userIds);
  const nameMap = {};
  (lb || []).forEach(u => { nameMap[u.user_id] = u.display_name; });

  // Build stats lookup by player_id
  const statsMap = {};
  stats.forEach(s => { statsMap[s.player_id] = s; });

  console.log('\n\n=== 3 Sample Bets - Player Pick Scoring Breakdown ===\n');
  bets.forEach(b => {
    console.log('User: ' + (nameMap[b.user_id] || b.user_id));
    console.log('  Total player_pick_points (from DB): ' + b.player_pick_points);
    console.log('  Picks:');
    (b.player_picks || []).forEach((pick, i) => {
      const stat = statsMap[pick.player_id];
      const slot = slots ? slots[i] : null;
      const multiplier = slot ? slot.multiplier : '?';
      if (stat) {
        console.log('    Slot ' + (i+1) + ' (x' + multiplier + '): ' + pick.player_name + ' (' + pick.team + ')');
        console.log('      Fantasy points: ' + stat.total_fantasy_points);
        console.log('      Runs: ' + (stat.runs_scored || 0) + ', Wickets: ' + (stat.wickets_taken || 0) + ', Catches: ' + (stat.catches || 0));
        console.log('      Balls faced: ' + (stat.balls_faced || 0) + ', Overs: ' + (stat.overs_bowled || 0));
        console.log('      Fours: ' + (stat.fours || 0) + ', Sixes: ' + (stat.sixes || 0));
        console.log('      All stat columns: ' + JSON.stringify(stat));
        const contribution = (stat.total_fantasy_points || 0) * multiplier;
        console.log('      => Contribution to score: ' + stat.total_fantasy_points + ' x ' + multiplier + ' = ' + contribution);
      } else {
        console.log('    Slot ' + (i+1) + ' (x' + multiplier + '): ' + pick.player_name + ' (' + pick.team + ') — NO STATS FOUND');
      }
    });
    console.log('');
  });
})();
