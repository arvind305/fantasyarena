/**
 * seed-match-config.js — Seed match_config and player_slots for all 55 matches.
 *
 * Usage:
 *   node scripts/seed-match-config.js
 *
 * Environment variables:
 *   SUPABASE_URL          — Your Supabase project URL
 *   SUPABASE_SERVICE_KEY  — Service role key (needed to bypass RLS)
 *
 * If no Supabase credentials are found, outputs SQL INSERT statements instead.
 */

const fs = require("fs");
const path = require("path");

// ── Data ──────────────────────────────────────────────────────────────
const tournamentPath = path.join(
  __dirname,
  "..",
  "ui",
  "public",
  "data",
  "t20wc_2026.json"
);
const tournament = JSON.parse(fs.readFileSync(tournamentPath, "utf8"));
const matches = tournament.matches;

const EVENT_ID = "t20wc_2026";

// ── Default configuration ─────────────────────────────────────────────
const DEFAULT_CONFIG = {
  winner_base_points: 1000,
  super_over_multiplier: 5,
  total_runs_base_points: 1000,
  player_slots_enabled: true,
  player_slot_count: 3,
  runners_enabled: false,
  runner_count: 0,
  status: "DRAFT",
};

// Default slot multipliers for 3 slots
const DEFAULT_SLOTS = [
  { slot_number: 1, multiplier: 100 },
  { slot_number: 2, multiplier: 70 },
  { slot_number: 3, multiplier: 40 },
];

// ── Supabase seeding ──────────────────────────────────────────────────
async function seedWithSupabase() {
  let createClient;
  try {
    createClient = require("@supabase/supabase-js").createClient;
  } catch {
    return false;
  }

  const url =
    process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !key) return false;

  const supabase = createClient(url, key);
  console.log("Connected to Supabase:", url);

  let configCount = 0;
  let slotCount = 0;

  for (const match of matches) {
    const matchId = 'wc_m' + String(match.match_id);
    const teamA = match.teams[0] || "TBC";
    const teamB = match.teams[1] || "TBC";

    // Calculate lock_time: match start time (date + time_gmt)
    const lockTime = `${match.date}T${match.time_gmt}:00Z`;

    // Upsert match config
    const { error: configErr } = await supabase.from("match_config").upsert(
      {
        match_id: matchId,
        event_id: EVENT_ID,
        ...DEFAULT_CONFIG,
        lock_time: lockTime,
        team_a: teamA,
        team_b: teamB,
      },
      { onConflict: "match_id" }
    );

    if (configErr) {
      console.error(
        `  ERROR match_config for match ${matchId}:`,
        configErr.message
      );
      continue;
    }
    configCount++;

    // Upsert player slots
    for (const slot of DEFAULT_SLOTS) {
      const { error: slotErr } = await supabase.from("player_slots").upsert(
        {
          match_id: matchId,
          slot_number: slot.slot_number,
          multiplier: slot.multiplier,
          is_enabled: true,
        },
        { onConflict: "match_id,slot_number" }
      );

      if (slotErr) {
        console.error(
          `  ERROR player_slot for match ${matchId} slot ${slot.slot_number}:`,
          slotErr.message
        );
        continue;
      }
      slotCount++;
    }

    console.log(
      `  Match ${matchId}: ${teamA} vs ${teamB} (${match.stage}) → config + ${DEFAULT_SLOTS.length} slots`
    );
  }

  console.log(
    `\nDone! Seeded ${configCount} match configs and ${slotCount} player slots.`
  );

  // Also seed long_term_bets_config if it doesn't exist
  const { error: ltErr } = await supabase
    .from("long_term_bets_config")
    .upsert(
      {
        event_id: EVENT_ID,
        winner_points: 5000,
        finalist_points: 2000,
        final_four_points: 1000,
        orange_cap_points: 3000,
        purple_cap_points: 3000,
        is_locked: false,
        allow_changes: false,
        change_cost_percent: 10,
      },
      { onConflict: "event_id" }
    );

  if (ltErr) {
    console.error("  ERROR seeding long_term_bets_config:", ltErr.message);
  } else {
    console.log("  Long-term bets config seeded for", EVENT_ID);
  }

  return true;
}

// ── SQL fallback ──────────────────────────────────────────────────────
function generateSQL() {
  console.log("-- =====================================================");
  console.log("-- SEED: Match Config and Player Slots for all 55 matches");
  console.log("-- Run this in Supabase SQL Editor");
  console.log("-- =====================================================\n");

  for (const match of matches) {
    const matchId = String(match.match_id);
    const teamA = match.teams[0] || "TBC";
    const teamB = match.teams[1] || "TBC";
    const lockTime = `${match.date}T${match.time_gmt}:00Z`;

    console.log(`-- Match ${matchId}: ${teamA} vs ${teamB} (${match.stage})`);
    console.log(
      `INSERT INTO match_config (match_id, event_id, winner_base_points, super_over_multiplier, total_runs_base_points, player_slots_enabled, player_slot_count, runners_enabled, runner_count, lock_time, team_a, team_b, status) VALUES ('${matchId}', '${EVENT_ID}', ${DEFAULT_CONFIG.winner_base_points}, ${DEFAULT_CONFIG.super_over_multiplier}, ${DEFAULT_CONFIG.total_runs_base_points}, ${DEFAULT_CONFIG.player_slots_enabled}, ${DEFAULT_CONFIG.player_slot_count}, ${DEFAULT_CONFIG.runners_enabled}, ${DEFAULT_CONFIG.runner_count}, '${lockTime}', '${teamA}', '${teamB}', '${DEFAULT_CONFIG.status}') ON CONFLICT (match_id) DO NOTHING;`
    );

    for (const slot of DEFAULT_SLOTS) {
      console.log(
        `INSERT INTO player_slots (match_id, slot_number, multiplier, is_enabled) VALUES ('${matchId}', ${slot.slot_number}, ${slot.multiplier}, true) ON CONFLICT (match_id, slot_number) DO NOTHING;`
      );
    }
    console.log("");
  }

  // Long-term bets config
  console.log("-- Long-term bets config");
  console.log(
    `INSERT INTO long_term_bets_config (event_id, winner_points, finalist_points, final_four_points, orange_cap_points, purple_cap_points, is_locked, allow_changes, change_cost_percent) VALUES ('${EVENT_ID}', 5000, 2000, 1000, 3000, 3000, false, false, 10) ON CONFLICT (event_id) DO NOTHING;`
  );

  console.log("\n-- Done: 55 match configs, 165 player slots, 1 long-term config");
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed Match Config & Player Slots ===\n");
  console.log(`Total matches: ${matches.length}\n`);

  const usedSupabase = await seedWithSupabase();
  if (!usedSupabase) {
    console.log(
      "Supabase not configured. Generating SQL output instead...\n"
    );
    generateSQL();
  }
}

main().catch(console.error);
