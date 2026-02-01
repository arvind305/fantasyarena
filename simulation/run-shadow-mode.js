/**
 * run-shadow-mode.js
 *
 * Shadow mode runner: ingests sample real-world-shaped JSON data through
 * RealDataAdapter, validates against domain invariants, and prints a report.
 *
 * No scoring, no bets, no UI changes. Read-only validation only.
 *
 * Usage: node simulation/run-shadow-mode.js
 */

"use strict";

const { RealDataAdapter } = require("./ExternalDataAdapter.real");
const { SimulationEngine } = require("./engine.simulation");

// ─── Sample data shaped like ESPN/Cricbuzz JSON feeds ────────────────────────

const SAMPLE_TOURNAMENT = {
  id: "ipl_2025",
  series_name: "Indian Premier League 2025",
  sport: "cricket",
  match_format: "t20",
  season: "2025",
  tournament_status: "in_progress",
  start_date: "2025-03-22T00:00:00Z",
  end_date: "2025-05-25T00:00:00Z",
};

const SAMPLE_TEAMS = [
  {
    id: "csk",
    team_name: "Chennai Super Kings",
    abbreviation: "CSK",
    sport: "cricket",
    logo: "https://example.com/csk.png",
    roster: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12", "p13"],
  },
  {
    id: "mi",
    team_name: "Mumbai Indians",
    abbreviation: "MI",
    sport: "cricket",
    logo: "https://example.com/mi.png",
    roster: ["p14", "p15", "p16", "p17", "p18", "p19", "p20", "p21", "p22", "p23", "p24", "p25"],
  },
];

const SAMPLE_PLAYERS = [
  // CSK
  { id: "p1",  full_name: "MS Dhoni",        playing_role: "wicketkeeper batter", country: "India" },
  { id: "p2",  full_name: "Ruturaj Gaikwad", playing_role: "batter",              country: "India" },
  { id: "p3",  full_name: "Devon Conway",    playing_role: "batter",              country: "New Zealand" },
  { id: "p4",  full_name: "Shivam Dube",     playing_role: "batting allrounder",  country: "India" },
  { id: "p5",  full_name: "Ravindra Jadeja", playing_role: "all-rounder",         country: "India" },
  { id: "p6",  full_name: "Deepak Chahar",   playing_role: "bowler",              country: "India" },
  { id: "p7",  full_name: "Tushar Deshpande",playing_role: "fast bowler",         country: "India" },
  { id: "p8",  full_name: "Matheesha Pathirana",playing_role: "bowler",           country: "Sri Lanka" },
  { id: "p9",  full_name: "Moeen Ali",       playing_role: "all rounder",         country: "England" },
  { id: "p10", full_name: "Ajinkya Rahane",  playing_role: "top order",           country: "India" },
  { id: "p11", full_name: "Maheesh Theekshana",playing_role: "spin bowler",       country: "Sri Lanka" },
  // Extra CSK players (bench)
  { id: "p12", full_name: "Avanish Rao",     playing_role: "batter",              country: "India" },
  { id: "p13", full_name: "Prashant Solanki", playing_role: "bowling allrounder", country: "India" },

  // MI
  { id: "p14", full_name: "Rohit Sharma",    playing_role: "opening batter",      country: "India" },
  { id: "p15", full_name: "Ishan Kishan",    playing_role: "wk-bat",              country: "India" },
  { id: "p16", full_name: "Suryakumar Yadav",playing_role: "batter",              country: "India" },
  { id: "p17", full_name: "Tilak Varma",     playing_role: "batting allrounder",  country: "India" },
  { id: "p18", full_name: "Hardik Pandya",   playing_role: "allrounder",          country: "India" },
  { id: "p19", full_name: "Tim David",       playing_role: "middle order",        country: "Singapore" },
  { id: "p20", full_name: "Jasprit Bumrah",  playing_role: "pace bowler",         country: "India" },
  { id: "p21", full_name: "Piyush Chawla",   playing_role: "spin bowler",         country: "India" },
  { id: "p22", full_name: "Gerald Coetzee",  playing_role: "fast bowler",         country: "South Africa" },
  { id: "p23", full_name: "Akash Madhwal",   playing_role: "bowler",              country: "India" },
  { id: "p24", full_name: "Naman Dhir",      playing_role: "batter",              country: "India" },
  // Deliberate: one player with unknown role for ambiguity testing
  { id: "p25", full_name: "Test Player",     playing_role: "finisher",            country: "India" },
];

const SAMPLE_MATCHES = [
  {
    id: "match_1",
    series_id: "ipl_2025",
    team1: "csk",
    team2: "mi",
    status: "completed",
    start_date: "2025-03-22T19:30:00Z",
    venue: "MA Chidambaram Stadium, Chennai",
    result_text: "CSK won by 6 wickets",
  },
  {
    id: "match_2",
    series_id: "ipl_2025",
    team1: "mi",
    team2: "csk",
    status: "scheduled",
    start_date: "2025-04-15T19:30:00Z",
    venue: "Wankhede Stadium, Mumbai",
  },
  // Edge case: abandoned match
  {
    id: "match_3",
    series_id: "ipl_2025",
    team1: "csk",
    team2: "mi",
    status: "abandoned",
    start_date: "2025-04-20T15:00:00Z",
    venue: "MA Chidambaram Stadium, Chennai",
  },
];

const SAMPLE_SQUADS = {
  match_1: [
    {
      team_id: "csk",
      player_ids: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"],
      playing_xi: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"],
      is_final: true,
    },
    {
      team_id: "mi",
      player_ids: ["p14", "p15", "p16", "p17", "p18", "p19", "p20", "p21", "p22", "p23", "p24"],
      playing_xi: ["p14", "p15", "p16", "p17", "p18", "p19", "p20", "p21", "p22", "p23", "p24"],
      is_final: true,
    },
  ],
  match_2: [
    {
      team_id: "mi",
      player_ids: ["p14", "p15", "p16", "p17", "p18", "p19", "p20", "p21", "p22", "p23", "p24"],
      playing_xi: [],
      confirmed: false,
    },
    {
      team_id: "csk",
      player_ids: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"],
      playing_xi: [],
      confirmed: false,
    },
  ],
};

// ─── Run shadow ingestion ───────────────────────────────────────────────────

function runShadowMode() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  SHADOW MODE: External Data Ingestion & Validation");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const adapter = new RealDataAdapter();

  // 1. Ingest tournament
  console.log("▸ Ingesting tournament...");
  adapter.ingestTournaments([SAMPLE_TOURNAMENT]);

  // 2. Ingest teams
  console.log("▸ Ingesting teams...");
  adapter.ingestTeams(SAMPLE_TEAMS);

  // 3. Ingest players
  console.log("▸ Ingesting players...");
  adapter.ingestPlayers(SAMPLE_PLAYERS);

  // 4. Ingest matches
  console.log("▸ Ingesting matches...");
  adapter.ingestMatches(SAMPLE_MATCHES, "ipl_2025");

  // 5. Ingest squads
  console.log("▸ Ingesting squads...");
  for (const [matchId, squads] of Object.entries(SAMPLE_SQUADS)) {
    adapter.ingestSquads(matchId, squads);
  }

  // 6. Verify read-only API works
  console.log("\n─── Read-Only API Verification ─────────────────────────────\n");

  const tournaments = adapter.getTournaments();
  console.log(`  Tournaments: ${tournaments.length}`);
  for (const t of tournaments) console.log(`    - ${t.name} (${t.eventId}) [${t.status}]`);

  const teams = adapter.getTeams("cricket");
  console.log(`  Teams: ${teams.length}`);
  for (const t of teams) console.log(`    - ${t.name} (${t.shortName})`);

  const matches = adapter.getMatches();
  console.log(`  Matches: ${matches.length}`);
  for (const m of matches) console.log(`    - ${m.matchId}: ${m.teamA} vs ${m.teamB} [${m.status}]`);

  for (const m of matches) {
    const squads = adapter.getSquads(m.matchId);
    if (squads.length > 0) {
      console.log(`  Squads for ${m.matchId}: ${squads.map(s => `${s.teamId}(${s.playerIds.length})`).join(", ")}`);
    }
  }

  // 7. Verify engine can accept real adapter (swap test)
  console.log("\n─── Engine Swap Test ────────────────────────────────────────\n");

  try {
    const engine = new SimulationEngine(adapter);
    console.log("  ✓ Engine accepts RealDataAdapter (adapter swap works)");

    // Test that engine can read match data through the adapter
    const engineMatch = engine.getMatch("match_1");
    if (engineMatch) {
      console.log(`  ✓ Engine reads match: ${engineMatch.matchId} (${engineMatch.teamA.name} vs ${engineMatch.teamB.name})`);
    }

    // Note: We do NOT call generateQuestions, advanceMatch, submitBets, etc.
    // Shadow mode is read-only ingestion validation.
    console.log("  ✓ Shadow mode: no scoring, no bets, no mutations");
  } catch (err) {
    console.log(`  ✗ Engine swap failed: ${err.message}`);
  }

  // 8. Print validation report
  const report = adapter.getValidationReport();
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  VALIDATION REPORT");
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log(`  Total checks: ${report.totalChecks}`);
  console.log(`  Passed:       ${report.passed}`);
  console.log(`  Failed:       ${report.failed}`);

  if (report.warnings.length > 0) {
    console.log(`\n  Warnings (${report.warnings.length}):`);
    for (const w of report.warnings) {
      console.log(`    ⚠ [${w.category}] ${w.message}`);
    }
  }

  if (report.ambiguities.length > 0) {
    console.log(`\n  Data Ambiguities (${report.ambiguities.length}):`);
    for (const a of report.ambiguities) {
      console.log(`    ? [${a.field}] ${a.message}`);
    }
  }

  if (report.warnings.length === 0 && report.ambiguities.length === 0) {
    console.log("\n  No warnings or ambiguities detected.");
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Shadow mode complete. No state was modified.");
  console.log("═══════════════════════════════════════════════════════════════\n");

  return { adapter, report };
}

// Run if executed directly
if (require.main === module) {
  runShadowMode();
}

module.exports = { runShadowMode };
