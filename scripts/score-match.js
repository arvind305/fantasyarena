#!/usr/bin/env node
/**
 * Reusable Match Scoring Tool
 *
 * Usage: node scripts/score-match.js scripts/matches/m40.json [--dry-run]
 *
 * Auto-fetches match config, players, and side bets from DB.
 * Fuzzy-matches player names from scorecard to DB records.
 * Calculates fantasy points and runs the full 7-step scoring pipeline.
 *
 * Input: JSON file with scorecard data (see scripts/matches/template.json)
 * Winner: "teamA", "teamB", or "superOver"
 * Overs: Cricket notation (3.3 = 3 overs 3 balls → 3.5 decimal)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========== Utilities ==========

/** Convert cricket overs notation to decimal (3.3 → 3.5, 4 → 4.0) */
function cricketOversToDec(overs) {
  const full = Math.floor(overs);
  const balls = Math.round((overs - full) * 10);
  if (balls > 5) {
    throw new Error(`Invalid overs: ${overs} — balls part is ${balls} (max 5). Use cricket notation: 3.3 = 3 overs 3 balls.`);
  }
  return full + balls / 6;
}

/** Fantasy points formula (mirrors DB RPC calculate_player_fantasy_points) */
function calcFantasyPoints(s) {
  let pts = 0;
  // Batting
  pts += (s.runs || 0);
  pts += (s.fours || 0) * 10;
  pts += (s.sixes || 0) * 20;
  if ((s.balls_faced || 0) > 0) {
    const sr = ((s.runs || 0) / s.balls_faced) * 100;
    pts += Math.round(sr);
  }
  // Bowling
  pts += (s.wickets || 0) * 20;
  if ((s.overs_bowled || 0) > 0) {
    const eco = (s.runs_conceded || 0) / s.overs_bowled;
    if (eco <= 6) pts += 100;
    else if (eco <= 8) pts += 50;
    else if (eco <= 10) pts += 25;
  }
  // Fielding
  pts += (s.catches || 0) * 5;
  pts += (s.run_outs || 0) * 5;
  pts += (s.stumpings || 0) * 5;
  // Bonuses
  if (s.has_century) pts += 200;
  if (s.has_five_wicket_haul) pts += 200;
  if (s.has_hat_trick) pts += 200;
  if (s.is_man_of_match) pts += 200;
  return pts;
}

/** Normalize name for matching: lowercase, remove dots/hyphens/apostrophes, collapse spaces */
function normalizeName(name) {
  return name.toLowerCase().replace(/[.\-']/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Fuzzy-match a scorecard name to a DB player.
 * Strategies (in order): exact → last name → substring → initial+last name → first name
 * Returns matched player object or null.
 */
function findPlayer(scorecardName, dbPlayers) {
  const norm = normalizeName(scorecardName);

  // 1. Exact match (normalized)
  for (const p of dbPlayers) {
    if (normalizeName(p.player_name) === norm) return p;
  }

  // 2. Last name match (unique)
  const lastName = norm.split(' ').pop();
  const lastNameMatches = dbPlayers.filter(p => {
    const dbLast = normalizeName(p.player_name).split(' ').pop();
    return dbLast === lastName;
  });
  if (lastNameMatches.length === 1) return lastNameMatches[0];

  // 3. Substring match (one name contains the other)
  const substringMatches = dbPlayers.filter(p => {
    const dbNorm = normalizeName(p.player_name);
    return dbNorm.includes(norm) || norm.includes(dbNorm);
  });
  if (substringMatches.length === 1) return substringMatches[0];

  // 4. First initial + last name (e.g., "K Perera" → "Kusal Perera")
  const parts = norm.split(' ');
  if (parts.length >= 2) {
    const initial = parts[0][0];
    const rest = parts.slice(1).join(' ');
    const initialMatches = dbPlayers.filter(p => {
      const dbNorm = normalizeName(p.player_name);
      const dbParts = dbNorm.split(' ');
      return dbParts.length >= 2 && dbParts[0][0] === initial && dbNorm.endsWith(rest);
    });
    if (initialMatches.length === 1) return initialMatches[0];
  }

  // 5. First name match (unique) — handles single-name players
  const firstName = norm.split(' ')[0];
  if (firstName.length > 2) {
    const firstNameMatches = dbPlayers.filter(p => {
      const dbFirst = normalizeName(p.player_name).split(' ')[0];
      return dbFirst === firstName;
    });
    if (firstNameMatches.length === 1) return firstNameMatches[0];
  }

  return null;
}

// ========== Main ==========

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node scripts/score-match.js <match-json> [--dry-run]');
    console.error('Example: node scripts/score-match.js scripts/matches/m40.json');
    console.error('         node scripts/score-match.js scripts/matches/m40.json --dry-run');
    process.exit(1);
  }
  const dryRun = process.argv.includes('--dry-run');

  // Read input JSON
  const input = JSON.parse(fs.readFileSync(path.resolve(inputFile), 'utf8'));
  const matchId = input.matchId;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Scoring ${matchId}${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`${'='.repeat(50)}`);

  // ── Fetch match config ──
  console.log('\nFetching match config...');
  const { data: config, error: configErr } = await supabase
    .from('match_config').select('*').eq('match_id', matchId).single();
  if (configErr) { console.error('Failed to fetch match_config:', configErr.message); process.exit(1); }
  console.log(`  ${config.team_a} vs ${config.team_b} | Status: ${config.status}`);

  // ── Fetch side bet ──
  console.log('Fetching side bet...');
  const { data: sideBets } = await supabase
    .from('side_bets').select('*').eq('match_id', matchId);
  const sideBet = sideBets?.[0];
  if (!sideBet) { console.error('No side bet found for', matchId); process.exit(1); }
  console.log(`  Q: "${sideBet.question_text}"`);
  console.log(`  Answer: "${input.sideBetAnswer}"`);

  // ── Fetch players for both teams ──
  console.log('Fetching players...');
  const { data: squads } = await supabase
    .from('squads').select('squad_id, team_code')
    .in('team_code', [config.team_a, config.team_b]);
  const squadMap = {};
  squads.forEach(s => { squadMap[s.squad_id] = s.team_code; });

  const { data: dbPlayers } = await supabase
    .from('players').select('player_id, player_name, squad_id')
    .in('squad_id', squads.map(s => s.squad_id));
  console.log(`  ${dbPlayers.length} players loaded (${config.team_a} + ${config.team_b})`);

  // ── Merge innings data into per-player stats ──
  console.log('\nProcessing scorecard...');
  const playerData = {}; // scorecardName → stats

  const initStats = () => ({
    runs: 0, balls_faced: 0, fours: 0, sixes: 0,
    wickets: 0, overs_bowled: 0, runs_conceded: 0,
    catches: 0, run_outs: 0, stumpings: 0,
    is_man_of_match: false, has_century: false,
    has_five_wicket_haul: false, has_hat_trick: false,
  });

  for (const innings of input.innings) {
    // Batting
    for (const b of (innings.batting || [])) {
      if (!playerData[b.name]) playerData[b.name] = initStats();
      const s = playerData[b.name];
      s.runs = b.runs;
      s.balls_faced = b.balls;
      s.fours = b.fours;
      s.sixes = b.sixes;
    }
    // Bowling
    for (const b of (innings.bowling || [])) {
      if (!playerData[b.name]) playerData[b.name] = initStats();
      const s = playerData[b.name];
      s.overs_bowled = cricketOversToDec(b.overs);
      s.runs_conceded = b.runs;
      s.wickets = b.wickets;
      if (b.hatTrick) s.has_hat_trick = true;
    }
    // Fielding
    if (innings.fielding) {
      for (const [name, count] of Object.entries(innings.fielding.catches || {})) {
        if (!playerData[name]) playerData[name] = initStats();
        playerData[name].catches += count;
      }
      for (const [name, count] of Object.entries(innings.fielding.stumpings || {})) {
        if (!playerData[name]) playerData[name] = initStats();
        playerData[name].stumpings += count;
      }
      for (const [name, count] of Object.entries(innings.fielding.runOuts || {})) {
        if (!playerData[name]) playerData[name] = initStats();
        playerData[name].run_outs += count;
      }
    }
  }

  console.log(`  ${Object.keys(playerData).length} players found in scorecard`);

  // ── Match scorecard names to DB players ──
  console.log('\nMatching player names...');
  const unmatched = [];
  const statsRows = [];

  for (const [scorecardName, stats] of Object.entries(playerData)) {
    const player = findPlayer(scorecardName, dbPlayers);
    if (!player) {
      unmatched.push(scorecardName);
      continue;
    }

    // Set auto-detected bonus flags
    stats.has_century = stats.runs >= 100;
    stats.has_five_wicket_haul = stats.wickets >= 5;

    // Calculate derived rates
    const sr = stats.balls_faced > 0 ? (stats.runs / stats.balls_faced) * 100 : 0;
    const eco = stats.overs_bowled > 0 ? stats.runs_conceded / stats.overs_bowled : null;

    const team = squadMap[player.squad_id] || '???';
    console.log(`  ${scorecardName} → ${player.player_name} (${team})`);

    statsRows.push({
      match_id: matchId,
      player_id: player.player_id,
      _display_name: player.player_name, // stripped before DB insert
      _team: team,
      ...stats,
      strike_rate: parseFloat(sr.toFixed(2)),
      economy_rate: eco !== null ? parseFloat(eco.toFixed(2)) : null,
    });
  }

  // Abort on unmatched names
  if (unmatched.length > 0) {
    console.error('\n*** UNMATCHED PLAYERS — FIX INPUT NAMES AND RETRY ***');
    for (const name of unmatched) {
      console.error(`  "${name}" — no match found`);
      const norm = normalizeName(name);
      const words = norm.split(' ');
      const close = dbPlayers.filter(p => {
        const pn = normalizeName(p.player_name);
        return words.some(w => w.length > 2 && pn.includes(w));
      });
      if (close.length > 0 && close.length <= 5) {
        console.error(`    Possible: ${close.map(p => `${p.player_name} (${squadMap[p.squad_id]})`).join(', ')}`);
      }
    }
    process.exit(1);
  }

  // ── Set Man of the Match ──
  const momPlayer = findPlayer(input.manOfMatch, dbPlayers);
  if (!momPlayer) {
    console.error(`\nMoM "${input.manOfMatch}" not found in DB players!`);
    const norm = normalizeName(input.manOfMatch);
    const words = norm.split(' ');
    const close = dbPlayers.filter(p => {
      const pn = normalizeName(p.player_name);
      return words.some(w => w.length > 2 && pn.includes(w));
    });
    if (close.length > 0) {
      console.error(`  Possible: ${close.map(p => p.player_name).join(', ')}`);
    }
    process.exit(1);
  }

  const momRow = statsRows.find(r => r.player_id === momPlayer.player_id);
  if (momRow) {
    momRow.is_man_of_match = true;
  } else {
    // MoM not in scorecard data — rare but possible
    console.warn(`  Warning: MoM "${input.manOfMatch}" not in scorecard data, adding with MoM bonus only`);
    const emptyStats = initStats();
    emptyStats.is_man_of_match = true;
    statsRows.push({
      match_id: matchId,
      player_id: momPlayer.player_id,
      _display_name: momPlayer.player_name,
      _team: squadMap[momPlayer.squad_id] || '???',
      ...emptyStats,
      strike_rate: 0,
      economy_rate: null,
    });
  }

  // ── Calculate fantasy points ──
  for (const row of statsRows) {
    row.total_fantasy_points = calcFantasyPoints(row);
  }

  // Print top scorers
  const sorted = [...statsRows].sort((a, b) => b.total_fantasy_points - a.total_fantasy_points);
  console.log('\nTop fantasy scorers:');
  sorted.slice(0, 8).forEach((s, i) => {
    const flags = [];
    if (s.is_man_of_match) flags.push('MoM');
    if (s.has_century) flags.push('100');
    if (s.has_five_wicket_haul) flags.push('5W');
    if (s.has_hat_trick) flags.push('HT');
    const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
    console.log(`  ${i + 1}. ${s._display_name} (${s._team}): ${s.total_fantasy_points} pts${flagStr}`);
  });

  // ── Build winner option ID ──
  let winnerOptionId;
  if (input.winner === 'teamA') {
    winnerOptionId = `opt_${matchId}_winner_teamA`;
  } else if (input.winner === 'teamB') {
    winnerOptionId = `opt_${matchId}_winner_teamB`;
  } else if (input.winner === 'superOver') {
    winnerOptionId = `opt_${matchId}_winner_superover`;
  } else {
    console.error(`\nInvalid winner: "${input.winner}" — must be "teamA", "teamB", or "superOver"`);
    process.exit(1);
  }

  const winnerTeam = input.winner === 'teamA' ? config.team_a :
                     input.winner === 'teamB' ? config.team_b : 'Super Over';

  console.log(`\nSummary:`);
  console.log(`  Match: ${matchId} — ${config.team_a} vs ${config.team_b}`);
  console.log(`  Winner: ${winnerTeam} (${winnerOptionId})`);
  console.log(`  Total Runs: ${input.totalRuns}`);
  console.log(`  MoM: ${momPlayer.player_name}`);
  console.log(`  Side Bet: "${input.sideBetAnswer}"`);
  console.log(`  Players: ${statsRows.length}`);

  if (dryRun) {
    console.log(`\n*** DRY RUN COMPLETE — no data written to DB ***`);
    return;
  }

  // ══════════════════════════════════════════════════
  //  Execute 7-Step Scoring Pipeline
  // ══════════════════════════════════════════════════

  // Step 1: Insert match_results
  console.log('\n--- Step 1: Inserting match_results ---');
  const { error: resErr } = await supabase.from('match_results').upsert({
    match_id: matchId,
    winner: winnerOptionId,
    total_runs: input.totalRuns,
  }, { onConflict: 'match_id' });
  if (resErr) { console.error('  ERROR:', resErr.message); process.exit(1); }
  console.log('  Done.');

  // Step 2: Set side bet correct answer
  console.log('--- Step 2: Setting side bet answer ---');
  const { error: sbErr } = await supabase.from('side_bets')
    .update({ correct_answer: input.sideBetAnswer })
    .eq('side_bet_id', sideBet.side_bet_id);
  if (sbErr) { console.error('  ERROR:', sbErr.message); process.exit(1); }
  console.log(`  "${sideBet.question_text}" → "${input.sideBetAnswer}"`);

  // Step 3: Insert player_match_stats
  console.log('--- Step 3: Inserting player_match_stats ---');
  const dbRows = statsRows.map(({ _display_name, _team, ...rest }) => rest);
  // Delete existing first (safe for re-scoring)
  await supabase.from('player_match_stats').delete().eq('match_id', matchId);
  const { error: psErr } = await supabase.from('player_match_stats').insert(dbRows);
  if (psErr) { console.error('  ERROR:', psErr.message); process.exit(1); }
  console.log(`  Inserted ${dbRows.length} player records.`);

  // Step 4: Calculate player fantasy points via RPC
  console.log('--- Step 4: RPC calculate_all_player_points ---');
  const { error: fpErr } = await supabase.rpc('calculate_all_player_points', { p_match_id: matchId });
  if (fpErr) { console.error('  ERROR:', fpErr.message); process.exit(1); }
  console.log('  Done.');

  // Step 5: Score all bets via RPC
  console.log('--- Step 5: RPC calculate_match_scores ---');
  const { data: scoreData, error: scErr } = await supabase.rpc('calculate_match_scores', {
    p_match_id: matchId,
    p_event_id: 't20wc_2026',
  });
  if (scErr) { console.error('  ERROR:', scErr.message); process.exit(1); }
  console.log('  Result:', scoreData);

  // Step 6: Update match status to SCORED
  console.log('--- Step 6: Updating match status to SCORED ---');
  const { error: stErr } = await supabase.from('match_config')
    .update({ status: 'SCORED' })
    .eq('match_id', matchId);
  if (stErr) { console.error('  ERROR:', stErr.message); process.exit(1); }
  console.log('  Done.');

  // Step 7: Verify
  console.log('\n--- Step 7: Verification ---');
  const { data: bets } = await supabase.from('bets')
    .select('user_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points')
    .eq('match_id', matchId);
  if (bets?.length) {
    console.log(`\nBet scores (${bets.length} bets):`);
    bets.forEach(b => {
      console.log(`  User ${b.user_id.substring(0, 8)}...: total=${b.score} | winner=${b.winner_points} runs=${b.total_runs_points} player=${b.player_pick_points} side=${b.side_bet_points}`);
    });
  } else {
    console.log('  No bets found for this match.');
  }

  // Leaderboard
  console.log('\nLeaderboard (Top 15):');
  const { data: lb } = await supabase.from('leaderboard')
    .select('rank, display_name, total_score, matches_played')
    .order('rank', { ascending: true })
    .limit(15);
  if (lb) {
    lb.forEach(r => console.log(`  #${r.rank} ${r.display_name}: ${r.total_score} pts (${r.matches_played} matches)`));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${matchId} SCORED SUCCESSFULLY`);
  console.log(`${'='.repeat(50)}\n`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
