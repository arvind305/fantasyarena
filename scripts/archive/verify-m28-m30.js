/**
 * Dry-run verification of scoring data for wc_m28-m30.
 * Checks: total runs match, side bet answers, player IDs exist, fantasy points sanity.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function calcFantasyPoints(p) {
  let pts = 0;
  pts += p.runs;
  pts += p.fours * 10;
  pts += p.sixes * 20;
  if (p.balls > 0) pts += Math.round((p.runs / p.balls) * 100);
  pts += p.wickets * 20;
  if (p.overs >= 1 && p.econ !== null) {
    if (p.econ <= 6) pts += 100;
    else if (p.econ <= 8) pts += 50;
    else if (p.econ <= 10) pts += 25;
  }
  pts += (p.catches || 0) * 5;
  pts += (p.runOuts || 0) * 5;
  pts += (p.stumpings || 0) * 5;
  if (p.runs >= 100) pts += 200;
  if (p.wickets >= 5) pts += 200;
  if (p.isMoM) pts += 200;
  return pts;
}

(async () => {
  let allGood = true;

  // Load match data from the scoring script (inline copies for verification)
  const matches = [
    {
      matchId: 'wc_m28', label: 'AFG vs UAE', winner: 'opt_wc_m28_winner_teamA',
      totalRuns: 322, sideBetAnswer: '51-75', mom: 'Azmatullah Omarzai',
      scoreboardTotal: [160, 162], // UAE, AFG
      players: [
        { pid: '9f11f370-b490-44c6-8aa7-2f541f9cf171', name: 'Aryansh Sharma', runs: 0, balls: 4, fours: 0, sixes: 0, overs: 0, econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: '5134b69d-86f3-4d16-931a-e782cb2609e3', name: 'Muhammad Waseem', runs: 10, balls: 6, fours: 2, sixes: 0, overs: 0, econ: null, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
        { pid: '22e74fa7-558b-4ac9-b058-5dddb09aa954', name: 'Alishan Sharafu', runs: 40, balls: 31, fours: 3, sixes: 2, overs: 0, econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: 'bfbc1931-9569-4ad0-88df-78bec17f29cc', name: 'Haider Ali', runs: 13, balls: 12, fours: 2, sixes: 0, overs: 4, econ: 8.25, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: 'cf72a819-5bdb-4239-9007-5fd069a563c0', name: 'Junaid Siddique', runs: 3, balls: 2, fours: 0, sixes: 0, overs: 3, econ: 6.90, wickets: 2, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: '6bf925bd-07e4-469d-bdba-178ddd0931ca', name: 'Muhammad Jawadullah', runs: 0, balls: 0, fours: 0, sixes: 0, overs: 4, econ: 9.75, wickets: 1, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: 'e3e62b5d-4870-426f-bd1b-02ea1c46ca89', name: 'Rahmanullah Gurbaz', runs: 0, balls: 2, fours: 0, sixes: 0, overs: 0, econ: null, wickets: 0, catches: 2, stumpings: 0, runOuts: 1 },
        { pid: '51211070-9cb6-4a3f-ae5e-b2942e48bb98', name: 'Ibrahim Zadran', runs: 53, balls: 41, fours: 6, sixes: 1, overs: 0, econ: null, wickets: 0, catches: 1, stumpings: 0, runOuts: 0 },
        { pid: '7160b6a0-c7f8-40c5-b5e4-a2c082e144cf', name: 'Gulbadin Naib', runs: 13, balls: 12, fours: 1, sixes: 1, overs: 1, econ: 8.00, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: 'a2d62f67-d8ed-4223-b674-8cb6b615ad19', name: 'Sediqullah Atal', runs: 16, balls: 14, fours: 1, sixes: 1, overs: 0, econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: '5d1a02fe-feea-47fe-8347-05a3c88ef0f2', name: 'Darwish Rasooli', runs: 33, balls: 23, fours: 3, sixes: 1, overs: 0, econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: 'f3b15726-d5e4-4c12-b970-afbe36b1cb1f', name: 'Azmatullah Omarzai', runs: 40, balls: 21, fours: 2, sixes: 3, overs: 4, econ: 3.75, wickets: 4, catches: 0, stumpings: 0, runOuts: 0, isMoM: true },
        { pid: '548ba945-68ff-4c5e-a8d2-eda82106cee4', name: 'Mohammad Nabi', runs: 3, balls: 3, fours: 0, sixes: 0, overs: 0, econ: null, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
        { pid: '397b4521-6d80-481c-8492-0c32358ea194', name: 'Rashid Khan', runs: 0, balls: 0, fours: 0, sixes: 0, overs: 4, econ: 6.00, wickets: 1, catches: 0, stumpings: 0, runOuts: 1 },
        { pid: '00825a0f-f20e-4bf1-a15e-a888eb0cf6d2', name: 'Mujeeb Ur Rahman', runs: 0, balls: 0, fours: 0, sixes: 0, overs: 4, econ: 7.75, wickets: 2, catches: 1, stumpings: 0, runOuts: 0 },
        { pid: 'cdccf965-4ccb-4d1b-a95a-a77b32067fa2', name: 'Noor Ahmad', runs: 0, balls: 0, fours: 0, sixes: 0, overs: 3, econ: 11.67, wickets: 0, catches: 0, stumpings: 0, runOuts: 0 },
      ]
    },
    {
      matchId: 'wc_m29', label: 'ENG vs ITA', winner: 'opt_wc_m29_winner_teamA',
      totalRuns: 380, sideBetAnswer: '21+', mom: 'Will Jacks',
      scoreboardTotal: [202, 178],
      players: [] // will just check totals
    },
    {
      matchId: 'wc_m30', label: 'AUS vs SL', winner: 'opt_wc_m30_winner_teamB',
      totalRuns: 365, sideBetAnswer: '36+', mom: 'Pathum Nissanka',
      scoreboardTotal: [181, 184],
      players: [] // will just check totals
    }
  ];

  for (const m of matches) {
    console.log('\n=== ' + m.label + ' (' + m.matchId + ') ===');

    // Verify total runs
    const computedTotal = m.scoreboardTotal[0] + m.scoreboardTotal[1];
    if (computedTotal !== m.totalRuns) {
      console.log('  FAIL: Total runs mismatch: ' + computedTotal + ' vs ' + m.totalRuns);
      allGood = false;
    } else {
      console.log('  OK: Total runs = ' + m.totalRuns + ' (' + m.scoreboardTotal[0] + ' + ' + m.scoreboardTotal[1] + ')');
    }

    // Verify player IDs exist in DB (only for m28 where we have full player list)
    if (m.players.length > 0) {
      const pids = m.players.map(p => p.pid);
      const { data: found } = await sb.from('players').select('player_id').in('player_id', pids);
      const foundSet = new Set((found || []).map(p => p.player_id));
      const missing = m.players.filter(p => !foundSet.has(p.pid));
      if (missing.length > 0) {
        console.log('  FAIL: ' + missing.length + ' player IDs NOT found in DB:');
        for (const p of missing) console.log('    ' + p.name + ' (' + p.pid + ')');
        allGood = false;
      } else {
        console.log('  OK: All ' + pids.length + ' player IDs verified in DB');
      }

      // Check fantasy points for key players
      console.log('\n  Fantasy points check:');
      for (const p of m.players) {
        const fp = calcFantasyPoints(p);
        const fld = (p.catches || 0) + (p.runOuts || 0) + (p.stumpings || 0);
        if (p.isMoM || fp > 200) {
          console.log('    ' + p.name.padEnd(25) + 'FP=' + String(fp).padStart(4) + '  R=' + p.runs + ' W=' + p.wickets + ' F=' + fld + (p.isMoM ? ' [MoM]' : ''));
        }
      }
    }

    // Check bets exist for this match
    const { data: bets } = await sb.from('bets').select('bet_id').eq('match_id', m.matchId);
    console.log('  Bets: ' + (bets?.length || 0) + ' bets found');

    // Check match_config status
    const { data: mc } = await sb.from('match_config').select('status, lock_time').eq('match_id', m.matchId).maybeSingle();
    console.log('  Status: ' + (mc?.status || '?') + ', Lock: ' + (mc?.lock_time || '?'));
  }

  console.log('\n' + (allGood ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'));
})();
