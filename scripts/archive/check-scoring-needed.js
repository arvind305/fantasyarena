require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    // 1. All LOCKED matches (need scoring)
    console.log('=== LOCKED MATCHES (need scoring) ===\n');
    const { data: locked, error: lockedErr } = await sb
      .from('match_config')
      .select('match_id, team_a, team_b, status, lock_time')
      .eq('status', 'LOCKED')
      .order('match_id');

    if (lockedErr) {
      console.error('Error fetching locked matches:', lockedErr.message);
    } else if (!locked || locked.length === 0) {
      console.log('No LOCKED matches found.\n');
    } else {
      console.log(`Found ${locked.length} LOCKED match(es):\n`);
      locked.forEach(m => {
        console.log(`  ${m.match_id}: ${m.team_a} vs ${m.team_b} | status=${m.status} | lock_time=${m.lock_time}`);
      });
      console.log();
    }

    // 2. Find SCO vs NEP match
    console.log('=== SCO vs NEP MATCH ===\n');
    const { data: scoNep, error: scoNepErr } = await sb
      .from('match_config')
      .select('match_id, team_a, team_b, status, lock_time')
      .or('and(team_a.eq.SCO,team_b.eq.NEP),and(team_a.eq.NEP,team_b.eq.SCO)');

    if (scoNepErr) {
      console.error('Error fetching SCO vs NEP:', scoNepErr.message);
    } else if (!scoNep || scoNep.length === 0) {
      console.log('No SCO vs NEP match found.\n');
    } else {
      const match = scoNep[0];
      console.log(`Match ID: ${match.match_id}`);
      console.log(`Teams: ${match.team_a} vs ${match.team_b}`);
      console.log(`Status: ${match.status}`);
      console.log(`Lock Time: ${match.lock_time}`);
      console.log();

      // 3. Side bets for this match
      console.log(`=== SIDE BETS for ${match.match_id} ===\n`);
      const { data: sideBets, error: sbErr } = await sb
        .from('side_bets')
        .select('*')
        .eq('match_id', match.match_id);

      if (sbErr) {
        console.error('Error fetching side bets:', sbErr.message);
      } else if (!sideBets || sideBets.length === 0) {
        console.log('No side bets configured for this match.\n');
      } else {
        sideBets.forEach(bet => {
          console.log(`  Side Bet ID: ${bet.side_bet_id}`);
          console.log(`  Question: ${bet.question_text}`);
          console.log(`  Options: ${JSON.stringify(bet.options)}`);
          console.log(`  Points (correct/wrong): ${bet.points_correct} / ${bet.points_wrong}`);
          console.log(`  Correct Answer: ${bet.correct_answer !== null ? bet.correct_answer : '(not set yet)'}`);
          console.log(`  Status: ${bet.status}`);
          console.log();
        });
      }
    }

    // 4. Active players for SCO and NEP (join through squads table)
    console.log('=== ACTIVE PLAYERS (SCO & NEP) ===\n');

    // Get squad IDs for SCO and NEP
    const { data: squads, error: squadsErr } = await sb
      .from('squads')
      .select('squad_id, team_code, team_name')
      .in('team_code', ['SCO', 'NEP']);

    if (squadsErr) {
      console.error('Error fetching squads:', squadsErr.message);
      return;
    }

    const squadMap = {};
    squads.forEach(s => { squadMap[s.squad_id] = s.team_code; });
    const squadIds = squads.map(s => s.squad_id);

    const { data: players, error: playersErr } = await sb
      .from('players')
      .select('player_id, player_name, squad_id, player_role, is_active')
      .in('squad_id', squadIds)
      .eq('is_active', true)
      .order('squad_id')
      .order('player_role')
      .order('player_name');

    if (playersErr) {
      console.error('Error fetching players:', playersErr.message);
    } else if (!players || players.length === 0) {
      console.log('No active players found for SCO or NEP.\n');
    } else {
      // Add team_code to each player
      players.forEach(p => { p.team_code = squadMap[p.squad_id]; });

      const scoPlayers = players.filter(p => p.team_code === 'SCO');
      const nepPlayers = players.filter(p => p.team_code === 'NEP');

      console.log(`SCO players (${scoPlayers.length}):`);
      scoPlayers.forEach(p => {
        console.log(`  ${p.player_id.slice(0, 8)}... | ${p.player_name.padEnd(25)} | SCO | ${p.player_role}`);
      });
      console.log();

      console.log(`NEP players (${nepPlayers.length}):`);
      nepPlayers.forEach(p => {
        console.log(`  ${p.player_id.slice(0, 8)}... | ${p.player_name.padEnd(25)} | NEP | ${p.player_role}`);
      });
      console.log();

      console.log(`Total active players: ${players.length}`);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
})();
