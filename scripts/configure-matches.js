#!/usr/bin/env node
/**
 * Auto-configure upcoming matches with default settings.
 *
 * Creates match_config, player_slots, and side_bets for all
 * unconfigured matches. Idempotent — safe to re-run.
 *
 * Usage: node scripts/configure-matches.js [--all]
 *   Default: configures matches from today through +3 days
 *   --all:   configures ALL unconfigured future matches
 */

// Workaround for Jio DNS issue blocking Supabase in India:
// Override dns.lookup to use Google DNS (8.8.8.8) instead of system DNS.
// Node 24's undici fetch calls dns.lookup, so this intercepts all network calls.
const dns = require('dns');
const origLookup = dns.lookup.bind(dns);
const { Resolver } = dns;
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const dnsCache = {};
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  if (typeof options === 'number') options = { family: options };
  options = options || {};
  const respond = (addrs) => {
    if (options.all) {
      callback(null, addrs.map(a => ({ address: a, family: 4 })));
    } else {
      callback(null, addrs[0], 4);
    }
  };
  if (dnsCache[hostname]) return respond(dnsCache[hostname]);
  resolver.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || !addresses.length) return origLookup(hostname, options, callback);
    dnsCache[hostname] = addresses;
    respond(addresses);
  });
};

require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MATCH_ID_PREFIX = 'wc_m';
const EVENT_ID = 't20wc_2026';

const SUPER8_SEEDING = {
  X1: 'IND', X2: 'ZIM', X3: 'WI', X4: 'RSA',
  Y1: 'ENG', Y2: 'NZ', Y3: 'PAK', Y4: 'SL',
};

// Default match config (same as used for group stage matches)
const DEFAULT_CONFIG = {
  winner_base_points: 1000,
  winner_wrong_points: 0,
  super_over_multiplier: 5,
  total_runs_base_points: 1000,
  player_slots_enabled: true,
  player_slot_count: 3,
  runners_enabled: false,
  runner_count: 0,
};

// Default player slots
const DEFAULT_SLOTS = [
  { slot_number: 1, multiplier: 100, is_enabled: true },
  { slot_number: 2, multiplier: 70, is_enabled: true },
  { slot_number: 3, multiplier: 40, is_enabled: true },
];

// Default side bets per match (rotate through these pairs)
const SIDE_BET_SETS = [
  [
    {
      question_text: 'What will the first innings total be?',
      options: ['<=120', '121-150', '151-180', '181-200', '>200'],
      points_correct: 400, points_wrong: 0,
    },
    {
      question_text: 'How many total wickets will fall in this match?',
      options: ['0-8', '9-12', '13-16', '17-20'],
      points_correct: 400, points_wrong: 0,
    },
  ],
  [
    {
      question_text: 'How many sixes will be hit in this match?',
      options: ['0-8', '9-14', '15-20', '21+'],
      points_correct: 400, points_wrong: 0,
    },
    {
      question_text: 'Will the match go to the last over (20th over of 2nd innings)?',
      options: ['Yes', 'No'],
      points_correct: 300, points_wrong: 0,
    },
  ],
  [
    {
      question_text: 'How many runs will be scored in the powerplay of the first innings?',
      options: ['<=30', '31-50', '51-80', '>80'],
      points_correct: 400, points_wrong: 0,
    },
    {
      question_text: 'What will be the highest individual score in this match?',
      options: ['0-30', '31-50', '51-75', '76+'],
      points_correct: 400, points_wrong: 0,
    },
  ],
];

function resolveTeam(code) {
  return SUPER8_SEEDING[code] || code;
}

async function main() {
  const configAll = process.argv.includes('--all');
  const fixIncomplete = process.argv.includes('--fix');

  // Load tournament data
  const jsonPath = path.join(__dirname, '..', 'ui', 'public', 'data', 't20wc_2026.json');
  const tournament = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Get existing match configs from DB
  console.log('Fetching existing data...');
  const [
    { data: existingConfigs, error: cfgErr },
    { data: existingSideBets },
    { data: existingSlots },
  ] = await Promise.all([
    supabase.from('match_config').select('match_id, status'),
    supabase.from('side_bets').select('match_id'),
    supabase.from('player_slots').select('match_id'),
  ]);
  if (cfgErr) { console.error('Failed to fetch configs:', cfgErr.message); process.exit(1); }

  const configMap = {};
  (existingConfigs || []).forEach(c => { configMap[c.match_id] = c; });
  const sbSet = new Set((existingSideBets || []).map(s => s.match_id));
  const slotSet = new Set((existingSlots || []).map(s => s.match_id));

  console.log(`  ${Object.keys(configMap).length} match configs in DB`);

  // Determine which matches need work
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

  const matchesToProcess = [];
  for (const m of tournament.matches) {
    const matchId = `${MATCH_ID_PREFIX}${m.match_id}`;
    const matchTime = new Date(`${m.date}T${m.time_gmt}:00Z`);

    // Skip TBC matches with no real teams
    if (m.teams[0] === 'TBC' || m.teams[1] === 'TBC') continue;

    // Skip past matches that are already scored
    const existing = configMap[matchId];
    if (existing && existing.status === 'SCORED') continue;

    // Check if this match needs any work
    const needsConfig = !existing;
    const needsSideBets = !sbSet.has(matchId);
    const needsSlots = !slotSet.has(matchId);
    const needsOpen = existing && existing.status === 'DRAFT' && matchTime > now;

    if (!needsConfig && !needsSideBets && !needsSlots && !needsOpen) continue;

    if (configAll || fixIncomplete) {
      // --all or --fix: process all future unscored matches
      if (matchTime > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        matchesToProcess.push({ ...m, matchId, matchTime, needsConfig, needsSideBets, needsSlots, needsOpen });
      }
    } else {
      // Default: today through +3 days
      if (matchTime <= windowEnd && matchTime > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        matchesToProcess.push({ ...m, matchId, matchTime, needsConfig, needsSideBets, needsSlots, needsOpen });
      }
    }
  }

  if (matchesToProcess.length === 0) {
    console.log('\nAll matches in range are fully configured!');
    return;
  }

  console.log(`\nProcessing ${matchesToProcess.length} match(es):\n`);

  for (let i = 0; i < matchesToProcess.length; i++) {
    const m = matchesToProcess[i];
    const teamA = resolveTeam(m.teams[0]);
    const teamB = resolveTeam(m.teams[1]);
    const lockTime = m.matchTime.toISOString();
    const sideBetSet = SIDE_BET_SETS[i % SIDE_BET_SETS.length];

    console.log(`=== ${m.matchId}: ${teamA} vs ${teamB} (${m.date} ${m.time_gmt} UTC) ===`);

    // Step 1: Upsert match_config (create if missing, update status to OPEN if DRAFT)
    if (m.needsConfig || m.needsOpen) {
      const targetStatus = m.needsOpen ? 'OPEN' : 'OPEN';
      console.log(`  ${m.needsConfig ? 'Creating' : 'Updating'} match_config (→ ${targetStatus})...`);
      const { error: mcErr } = await supabase.from('match_config').upsert({
        match_id: m.matchId,
        event_id: EVENT_ID,
        team_a: teamA,
        team_b: teamB,
        lock_time: lockTime,
        status: targetStatus,
        ...DEFAULT_CONFIG,
      }, { onConflict: 'match_id' });
      if (mcErr) { console.error('    ERROR:', mcErr.message); continue; }
      console.log('    Done.');
    } else {
      console.log('  match_config already exists and OPEN.');
    }

    // Step 2: Insert player_slots if missing
    if (m.needsSlots) {
      console.log('  Creating player_slots...');
      await supabase.from('player_slots').delete().eq('match_id', m.matchId);
      const slotsData = DEFAULT_SLOTS.map(s => ({ match_id: m.matchId, ...s }));
      const { error: slErr } = await supabase.from('player_slots').insert(slotsData);
      if (slErr) { console.error('    ERROR:', slErr.message); continue; }
      console.log(`    ${slotsData.length} slots created.`);
    } else {
      console.log('  player_slots already exist.');
    }

    // Step 3: Insert side_bets if missing
    if (m.needsSideBets) {
      console.log('  Creating side_bets...');
      await supabase.from('side_bets').delete().eq('match_id', m.matchId);
      const sbData = sideBetSet.map((sb, idx) => ({
        match_id: m.matchId,
        question_text: sb.question_text,
        options: sb.options,
        points_correct: sb.points_correct,
        points_wrong: sb.points_wrong,
        correct_answer: null,
        display_order: idx + 1,
        status: 'OPEN',
      }));
      const { error: sbErr } = await supabase.from('side_bets').insert(sbData);
      if (sbErr) { console.error('    ERROR:', sbErr.message); continue; }
      console.log(`    ${sbData.length} side bets created.`);
    } else {
      console.log('  side_bets already exist.');
    }

    console.log(`  ${m.matchId} ready!\n`);
  }

  // Summary
  console.log('='.repeat(50));
  console.log('  SUMMARY');
  console.log('='.repeat(50));
  for (const m of matchesToProcess) {
    const teamA = resolveTeam(m.teams[0]);
    const teamB = resolveTeam(m.teams[1]);
    const ist = m.matchTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
    const actions = [];
    if (m.needsConfig) actions.push('config');
    if (m.needsOpen) actions.push('→OPEN');
    if (m.needsSideBets) actions.push('side_bets');
    if (m.needsSlots) actions.push('slots');
    console.log(`  ${m.matchId}: ${teamA} vs ${teamB} — ${ist} IST — [${actions.join(', ')}]`);
  }
  console.log('='.repeat(50));
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
