/**
 * Update squads to match official T20 WC 2026 rosters (as of Feb 17, 2026)
 * - Marks 32 removed players as is_active = false
 * - Inserts 32 new players
 * - Updates Ireland captain (Stirling out, Tucker now captain)
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });

const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Changes per team: { teamCode: { remove: [names], add: [{name, role}], captainChange: {old, new} } }
const changes = {
  // GROUP A
  IND: {
    remove: ['Harshit Rana'],
    add: [{ name: 'Mohammed Siraj', role: 'BOWL' }],
  },
  USA: {
    remove: ['Jessy Singh'],
    add: [{ name: 'Ehsan Adil', role: 'BOWL' }],
  },
  NAM: {
    remove: ['Ben Shikongo'],
    add: [{ name: 'Alexander Volschenk', role: 'AR' }],
  },

  // GROUP B
  ZIM: {
    remove: ['Brendan Taylor'],
    add: [{ name: 'Ben Curran', role: 'BAT' }],
  },
  SL: {
    remove: [
      'Avishka Fernando',
      'Lahiru Kumara',
      'Dilshan Madushanka',
      'Dhananjaya de Silva',
      'Wanindu Hasaranga',
      'Sadeera Samarawickrama',
    ],
    add: [
      { name: 'Kamil Mishara', role: 'BAT' },
      { name: 'Janith Liyanage', role: 'BAT' },
      { name: 'Pavan Rathnayake', role: 'AR' },
      { name: 'Dushmantha Chameera', role: 'BOWL' },
      { name: 'Pramod Madushan', role: 'BOWL' },
      { name: 'Dushan Hemantha', role: 'AR' },
    ],
  },
  AUS: {
    remove: ['Josh Hazlewood'],
    add: [{ name: 'Steve Smith', role: 'BAT' }],
  },
  OMAN: {
    remove: [
      'Bilal Khan',
      'Fayyaz Butt',
      'Ayaan Khan',
      'Zeeshan Maqsood',
      'Kaleemullah',
      'Aqib Ilyas',
      'Kashyap Prajapati',
    ],
    add: [
      { name: 'Vinayak Shukla', role: 'WK' },
      { name: 'Karan Sonavale', role: 'WK' },
      { name: 'Shah Faisal', role: 'BOWL' },
      { name: 'Nadeem Khan', role: 'AR' },
      { name: 'Shafiq Jan', role: 'AR' },
      { name: 'Ashish Odedara', role: 'BOWL' },
      { name: 'Jiten Ramanandi', role: 'BAT' },
    ],
  },
  IRE: {
    remove: ['Paul Stirling'],
    add: [{ name: 'Sam Topping', role: 'BAT' }],
    captainChange: { old: 'Paul Stirling', new: 'Lorcan Tucker' },
  },

  // GROUP C
  SCO: {
    remove: ['Safyaan Sharif'],
    add: [{ name: 'Jack Jarvis', role: 'BOWL' }],
  },

  // GROUP D
  NZ: {
    remove: ['Michael Bracewell'],
    add: [{ name: 'Cole McConchie', role: 'AR' }],
  },
  RSA: {
    remove: ['Tony de Zorzi', 'Donovan Ferreira'],
    add: [
      { name: 'Ryan Rickelton', role: 'WK' },
      { name: 'Tristan Stubbs', role: 'WK' },
    ],
  },
  UAE: {
    remove: [
      'Asif Khan',
      'Karthik Meiyappan',
      'Basil Hameed',
      'Mayank Dagar',
      'Zahoor Khan',
      'Rameez Shahzad',
      'Vriitya Aravind',
    ],
    add: [
      { name: 'Mayank Kumar', role: 'BAT' },
      { name: 'Sohaib Khan', role: 'BAT' },
      { name: 'Syed Haider', role: 'WK' },
      { name: 'Harshit Kaushik', role: 'AR' },
      { name: 'Muhammad Arfan', role: 'AR' },
      { name: 'Rohid Khan', role: 'BOWL' },
      { name: 'Simranjeet Singh', role: 'BOWL' },
    ],
  },
  AFG: {
    remove: ['Naveen Ul Haq'],
    add: [{ name: 'Ziaur Rahman Sharifi', role: 'BOWL' }],
  },
  CAN: {
    remove: ['Ali Shamshudeen'],
    add: [{ name: 'Kanwarpal Tathgur', role: 'WK' }],
  },
};

const DRY_RUN = process.argv.includes('--dry-run');

(async () => {
  // Load all squads
  const { data: squads, error: sqErr } = await sb.from('squads').select('squad_id, team_code, team_name');
  if (sqErr) { console.error('Failed to load squads:', sqErr); process.exit(1); }

  const squadMap = {};
  squads.forEach(s => { squadMap[s.team_code] = s; });

  // Load all players
  const { data: allPlayers, error: plErr } = await sb.from('players').select('player_id, squad_id, player_name, player_role, is_captain, is_active');
  if (plErr) { console.error('Failed to load players:', plErr); process.exit(1); }

  let totalDeactivated = 0;
  let totalInserted = 0;
  let totalCaptainChanges = 0;
  const errors = [];

  for (const [teamCode, teamChanges] of Object.entries(changes)) {
    const squad = squadMap[teamCode];
    if (!squad) {
      errors.push(`Squad not found for ${teamCode}`);
      continue;
    }
    console.log(`\n=== ${teamCode} — ${squad.team_name} ===`);

    const teamPlayers = allPlayers.filter(p => p.squad_id === squad.squad_id);

    // 1. Deactivate removed players
    for (const removeName of (teamChanges.remove || [])) {
      const player = teamPlayers.find(p => p.player_name === removeName && p.is_active !== false);
      if (!player) {
        errors.push(`${teamCode}: Cannot find active player "${removeName}" to deactivate`);
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would deactivate: ${player.player_name} (${player.player_role})`);
      } else {
        const { error } = await sb.from('players')
          .update({ is_active: false })
          .eq('player_id', player.player_id);
        if (error) {
          errors.push(`${teamCode}: Failed to deactivate ${removeName}: ${error.message}`);
        } else {
          console.log(`  DEACTIVATED: ${player.player_name} (${player.player_role})`);
        }
      }
      totalDeactivated++;
    }

    // 2. Insert new players
    for (const newPlayer of (teamChanges.add || [])) {
      // Check if player already exists (maybe added manually earlier)
      const existing = teamPlayers.find(p => p.player_name === newPlayer.name);
      if (existing) {
        if (existing.is_active === false) {
          // Re-activate
          if (!DRY_RUN) {
            await sb.from('players')
              .update({ is_active: true, player_role: newPlayer.role })
              .eq('player_id', existing.player_id);
          }
          console.log(`  RE-ACTIVATED: ${newPlayer.name} (${newPlayer.role})`);
        } else {
          console.log(`  ALREADY EXISTS: ${newPlayer.name} — skipping`);
        }
        totalInserted++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would insert: ${newPlayer.name} (${newPlayer.role})`);
      } else {
        const { error } = await sb.from('players').insert({
          squad_id: squad.squad_id,
          player_name: newPlayer.name,
          player_role: newPlayer.role,
          is_captain: false,
          is_active: true,
        });
        if (error) {
          errors.push(`${teamCode}: Failed to insert ${newPlayer.name}: ${error.message}`);
        } else {
          console.log(`  INSERTED: ${newPlayer.name} (${newPlayer.role})`);
        }
      }
      totalInserted++;
    }

    // 3. Captain changes
    if (teamChanges.captainChange) {
      const { old: oldCap, new: newCap } = teamChanges.captainChange;
      const newCapPlayer = teamPlayers.find(p => p.player_name === newCap);
      if (!newCapPlayer) {
        errors.push(`${teamCode}: Cannot find new captain "${newCap}"`);
      } else {
        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would set captain: ${newCap}`);
        } else {
          // Remove old captain flag (may already be deactivated)
          const oldCapPlayer = teamPlayers.find(p => p.player_name === oldCap);
          if (oldCapPlayer) {
            await sb.from('players').update({ is_captain: false }).eq('player_id', oldCapPlayer.player_id);
          }
          // Set new captain
          const { error } = await sb.from('players').update({ is_captain: true }).eq('player_id', newCapPlayer.player_id);
          if (error) {
            errors.push(`${teamCode}: Failed to set captain ${newCap}: ${error.message}`);
          } else {
            console.log(`  CAPTAIN: ${newCap} (was ${oldCap})`);
          }
        }
        totalCaptainChanges++;
      }
    }
  }

  console.log('\n========== SUMMARY ==========');
  console.log(`Players deactivated: ${totalDeactivated}`);
  console.log(`Players inserted/reactivated: ${totalInserted}`);
  console.log(`Captain changes: ${totalCaptainChanges}`);
  if (errors.length > 0) {
    console.log(`\nERRORS (${errors.length}):`);
    errors.forEach(e => console.log(`  ! ${e}`));
  } else {
    console.log('\nNo errors.');
  }

  if (DRY_RUN) {
    console.log('\n*** DRY RUN — no changes were made. Run without --dry-run to apply. ***');
  }
})();
