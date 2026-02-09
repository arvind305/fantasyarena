/**
 * seed-squads.js — Seed all 20 T20 WC 2026 teams and 300 players into Supabase.
 *
 * Usage:
 *   node scripts/seed-squads.js
 *
 * Environment variables (set in .env or pass directly):
 *   SUPABASE_URL          — Your Supabase project URL
 *   SUPABASE_SERVICE_KEY  — Service role key (needed to bypass RLS)
 *
 * Or use the React app env vars:
 *   REACT_APP_SUPABASE_URL
 *   REACT_APP_SUPABASE_ANON_KEY  (will work if RLS allows authenticated inserts)
 *
 * If no Supabase credentials are found, outputs SQL INSERT statements instead.
 */

const fs = require("fs");
const path = require("path");

// ── Data files ────────────────────────────────────────────────────────────
const squadsPath = path.join(__dirname, "..", "data", "squads.json");
const playersPath = path.join(__dirname, "..", "data", "players.json");
const squadsData = JSON.parse(fs.readFileSync(squadsPath, "utf8"));
const playersData = JSON.parse(fs.readFileSync(playersPath, "utf8"));

// ── Team code mapping: data teamId → tournament team_code ─────────────
const TEAM_ID_TO_CODE = {
  india: "IND",
  pakistan: "PAK",
  usa: "USA",
  netherlands: "NED",
  namibia: "NAM",
  australia: "AUS",
  sri_lanka: "SL",
  ireland: "IRE",
  zimbabwe: "ZIM",
  oman: "OMAN",
  england: "ENG",
  west_indies: "WI",
  italy: "ITA",
  nepal: "NEP",
  scotland: "SCO",
  south_africa: "RSA",
  new_zealand: "NZ",
  afghanistan: "AFG",
  canada: "CAN",
  uae: "UAE",
};

const TEAM_ID_TO_NAME = {
  india: "India",
  pakistan: "Pakistan",
  usa: "United States",
  netherlands: "Netherlands",
  namibia: "Namibia",
  australia: "Australia",
  sri_lanka: "Sri Lanka",
  ireland: "Ireland",
  zimbabwe: "Zimbabwe",
  oman: "Oman",
  england: "England",
  west_indies: "West Indies",
  italy: "Italy",
  nepal: "Nepal",
  scotland: "Scotland",
  south_africa: "South Africa",
  new_zealand: "New Zealand",
  afghanistan: "Afghanistan",
  canada: "Canada",
  uae: "United Arab Emirates",
};

const EVENT_ID = "t20wc_2026";

// ── Build player lookup by teamId ─────────────────────────────────────
const playersByTeam = {};
for (const p of playersData) {
  if (!playersByTeam[p.teamId]) playersByTeam[p.teamId] = [];
  playersByTeam[p.teamId].push(p);
}

// ── Supabase seeding ──────────────────────────────────────────────────
async function seedWithSupabase() {
  let createClient;
  try {
    createClient = require("@supabase/supabase-js").createClient;
  } catch {
    return false; // supabase-js not available
  }

  const url =
    process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !key) return false;

  const supabase = createClient(url, key);
  console.log("Connected to Supabase:", url);

  let totalSquads = 0;
  let totalPlayers = 0;

  for (const squad of squadsData) {
    const teamCode = TEAM_ID_TO_CODE[squad.teamId];
    const teamName = TEAM_ID_TO_NAME[squad.teamId];

    if (!teamCode) {
      console.warn(`  Skipping unknown teamId: ${squad.teamId}`);
      continue;
    }

    // Upsert squad
    const { data: squadRow, error: squadErr } = await supabase
      .from("squads")
      .upsert(
        {
          event_id: EVENT_ID,
          team_code: teamCode,
          team_name: teamName,
        },
        { onConflict: "event_id,team_code" }
      )
      .select("squad_id")
      .single();

    if (squadErr) {
      console.error(`  ERROR inserting squad ${teamCode}:`, squadErr.message);
      continue;
    }

    const squadId = squadRow.squad_id;
    console.log(`  Squad ${teamCode} (${teamName}) → ${squadId}`);
    totalSquads++;

    // Get players for this team
    const teamPlayers = playersByTeam[squad.teamId] || [];
    if (teamPlayers.length === 0) {
      console.warn(`  No players found for ${squad.teamId}`);
      continue;
    }

    // Upsert players
    for (const p of teamPlayers) {
      const { error: playerErr } = await supabase.from("players").upsert(
        {
          squad_id: squadId,
          player_name: p.name,
          player_role: p.role,
          is_captain: p.isCaptain || false,
          is_active: true,
        },
        { onConflict: "squad_id,player_name", ignoreDuplicates: true }
      );

      if (playerErr) {
        // If duplicate, try insert with ignoreDuplicates
        // upsert on players doesn't have a unique constraint on (squad_id, player_name)
        // so we check if player already exists
        const { data: existing } = await supabase
          .from("players")
          .select("player_id")
          .eq("squad_id", squadId)
          .eq("player_name", p.name)
          .maybeSingle();

        if (!existing) {
          const { error: insertErr } = await supabase.from("players").insert({
            squad_id: squadId,
            player_name: p.name,
            player_role: p.role,
            is_captain: p.isCaptain || false,
            is_active: true,
          });
          if (insertErr) {
            console.error(
              `    ERROR inserting player ${p.name}:`,
              insertErr.message
            );
            continue;
          }
        }
      }
      totalPlayers++;
    }
    console.log(`    → ${teamPlayers.length} players inserted`);
  }

  console.log(
    `\nDone! Seeded ${totalSquads} squads and ${totalPlayers} players.`
  );
  return true;
}

// ── SQL fallback ──────────────────────────────────────────────────────
function generateSQL() {
  console.log("-- =====================================================");
  console.log("-- SEED: Squads and Players for T20 World Cup 2026");
  console.log("-- Run this in Supabase SQL Editor");
  console.log("-- =====================================================\n");

  for (const squad of squadsData) {
    const teamCode = TEAM_ID_TO_CODE[squad.teamId];
    const teamName = TEAM_ID_TO_NAME[squad.teamId];
    if (!teamCode) continue;

    const safeName = teamName.replace(/'/g, "''");
    console.log(
      `INSERT INTO squads (event_id, team_code, team_name) VALUES ('${EVENT_ID}', '${teamCode}', '${safeName}') ON CONFLICT (event_id, team_code) DO NOTHING;`
    );
  }

  console.log("\n-- Players (using subqueries to get squad_id)\n");

  for (const squad of squadsData) {
    const teamCode = TEAM_ID_TO_CODE[squad.teamId];
    if (!teamCode) continue;

    const teamPlayers = playersByTeam[squad.teamId] || [];
    console.log(`-- ${TEAM_ID_TO_NAME[squad.teamId]} (${teamCode})`);

    for (const p of teamPlayers) {
      const safeName = p.name.replace(/'/g, "''").replace(/\u2011/g, "-");
      const role = p.role || "BAT";
      const isCaptain = p.isCaptain ? "true" : "false";
      console.log(
        `INSERT INTO players (squad_id, player_name, player_role, is_captain) SELECT squad_id, '${safeName}', '${role}', ${isCaptain} FROM squads WHERE event_id = '${EVENT_ID}' AND team_code = '${teamCode}' ON CONFLICT DO NOTHING;`
      );
    }
    console.log("");
  }

  console.log("-- Done: 20 squads, 300 players");
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed Squads & Players ===\n");
  console.log(`Teams: ${squadsData.length}`);
  console.log(`Players: ${playersData.length}\n`);

  const usedSupabase = await seedWithSupabase();
  if (!usedSupabase) {
    console.log(
      "Supabase not configured. Generating SQL output instead...\n"
    );
    generateSQL();
  }
}

main().catch(console.error);
