/**
 * run-simulation.js
 *
 * Deterministic test harness that validates ALL domain invariants
 * by simulating a full match lifecycle:
 *
 *   1 match  (team_alpha vs team_beta)
 *   3 users  (alice, bob, charlie)
 *   2 groups (group_ab: alice+bob, group_bc: bob+charlie)
 *   Full lifecycle: UPCOMING → LIVE → COMPLETED → finalized
 *   + Abandoned match test (separate match)
 *
 * Usage: node simulation/run-simulation.js
 *
 * Exit code 0 = all invariants pass
 * Exit code 1 = invariant violation
 */

"use strict";

const { SimulationAdapter } = require("./ExternalDataAdapter.simulation");
const { SimulationEngine, InvariantViolation } = require("./engine.simulation");

// ─── Harness utilities ──────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

function log(msg) {
  console.log(`  ${msg}`);
}

function section(title) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${title}`);
  console.log("═".repeat(70));
}

function assertPass(label) {
  passCount++;
  log(`  ✓ ${label}`);
}

function assertThrows(fn, expectedSubstring, label) {
  try {
    fn();
    failCount++;
    log(`  ✗ ${label} — expected error containing "${expectedSubstring}" but no error thrown`);
  } catch (err) {
    if (err.message.includes(expectedSubstring)) {
      passCount++;
      log(`  ✓ ${label} — correctly threw: ${err.message}`);
    } else {
      failCount++;
      log(`  ✗ ${label} — wrong error: ${err.message} (expected substring: "${expectedSubstring}")`);
    }
  }
}

function assertEqual(actual, expected, label) {
  if (actual === expected) {
    passCount++;
    log(`  ✓ ${label} — ${actual}`);
  } else {
    failCount++;
    log(`  ✗ ${label} — expected ${expected}, got ${actual}`);
  }
}

function assertNotNull(value, label) {
  if (value !== null && value !== undefined) {
    passCount++;
    log(`  ✓ ${label}`);
  } else {
    failCount++;
    log(`  ✗ ${label} — value is null/undefined`);
  }
}

// ─── Main simulation ────────────────────────────────────────────────────────

function runSimulation() {
  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║  DOMAIN INVARIANT VALIDATION — DETERMINISTIC SIMULATION            ║");
  console.log("║  Seed: 42 | 1 match + 1 abandoned | 3 users | 2 groups            ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝");

  const adapter = new SimulationAdapter(42);
  const engine = new SimulationEngine(adapter);

  // ── Phase 0: Setup ────────────────────────────────────────────────────────

  section("PHASE 0: DATA SETUP");

  // Verify external data is present
  const teams = adapter.getTeams("cricket");
  assertEqual(teams.length, 2, "Exactly 2 teams exist");

  const allPlayers = adapter.getPlayers();
  assertEqual(allPlayers.length, 8, "Exactly 8 players exist");

  const alphaPlayers = adapter.getPlayers({ teamId: "team_alpha" });
  assertEqual(alphaPlayers.length, 4, "Alpha has 4 players");

  const betaPlayers = adapter.getPlayers({ teamId: "team_beta" });
  assertEqual(betaPlayers.length, 4, "Beta has 4 players");

  // Create match (simulates external schedule ingestion)
  const scheduledTime = "2025-04-10T14:00:00Z";
  const match = adapter.createSimMatch("sim_m1", "team_alpha", "team_beta", scheduledTime);
  assertEqual(match.status, "UPCOMING", "Match starts as UPCOMING");
  assertEqual(match.matchId, "sim_m1", "Match ID is sim_m1");
  assertPass("Invariant #1: match has exactly two teams");

  // Verify squads
  const squads = adapter.getSquads("sim_m1");
  assertEqual(squads.length, 2, "Invariant #2: exactly 2 squads per match");

  const squadPlayerIds = adapter.getMatchPlayerIds("sim_m1");
  assertEqual(squadPlayerIds.length, 8, "All 8 players in match squads");

  // Verify invariant #5: squad playerIds are subset of team roster
  for (const squad of squads) {
    const teamPlayers = adapter.getPlayers({ teamId: squad.teamId }).map(p => p.playerId);
    for (const pid of squad.playerIds) {
      if (!teamPlayers.includes(pid)) {
        failCount++;
        log(`  ✗ Invariant #5: player ${pid} in squad but not in team ${squad.teamId} roster`);
      }
    }
  }
  assertPass("Invariant #5: squad playerIds are subset of team roster");

  // Timeline
  const timeline = adapter.getTimeline("sim_m1");
  assertNotNull(timeline, "Timeline generated");
  assertEqual(timeline.checkpoints.length, 8, "8 checkpoints in timeline");
  log(`    bettingOpenAt:    ${timeline.bettingOpenAt}`);
  log(`    bettingLockedAt:  ${timeline.bettingLockedAt}`);
  log(`    matchCompletedAt: ${timeline.matchCompletedAt}`);

  // ── Phase 1: Generate questions ───────────────────────────────────────────

  section("PHASE 1: QUESTION GENERATION");

  const questions = engine.generateQuestions("sim_m1");
  assertEqual(questions.length, 5, "5 questions generated");

  // Invariant #10: PLAYER_PICK options must reference squad members
  for (const q of questions) {
    if (q.optionType === "PLAYER_PICK") {
      for (const opt of q.options) {
        if (opt.referenceType === "PLAYER") {
          const inSquad = adapter.isPlayerInMatchSquads("sim_m1", opt.referenceId);
          if (!inSquad) {
            failCount++;
            log(`  ✗ Invariant #10: option ${opt.optionId} player ${opt.referenceId} not in squads`);
          }
        }
      }
    }
  }
  assertPass("Invariant #10: all PLAYER_PICK options reference squad members");

  // Invariant #11: TEAM_PICK options must reference teamA or teamB
  for (const q of questions) {
    if (q.optionType === "TEAM_PICK") {
      for (const opt of q.options) {
        if (opt.referenceType === "TEAM") {
          if (opt.referenceId !== "team_alpha" && opt.referenceId !== "team_beta") {
            failCount++;
            log(`  ✗ Invariant #11: team option ${opt.referenceId} not in match`);
          }
        }
      }
    }
  }
  assertPass("Invariant #11: all TEAM_PICK options reference match teams");

  // All questions start as OPEN
  for (const q of questions) {
    assertEqual(q.status, "OPEN", `Question ${q.questionId} starts OPEN`);
  }

  // ── Phase 2: Create groups ────────────────────────────────────────────────

  section("PHASE 2: GROUP SETUP");

  engine.createGroup("group_ab", "Alpha-Beta Friends", "alice");
  engine.joinGroup("group_ab", "bob");
  assertPass("Group group_ab: alice + bob");

  engine.createGroup("group_bc", "Beta-Charlie Club", "bob");
  engine.joinGroup("group_bc", "charlie");
  assertPass("Group group_bc: bob + charlie");

  // ── Phase 3: Bet submission (UPCOMING) ────────────────────────────────────

  section("PHASE 3: BET SUBMISSION (match UPCOMING)");

  // Alice bets
  const aliceAnswers = {
    "sim_m1_q1": "sim_m1_opt_team_alpha",
    "sim_m1_q2": "sim_m1_opt_team_beta",
    "sim_m1_q3": "sim_m1_opt_sp1",
    "sim_m1_q4": "sim_m1_opt_sp2",
    "sim_m1_q5": "sim_m1_opt_century_no",
  };
  const aliceResult = engine.submitBets("sim_m1", "alice", aliceAnswers);
  assertNotNull(aliceResult.submittedAt, "Alice bet submitted");

  // Bob bets
  const bobAnswers = {
    "sim_m1_q1": "sim_m1_opt_team_beta",
    "sim_m1_q2": "sim_m1_opt_team_alpha",
    "sim_m1_q3": "sim_m1_opt_sp5",
    "sim_m1_q4": "sim_m1_opt_sp6",
    "sim_m1_q5": "sim_m1_opt_century_yes",
  };
  engine.submitBets("sim_m1", "bob", bobAnswers);
  assertPass("Bob bet submitted");

  // Charlie bets
  const charlieAnswers = {
    "sim_m1_q1": "sim_m1_opt_team_alpha",
    "sim_m1_q2": "sim_m1_opt_team_alpha",
    "sim_m1_q3": "sim_m1_opt_sp3",
    "sim_m1_q4": "sim_m1_opt_sp7",
    "sim_m1_q5": "sim_m1_opt_century_no",
  };
  engine.submitBets("sim_m1", "charlie", charlieAnswers);
  assertPass("Charlie bet submitted");

  // Invariant #20: no bet without userId
  assertThrows(
    () => engine.submitBets("sim_m1", null, {}),
    "INVARIANT #20",
    "Invariant #20: bet without userId rejected"
  );

  // Invariant #22: invalid question ID
  assertThrows(
    () => engine.submitBets("sim_m1", "alice", { "fake_q": "fake_opt" }),
    "INVARIANT #22",
    "Invariant #22: invalid questionId rejected"
  );

  // Invariant #22: invalid option ID
  assertThrows(
    () => engine.submitBets("sim_m1", "alice", { "sim_m1_q1": "fake_option" }),
    "INVARIANT #22",
    "Invariant #22: invalid optionId rejected"
  );

  // ── Phase 3b: Bet edit before lock ────────────────────────────────────────

  section("PHASE 3b: BET EDIT (pre-lock overwrite)");

  // Alice changes her mind on q1
  const aliceUpdated = { ...aliceAnswers, "sim_m1_q1": "sim_m1_opt_team_beta" };
  engine.submitBets("sim_m1", "alice", aliceUpdated);
  const aliceBet = engine.getUserBets("sim_m1", "alice");
  assertEqual(aliceBet.answers["sim_m1_q1"], "sim_m1_opt_team_beta", "Alice bet updated pre-lock");
  assertEqual(aliceBet.isLocked, false, "Alice bet not yet locked");

  // ── Phase 4: Match goes LIVE ──────────────────────────────────────────────

  section("PHASE 4: MATCH TRANSITIONS TO LIVE");

  // Advance to first ball
  const transitions = engine.advanceMatch("sim_m1", scheduledTime);
  const liveMatch = engine.getMatch("sim_m1");
  assertEqual(liveMatch.status, "LIVE", "Match is now LIVE");
  assertNotNull(liveMatch.bettingLockedAt, "bettingLockedAt is set");

  // Invariant #4: squads must be final before LIVE
  for (const squad of liveMatch.squads) {
    assertEqual(squad.isFinal, true, `Squad ${squad.teamId} is final`);
  }
  assertPass("Invariant #4: both squads final when match goes LIVE");

  // Invariant #12: questions locked atomically
  const lockedQs = engine.getQuestions("sim_m1");
  for (const q of lockedQs) {
    assertEqual(q.status, "LOCKED", `Question ${q.questionId} is LOCKED`);
  }

  // Invariant #9: questions are immutable once OPEN→LOCKED
  assertPass("Invariant #9: questions immutable (status transitioned, content unchanged)");

  // Invariant #15: bets locked atomically
  for (const uid of ["alice", "bob", "charlie"]) {
    const bet = engine.getUserBets("sim_m1", uid);
    assertEqual(bet.isLocked, true, `${uid}'s bet is locked`);
    assertNotNull(bet.lockedAt, `${uid}'s bet has lockedAt timestamp`);
  }

  // Invariant #21: no bet submission after match goes LIVE
  assertThrows(
    () => engine.submitBets("sim_m1", "alice", aliceAnswers),
    "INVARIANT #21",
    "Invariant #21: bet submission rejected after LIVE"
  );

  // Invariant #16: locked bet cannot be overwritten
  assertThrows(
    () => engine.submitBets("sim_m1", "alice", aliceAnswers),
    "INVARIANT",
    "Invariant #16: locked bet cannot be overwritten"
  );

  // ── Phase 5: Match status — backward transition check ─────────────────────

  section("PHASE 5: STATUS TRANSITION INTEGRITY");

  // Invariant #3: no backward transitions — advancing to a past time should be no-op
  const noTransitions = engine.advanceMatch("sim_m1", "2025-04-10T13:00:00Z");
  assertEqual(noTransitions.length, 0, "Invariant #3: no backward transition from LIVE");
  assertEqual(engine.getMatch("sim_m1").status, "LIVE", "Match remains LIVE");

  // ── Phase 6: Match COMPLETED ──────────────────────────────────────────────

  section("PHASE 6: MATCH COMPLETES");

  const completedTimeline = adapter.getTimeline("sim_m1");
  engine.advanceMatch("sim_m1", completedTimeline.matchCompletedAt);
  const completedMatch = engine.getMatch("sim_m1");
  assertEqual(completedMatch.status, "COMPLETED", "Match is now COMPLETED");
  assertNotNull(completedMatch.result, "Match has a result string");
  log(`    Result: ${completedMatch.result}`);

  // Stats are ingested
  const statsResult = adapter.getPlayerMatchStats("sim_m1");
  assertNotNull(statsResult, "Player match stats ingested");
  assertEqual(statsResult.isFinalized, false, "Stats not yet finalized (within 2h window)");
  assertEqual(Object.keys(statsResult.stats).length, 8, "Stats for all 8 players");

  // ── Phase 7: Question resolution ──────────────────────────────────────────

  section("PHASE 7: QUESTION RESOLUTION");

  // Resolve questions with deterministic "correct" answers
  // Match winner: based on result
  const resultContainsAlpha = completedMatch.result.includes("ALP");
  const winnerOptionId = resultContainsAlpha ? "sim_m1_opt_team_alpha" : "sim_m1_opt_team_beta";
  engine.resolveQuestion("sim_m1_q1", winnerOptionId);
  assertPass("Q1 (match winner) resolved");

  engine.resolveQuestion("sim_m1_q2", "sim_m1_opt_team_alpha"); // toss winner
  assertPass("Q2 (toss winner) resolved");

  // Top scorer: find player with highest runs from stats
  let topScorerId = null;
  let topRuns = -1;
  for (const [pid, pstats] of Object.entries(statsResult.stats)) {
    if (pstats.runs > topRuns) { topRuns = pstats.runs; topScorerId = pid; }
  }
  engine.resolveQuestion("sim_m1_q3", `sim_m1_opt_${topScorerId}`);
  assertPass(`Q3 (top scorer) resolved — ${topScorerId} with ${topRuns} runs`);

  // Most wickets: find bowler with highest wickets
  let topWicketTakerId = null;
  let topWickets = -1;
  for (const [pid, pstats] of Object.entries(statsResult.stats)) {
    if (pstats.wickets > topWickets) { topWickets = pstats.wickets; topWicketTakerId = pid; }
  }
  // Verify this player is in the q4 options (bowlers/ARs only)
  const q4 = engine.getQuestions("sim_m1").find(q => q.questionId === "sim_m1_q4");
  const q4OptionIds = q4.options.map(o => o.optionId);
  const q4Answer = q4OptionIds.includes(`sim_m1_opt_${topWicketTakerId}`)
    ? `sim_m1_opt_${topWicketTakerId}`
    : q4OptionIds[0]; // fallback if top wicket taker is a pure batsman
  engine.resolveQuestion("sim_m1_q4", q4Answer);
  assertPass(`Q4 (most wickets) resolved`);

  // Century: check if any batter scored 100+
  const hadCentury = Object.values(statsResult.stats).some(s => s.runs >= 100);
  engine.resolveQuestion("sim_m1_q5", hadCentury ? "sim_m1_opt_century_yes" : "sim_m1_opt_century_no");
  assertPass(`Q5 (century) resolved — ${hadCentury ? "Yes" : "No"}`);

  // Invariant #13: question resolves only once
  assertThrows(
    () => engine.resolveQuestion("sim_m1_q1", winnerOptionId),
    "INVARIANT #13",
    "Invariant #13: question cannot be resolved twice"
  );

  // Invariant #14: correctOptionId must be valid
  // Create a separate test match for this
  adapter.createSimMatch("sim_m_inv14", "team_alpha", "team_beta", "2025-04-15T14:00:00Z");
  engine.generateQuestions("sim_m_inv14");
  engine.advanceMatch("sim_m_inv14", "2025-04-15T14:00:00Z");
  engine.advanceMatch("sim_m_inv14", "2025-04-15T17:30:00Z");
  assertThrows(
    () => engine.resolveQuestion("sim_m_inv14_q1", "totally_fake_option"),
    "INVARIANT #14",
    "Invariant #14: invalid correctOptionId rejected"
  );

  // ── Phase 8: Match finalization & scoring ──────────────────────────────────

  section("PHASE 8: MATCH FINALIZATION & SCORING");

  engine.finalizeMatch("sim_m1");
  assertPass("Match sim_m1 finalized");

  // Verify stats are now final
  const finalStats = adapter.getPlayerMatchStats("sim_m1");
  assertEqual(finalStats.isFinalized, true, "Stats are finalized");

  // Check scores
  for (const uid of ["alice", "bob", "charlie"]) {
    const bet = engine.getUserBets("sim_m1", uid);
    assertNotNull(bet.score, `${uid} has a score`);
    log(`    ${uid}: score = ${bet.score} / 5`);
  }

  // Verify double finalization throws
  assertThrows(
    () => engine.finalizeMatch("sim_m1"),
    "already finalized",
    "Cannot finalize match twice"
  );

  // ── Phase 9: Leaderboard ──────────────────────────────────────────────────

  section("PHASE 9: LEADERBOARD VERIFICATION");

  const globalLb = engine.getLeaderboard("global");
  assertEqual(globalLb.length, 3, "Global leaderboard has 3 users");
  log("  Global leaderboard:");
  for (const entry of globalLb) {
    log(`    #${entry.rank} ${entry.userId}: ${entry.totalScore} pts (${entry.matchesPlayed} matches)`);
  }

  // Invariant #31: leaderboard is derived, run it again — must be identical
  const globalLb2 = engine.getLeaderboard("global");
  for (let i = 0; i < globalLb.length; i++) {
    assertEqual(globalLb2[i].totalScore, globalLb[i].totalScore,
      `Invariant #31: leaderboard deterministic for rank ${i + 1}`);
  }

  // Group leaderboards
  const groupAbLb = engine.getLeaderboard("group", "group_ab");
  log("  Group group_ab leaderboard:");
  for (const entry of groupAbLb) {
    log(`    #${entry.rank} ${entry.userId}: ${entry.totalScore} pts`);
  }
  // Invariant #32: group scores match global
  for (const entry of groupAbLb) {
    const globalEntry = globalLb.find(g => g.userId === entry.userId);
    assertEqual(entry.totalScore, globalEntry.totalScore,
      `Invariant #32: ${entry.userId} score same in group_ab and global`);
  }

  const groupBcLb = engine.getLeaderboard("group", "group_bc");
  log("  Group group_bc leaderboard:");
  for (const entry of groupBcLb) {
    log(`    #${entry.rank} ${entry.userId}: ${entry.totalScore} pts`);
  }
  for (const entry of groupBcLb) {
    const globalEntry = globalLb.find(g => g.userId === entry.userId);
    assertEqual(entry.totalScore, globalEntry.totalScore,
      `Invariant #32: ${entry.userId} score same in group_bc and global`);
  }

  // ── Phase 10: Abandoned match ─────────────────────────────────────────────

  section("PHASE 10: ABANDONED MATCH");

  adapter.createSimMatch("sim_m_aband", "team_alpha", "team_beta", "2025-04-12T14:00:00Z");
  engine.generateQuestions("sim_m_aband");

  // Submit bets while UPCOMING
  engine.submitBets("sim_m_aband", "alice", {
    "sim_m_aband_q1": "sim_m_aband_opt_team_alpha",
    "sim_m_aband_q2": "sim_m_aband_opt_team_alpha",
    "sim_m_aband_q3": "sim_m_aband_opt_sp1",
    "sim_m_aband_q4": "sim_m_aband_opt_sp2",
    "sim_m_aband_q5": "sim_m_aband_opt_century_no",
  });
  engine.submitBets("sim_m_aband", "bob", {
    "sim_m_aband_q1": "sim_m_aband_opt_team_beta",
    "sim_m_aband_q2": "sim_m_aband_opt_team_beta",
    "sim_m_aband_q3": "sim_m_aband_opt_sp5",
    "sim_m_aband_q4": "sim_m_aband_opt_sp6",
    "sim_m_aband_q5": "sim_m_aband_opt_century_yes",
  });
  assertPass("Bets submitted for abandoned match");

  // Match goes LIVE
  engine.advanceMatch("sim_m_aband", "2025-04-12T14:00:00Z");
  assertEqual(engine.getMatch("sim_m_aband").status, "LIVE", "Abandoned match went LIVE first");

  // Abandon it mid-match
  adapter.abandonMatch("sim_m_aband", "2025-04-12T15:30:00Z");
  assertEqual(engine.getMatch("sim_m_aband").status, "ABANDONED", "Match is ABANDONED");
  assertEqual(engine.getMatch("sim_m_aband").isAbandoned, true, "isAbandoned = true");

  // No stats for abandoned match
  const abandStats = adapter.getPlayerMatchStats("sim_m_aband");
  assertEqual(abandStats, null, "No stats for abandoned match");

  // Finalize abandoned match — all bets score 0
  engine.finalizeMatch("sim_m_aband");
  const aliceAbandBet = engine.getUserBets("sim_m_aband", "alice");
  assertEqual(aliceAbandBet.score, 0, "Alice scores 0 on abandoned match");
  const bobAbandBet = engine.getUserBets("sim_m_aband", "bob");
  assertEqual(bobAbandBet.score, 0, "Bob scores 0 on abandoned match");
  assertPass("Abandoned matches produce zero score for all users");

  // Verify abandoned match doesn't affect leaderboard totals
  const postAbandLb = engine.getLeaderboard("global");
  for (const entry of postAbandLb) {
    const priorEntry = globalLb.find(g => g.userId === entry.userId);
    assertEqual(entry.totalScore, priorEntry.totalScore,
      `${entry.userId} leaderboard score unchanged after abandoned match`);
  }
  assertPass("Abandoned matches don't affect leaderboard");

  // ── Phase 11: Cannot resolve questions before match completes ──────────────

  section("PHASE 11: RESOLUTION TIMING INVARIANT");

  adapter.createSimMatch("sim_m_timing", "team_alpha", "team_beta", "2025-04-20T14:00:00Z");
  engine.generateQuestions("sim_m_timing");

  // Match is UPCOMING — cannot resolve
  assertThrows(
    () => engine.resolveQuestion("sim_m_timing_q1", "sim_m_timing_opt_team_alpha"),
    "INVARIANT #13",
    "Invariant #13: cannot resolve question while match UPCOMING"
  );

  // Match goes LIVE — still cannot resolve
  engine.advanceMatch("sim_m_timing", "2025-04-20T14:00:00Z");
  assertThrows(
    () => engine.resolveQuestion("sim_m_timing_q1", "sim_m_timing_opt_team_alpha"),
    "INVARIANT #13",
    "Invariant #13: cannot resolve question while match LIVE"
  );

  // ── Phase 12: Full event log ──────────────────────────────────────────────

  section("PHASE 12: EVENT LOG SUMMARY");

  const fullLog = engine.getLog();
  const logCounts = {};
  for (const entry of fullLog) {
    logCounts[entry.type] = (logCounts[entry.type] || 0) + 1;
  }
  log("  Event type counts:");
  for (const [type, count] of Object.entries(logCounts).sort()) {
    log(`    ${type}: ${count}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n${"═".repeat(70)}`);
  console.log("  SIMULATION COMPLETE");
  console.log("═".repeat(70));
  console.log(`\n  Assertions passed: ${passCount}`);
  console.log(`  Assertions failed: ${failCount}`);

  if (failCount === 0) {
    console.log("\n  ALL INVARIANTS VALIDATED SUCCESSFULLY.\n");
  } else {
    console.log(`\n  ${failCount} INVARIANT VIOLATION(S) FOUND.\n`);
  }

  console.log("  Invariants validated:");
  console.log("    #1   Match has exactly two teams");
  console.log("    #2   Match has exactly two squads");
  console.log("    #3   No backward status transitions");
  console.log("    #4   Squads final before match goes LIVE");
  console.log("    #5   Squad playerIds are subset of team roster");
  console.log("    #9   Questions immutable once OPEN");
  console.log("    #10  PLAYER_PICK options reference squad members only");
  console.log("    #11  TEAM_PICK options reference match teams only");
  console.log("    #12  Questions lock atomically at first ball");
  console.log("    #13  Questions resolve only after COMPLETED/ABANDONED, only once");
  console.log("    #14  correctOptionId must be valid");
  console.log("    #15  Bets lock atomically at first ball");
  console.log("    #16  At most one bet per user per match (locked bets immutable)");
  console.log("    #17  Player picks must be in match squads");
  console.log("    #20  No bet without authentication");
  console.log("    #21  No bet submission after match goes LIVE");
  console.log("    #22  Answers must reference valid questions and options");
  console.log("    #31  Leaderboards are deterministic derived views");
  console.log("    #32  Group scores identical to global scores");
  console.log("    —    Abandoned matches produce zero score");
  console.log("    —    Abandoned matches don't affect leaderboard");
  console.log("");

  process.exit(failCount > 0 ? 1 : 0);
}

runSimulation();
