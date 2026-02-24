const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'ui', '.env') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: configs, error: configErr } = await sb
    .from('long_term_bets_config')
    .select('*');

  if (configErr) {
    console.error('Error fetching long_term_bets_config:', configErr.message);
    return;
  }

  const config = configs[0];

  console.log('='.repeat(100));
  console.log('LONG-TERM BETS CONFIG');
  console.log('='.repeat(100));
  console.log('  Event:              ' + config.event_id);
  console.log('  Lock Time:          ' + config.lock_time);
  console.log('  Is Locked:          ' + config.is_locked);
  console.log('  Allow Changes:      ' + config.allow_changes);
  console.log('  Change Cost %:      ' + config.change_cost_percent);
  console.log('');
  console.log('  Points:');
  console.log('    Winner:           ' + config.winner_points);
  console.log('    Finalist:         ' + config.finalist_points);
  console.log('    Final Four:       ' + config.final_four_points);
  console.log('    Orange Cap:       ' + config.orange_cap_points);
  console.log('    Purple Cap:       ' + config.purple_cap_points);
  console.log('');
  console.log('  Actual Results:');
  console.log('    Winner:           ' + (config.actual_winner || '(not set)'));
  console.log('    Finalists:        ' + (config.actual_finalists ? JSON.stringify(config.actual_finalists) : '(not set)'));
  console.log('    Final Four:       ' + (config.actual_final_four ? JSON.stringify(config.actual_final_four) : '(not set)'));
  console.log('    Orange Cap:       ' + (config.actual_orange_cap || '(not set)'));
  console.log('    Purple Cap:       ' + (config.actual_purple_cap || '(not set)'));
  console.log('');

  const { data: bets, error: betsErr } = await sb
    .from('long_term_bets')
    .select('*');

  if (betsErr) {
    console.error('Error fetching long_term_bets:', betsErr.message);
    return;
  }

  const { data: users, error: usersErr } = await sb
    .from('users')
    .select('user_id, display_name, email');

  if (usersErr) {
    console.error('Error fetching users:', usersErr.message);
    return;
  }

  const userMap = {};
  (users || []).forEach(u => {
    userMap[u.user_id] = u.display_name || u.email || u.id;
  });

  const playerIds = new Set();
  (bets || []).forEach(b => {
    (b.orange_cap_players || []).forEach(p => playerIds.add(p));
    (b.purple_cap_players || []).forEach(p => playerIds.add(p));
  });

  const playerMap = {};
  if (playerIds.size > 0) {
    // Fetch players with squad join for team_code
    const { data: players, error: playersErr } = await sb
      .from('players')
      .select('player_id, player_name, squad_id')
      .in('player_id', Array.from(playerIds));

    if (playersErr) {
      console.error('Error fetching players:', playersErr.message);
    } else {
      // Also fetch squads for team_code mapping
      const squadIds = [...new Set((players || []).map(p => p.squad_id))];
      const { data: squads } = await sb.from('squads').select('squad_id, team_code').in('squad_id', squadIds);
      const squadMap = {};
      (squads || []).forEach(s => { squadMap[s.squad_id] = s.team_code; });
      (players || []).forEach(p => {
        const team = squadMap[p.squad_id] || '??';
        playerMap[p.player_id] = p.player_name + ' (' + team + ')';
      });
    }
  }

  function resolvePlayer(uuid) {
    return playerMap[uuid] || uuid;
  }

  console.log('='.repeat(100));
  console.log('USERS WHO PLACED LONG-TERM BETS: ' + bets.length);
  console.log('='.repeat(100));
  console.log('');

  bets.sort((a, b) => {
    const nameA = (userMap[a.user_id] || '').toLowerCase();
    const nameB = (userMap[b.user_id] || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  bets.forEach((bet, idx) => {
    const name = userMap[bet.user_id] || bet.user_id;
    console.log('-'.repeat(100));
    console.log((idx + 1) + '. ' + name);
    console.log('   Placed: ' + bet.created_at + ' | Updated: ' + bet.updated_at);
    console.log('   Scored: ' + bet.is_scored + ' | Total Points: ' + bet.total_points);
    console.log('');
    console.log('   Tournament Winner:  ' + (bet.winner_team || '(none)'));
    console.log('   Finalists:          ' + (bet.finalist_teams || []).join(', '));
    console.log('   Final Four:         ' + (bet.final_four_teams || []).join(', '));
    console.log('   Orange Cap Picks:   ' + (bet.orange_cap_players || []).map(resolvePlayer).join(', '));
    console.log('   Purple Cap Picks:   ' + (bet.purple_cap_players || []).map(resolvePlayer).join(', '));
    console.log('');
  });

  console.log('='.repeat(100));
  console.log('ANSWER DISTRIBUTION');
  console.log('='.repeat(100));

  console.log('');
  console.log('TOURNAMENT WINNER picks:');
  const winnerDist = {};
  bets.forEach(b => {
    const t = b.winner_team || 'none';
    winnerDist[t] = (winnerDist[t] || 0) + 1;
  });
  Object.entries(winnerDist).sort((a, b) => b[1] - a[1]).forEach(([team, count]) => {
    console.log('  ' + team + ': ' + count + ' user(s)');
  });

  console.log('');
  console.log('FINALIST picks (each user picks 2):');
  const finalistDist = {};
  bets.forEach(b => {
    (b.finalist_teams || []).forEach(t => {
      finalistDist[t] = (finalistDist[t] || 0) + 1;
    });
  });
  Object.entries(finalistDist).sort((a, b) => b[1] - a[1]).forEach(([team, count]) => {
    console.log('  ' + team + ': ' + count + ' user(s)');
  });

  console.log('');
  console.log('FINAL FOUR picks (each user picks 4):');
  const f4Dist = {};
  bets.forEach(b => {
    (b.final_four_teams || []).forEach(t => {
      f4Dist[t] = (f4Dist[t] || 0) + 1;
    });
  });
  Object.entries(f4Dist).sort((a, b) => b[1] - a[1]).forEach(([team, count]) => {
    console.log('  ' + team + ': ' + count + ' user(s)');
  });

  console.log('');
  console.log('ORANGE CAP picks (top run scorer):');
  const orangeDist = {};
  bets.forEach(b => {
    (b.orange_cap_players || []).forEach(p => {
      const pName = resolvePlayer(p);
      orangeDist[pName] = (orangeDist[pName] || 0) + 1;
    });
  });
  Object.entries(orangeDist).sort((a, b) => b[1] - a[1]).forEach(([player, count]) => {
    console.log('  ' + player + ': ' + count + ' user(s)');
  });

  console.log('');
  console.log('PURPLE CAP picks (top wicket taker):');
  const purpleDist = {};
  bets.forEach(b => {
    (b.purple_cap_players || []).forEach(p => {
      const pName = resolvePlayer(p);
      purpleDist[pName] = (purpleDist[pName] || 0) + 1;
    });
  });
  Object.entries(purpleDist).sort((a, b) => b[1] - a[1]).forEach(([player, count]) => {
    console.log('  ' + player + ': ' + count + ' user(s)');
  });
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
