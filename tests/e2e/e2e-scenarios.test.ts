/**
 * IPL Friends Betting Game — End-to-End Scenario Tests
 * 
 * Authority: Constitution.md v1.0
 * 
 * PURPOSE:
 * These tests validate the complete scoring pipeline:
 * 1. Player stats → Base score computation
 * 2. Slot assignments → Resolution & normalization
 * 3. Conflict detection → Resolution (lowest index wins)
 * 4. Slot multipliers → Final slot scores
 * 
 * All scenarios are deterministic and serve as golden tests for the
 * integrated system behavior.
 * 
 * TEST COVERAGE:
 * - E2E-HAPPY: Happy path with unique players across all slots
 * - E2E-CONFLICT: Conflict-heavy scenario with multiple duplicates
 * - E2E-PARTIAL: Partial slot filling with empty slots
 * - E2E-ALLROUNDER: All-rounder player with high multiplier
 * - E2E-EDGE: Edge cases (zero scores, extreme SR, disabled multipliers)
 */

import {
  // Models & Types
  type PlayerMatchStats,
  type RuleVersion,
  CONSTITUTION_V1_SCORING_RULES,

  // Scoring functions
  computeBasePlayerScore,
  hasValidParticipation,

  // Slot score
  computeSlotScore,

  // Slot assignment
  resolveSlotAssignments,
  type SlotAssignmentMap,
  type ResolvedSlotAssignmentMap,
  type SlotIndex,
  ALL_SLOT_INDICES,

  // Slot conflict
  resolveSlotConflicts,
  detectSlotConflicts,
  isConflictFree,
} from '../src/domain';

// =============================================================================
// TEST INFRASTRUCTURE
// =============================================================================

interface E2ETestResult {
  readonly testId: string;
  readonly description: string;
  readonly passed: boolean;
  readonly error?: string;
}

interface E2EScenarioResult {
  readonly scenarioId: string;
  readonly scenarioName: string;
  readonly tests: E2ETestResult[];
  readonly passed: boolean;
}

/**
 * Float comparison with tolerance
 */
function floatsEqual(a: number, b: number, tolerance = 1e-10): boolean {
  if (b === 0) return Math.abs(a) < tolerance;
  return Math.abs((a - b) / Math.max(Math.abs(a), Math.abs(b))) < tolerance;
}

// =============================================================================
// CANONICAL RULE VERSION
// =============================================================================

const RULE_VERSION: RuleVersion = {
  id: 'e2e-test-v1',
  version: '1.0.0',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  isActive: true,
  scoringRules: CONSTITUTION_V1_SCORING_RULES,
};

// =============================================================================
// HELPER: Create PlayerMatchStats
// =============================================================================

function createStats(
  playerId: string,
  matchId: string,
  overrides: Partial<Omit<PlayerMatchStats, 'playerId' | 'matchId'>>
): PlayerMatchStats {
  return {
    playerId,
    matchId,
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    wickets: 0,
    oversBowled: 0,
    runsConceded: 0,
    hasTakenHatTrick: false,
    catches: 0,
    runOuts: 0,
    stumpings: 0,
    isManOfTheMatch: false,
    ...overrides,
  };
}

// =============================================================================
// PIPELINE ORCHESTRATOR (No logic duplication - uses existing functions)
// =============================================================================

/**
 * Result of processing a single slot in the pipeline
 */
interface SlotPipelineResult {
  readonly slotIndex: SlotIndex;
  readonly playerId: string | null;
  readonly baseScore: number | null;
  readonly multiplier: number;
  readonly slotScore: number;
}

/**
 * Complete E2E pipeline result
 */
interface E2EPipelineResult {
  readonly matchId: string;
  readonly rawAssignments: SlotAssignmentMap;
  readonly resolvedAssignments: ResolvedSlotAssignmentMap;
  readonly conflictFreeAssignments: ResolvedSlotAssignmentMap;
  readonly conflictsDetected: number;
  readonly slotResults: SlotPipelineResult[];
  readonly totalScore: number;
  readonly totalScoreRounded: number;
}

/**
 * Run the complete E2E pipeline
 * 
 * This function orchestrates all existing domain functions without
 * duplicating any logic. It simply composes the pipeline steps.
 */
function runE2EPipeline(
  matchId: string,
  assignments: SlotAssignmentMap,
  multipliers: Record<SlotIndex, number>,
  statsMap: Map<string, PlayerMatchStats>
): E2EPipelineResult {
  // Step 1: Resolve assignments (normalize to 11 slots)
  const resolvedAssignments = resolveSlotAssignments(assignments);

  // Step 2: Detect and resolve conflicts
  const detection = detectSlotConflicts(resolvedAssignments);
  const conflictFreeAssignments = resolveSlotConflicts(resolvedAssignments);

  // Step 3: Process each slot
  const slotResults: SlotPipelineResult[] = [];
  let totalScore = 0;

  for (const slotIndex of ALL_SLOT_INDICES) {
    const playerId = conflictFreeAssignments[slotIndex];
    const multiplier = multipliers[slotIndex] ?? 1;

    if (playerId === null) {
      // Empty slot contributes 0
      slotResults.push({
        slotIndex,
        playerId: null,
        baseScore: null,
        multiplier,
        slotScore: 0,
      });
    } else {
      // Get player stats and compute score
      const stats = statsMap.get(playerId);
      if (!stats) {
        throw new Error(`Missing stats for player ${playerId}`);
      }

      const breakdown = computeBasePlayerScore(stats, RULE_VERSION);
      const baseScore = breakdown.totalBaseScore;
      const slotScore = computeSlotScore(baseScore, multiplier);

      slotResults.push({
        slotIndex,
        playerId,
        baseScore,
        multiplier,
        slotScore,
      });

      totalScore += slotScore;
    }
  }

  return {
    matchId,
    rawAssignments: assignments,
    resolvedAssignments,
    conflictFreeAssignments,
    conflictsDetected: detection.conflictCount,
    slotResults,
    totalScore,
    totalScoreRounded: Math.round(totalScore),
  };
}

// =============================================================================
// SCENARIO 1: HAPPY PATH (Unique players, all slots filled)
// =============================================================================

function runHappyPathScenario(): E2EScenarioResult {
  const tests: E2ETestResult[] = [];
  const matchId = 'match-happy-001';

  // Create 11 unique players with varying stats
  const statsMap = new Map<string, PlayerMatchStats>();

  // Player 1: Star batsman (75 runs, SR 150)
  statsMap.set('p1', createStats('p1', matchId, {
    runs: 75, ballsFaced: 50, fours: 8, sixes: 3,
  }));

  // Player 2: Economical bowler (4-0-24-3)
  statsMap.set('p2', createStats('p2', matchId, {
    oversBowled: 4.0, runsConceded: 24, wickets: 3,
  }));

  // Player 3: All-rounder (50 runs + 2 wickets)
  statsMap.set('p3', createStats('p3', matchId, {
    runs: 50, ballsFaced: 40, fours: 4, sixes: 2,
    oversBowled: 3.0, runsConceded: 25, wickets: 2,
  }));

  // Player 4-11: Various contributions
  statsMap.set('p4', createStats('p4', matchId, { runs: 30, ballsFaced: 25, fours: 3 }));
  statsMap.set('p5', createStats('p5', matchId, { runs: 20, ballsFaced: 15, fours: 2, sixes: 1 }));
  statsMap.set('p6', createStats('p6', matchId, { oversBowled: 4.0, runsConceded: 32, wickets: 2 }));
  statsMap.set('p7', createStats('p7', matchId, { runs: 15, ballsFaced: 12, catches: 2 }));
  statsMap.set('p8', createStats('p8', matchId, { oversBowled: 2.0, runsConceded: 18, wickets: 1 }));
  statsMap.set('p9', createStats('p9', matchId, { catches: 1, runOuts: 1 }));
  statsMap.set('p10', createStats('p10', matchId, { runs: 10, ballsFaced: 8, fours: 1 }));
  statsMap.set('p11', createStats('p11', matchId, { oversBowled: 1.0, runsConceded: 12, wickets: 0 }));

  // Slot assignments (all unique, no conflicts)
  const assignments: SlotAssignmentMap = {
    1: 'p1', 2: 'p2', 3: 'p3', 4: 'p4', 5: 'p5',
    6: 'p6', 7: 'p7', 8: 'p8', 9: 'p9', 10: 'p10', 11: 'p11',
  };

  // Multipliers (descending from slot 1 to 11)
  const multipliers: Record<SlotIndex, number> = {
    1: 20, 2: 15, 3: 12, 4: 10, 5: 8,
    6: 6, 7: 5, 8: 4, 9: 3, 10: 2, 11: 1,
  };

  // Run pipeline
  const result = runE2EPipeline(matchId, assignments, multipliers, statsMap);

  // Test 1: No conflicts detected
  tests.push({
    testId: 'E2E-HAPPY-001',
    description: 'Happy path: no conflicts detected',
    passed: result.conflictsDetected === 0,
    error: result.conflictsDetected === 0 ? undefined : `Expected 0 conflicts, got ${result.conflictsDetected}`,
  });

  // Test 2: All 11 slots have players
  const filledSlots = result.slotResults.filter(s => s.playerId !== null).length;
  tests.push({
    testId: 'E2E-HAPPY-002',
    description: 'Happy path: all 11 slots filled',
    passed: filledSlots === 11,
    error: filledSlots === 11 ? undefined : `Expected 11 filled slots, got ${filledSlots}`,
  });

  // Test 3: Slot 1 (p1, star batsman, 20x) has highest contribution
  // p1 base: 75 + 80 + 60 + 150 = 365 batting + 0 = 365; 365 * 20 = 7300
  const slot1Score = result.slotResults.find(s => s.slotIndex === 1)?.slotScore ?? 0;
  tests.push({
    testId: 'E2E-HAPPY-003',
    description: 'Happy path: Slot 1 score = 365 × 20 = 7300',
    passed: floatsEqual(slot1Score, 7300),
    error: floatsEqual(slot1Score, 7300) ? undefined : `Expected 7300, got ${slot1Score}`,
  });

  // Test 4: Slot 2 (p2, bowler, 15x)
  // p2 base: 0 batting + 60 wickets + 100 rpo + 0 = 160; 160 * 15 = 2400
  const slot2Score = result.slotResults.find(s => s.slotIndex === 2)?.slotScore ?? 0;
  tests.push({
    testId: 'E2E-HAPPY-004',
    description: 'Happy path: Slot 2 score = 160 × 15 = 2400',
    passed: floatsEqual(slot2Score, 2400),
    error: floatsEqual(slot2Score, 2400) ? undefined : `Expected 2400, got ${slot2Score}`,
  });

  // Test 5: Total score is sum of all slot scores
  const manualSum = result.slotResults.reduce((sum, s) => sum + s.slotScore, 0);
  tests.push({
    testId: 'E2E-HAPPY-005',
    description: 'Happy path: totalScore equals sum of slot scores',
    passed: floatsEqual(result.totalScore, manualSum),
    error: floatsEqual(result.totalScore, manualSum) ? undefined : `Mismatch: ${result.totalScore} vs ${manualSum}`,
  });

  // Test 6: Output is conflict-free
  tests.push({
    testId: 'E2E-HAPPY-006',
    description: 'Happy path: output assignments are conflict-free',
    passed: isConflictFree(result.conflictFreeAssignments),
  });

  // Test 7: Determinism - run again and compare
  const result2 = runE2EPipeline(matchId, assignments, multipliers, statsMap);
  tests.push({
    testId: 'E2E-HAPPY-007',
    description: 'Happy path: deterministic output on re-run',
    passed: result.totalScore === result2.totalScore,
  });

  return {
    scenarioId: 'E2E-HAPPY',
    scenarioName: 'Happy Path (Unique Players)',
    tests,
    passed: tests.every(t => t.passed),
  };
}

// =============================================================================
// SCENARIO 2: CONFLICT-HEAVY (Multiple duplicates)
// =============================================================================

function runConflictHeavyScenario(): E2EScenarioResult {
  const tests: E2ETestResult[] = [];
  const matchId = 'match-conflict-001';

  // Create only 4 unique players but assign them to all 11 slots
  const statsMap = new Map<string, PlayerMatchStats>();

  // Star player (will be duplicated in slots 1, 4, 7, 10)
  statsMap.set('star', createStats('star', matchId, {
    runs: 100, ballsFaced: 60, fours: 10, sixes: 4,
    isManOfTheMatch: true,
  }));

  // Bowler (will be duplicated in slots 2, 5, 8, 11)
  statsMap.set('bowler', createStats('bowler', matchId, {
    oversBowled: 4.0, runsConceded: 20, wickets: 4,
  }));

  // All-rounder (will be duplicated in slots 3, 6, 9)
  statsMap.set('allrounder', createStats('allrounder', matchId, {
    runs: 50, ballsFaced: 30, fours: 5, sixes: 2,
    oversBowled: 4.0, runsConceded: 28, wickets: 2,
  }));

  // Single appearance player
  statsMap.set('single', createStats('single', matchId, {
    runs: 25, ballsFaced: 20, fours: 2,
  }));

  // Slot assignments WITH CONFLICTS
  const assignments: SlotAssignmentMap = {
    1: 'star',       // KEPT (lowest index for star)
    2: 'bowler',     // KEPT (lowest index for bowler)
    3: 'allrounder', // KEPT (lowest index for allrounder)
    4: 'star',       // CONFLICT → cleared
    5: 'bowler',     // CONFLICT → cleared
    6: 'allrounder', // CONFLICT → cleared
    7: 'star',       // CONFLICT → cleared
    8: 'bowler',     // CONFLICT → cleared
    9: 'allrounder', // CONFLICT → cleared
    10: 'star',      // CONFLICT → cleared
    11: 'single',    // KEPT (only occurrence)
  };

  // Multipliers
  const multipliers: Record<SlotIndex, number> = {
    1: 20, 2: 18, 3: 16, 4: 14, 5: 12,
    6: 10, 7: 8, 8: 6, 9: 4, 10: 2, 11: 1,
  };

  // Run pipeline
  const result = runE2EPipeline(matchId, assignments, multipliers, statsMap);

  // Test 1: Correct number of conflicts detected (3 players with duplicates)
  tests.push({
    testId: 'E2E-CONFLICT-001',
    description: 'Conflict scenario: 3 conflicts detected',
    passed: result.conflictsDetected === 3,
    error: result.conflictsDetected === 3 ? undefined : `Expected 3 conflicts, got ${result.conflictsDetected}`,
  });

  // Test 2: Only 4 slots should have players after resolution
  const filledSlots = result.slotResults.filter(s => s.playerId !== null).length;
  tests.push({
    testId: 'E2E-CONFLICT-002',
    description: 'Conflict scenario: only 4 slots filled after resolution',
    passed: filledSlots === 4,
    error: filledSlots === 4 ? undefined : `Expected 4 filled slots, got ${filledSlots}`,
  });

  // Test 3: Slots 1, 2, 3, 11 should be filled
  const expectedFilled = [1, 2, 3, 11] as SlotIndex[];
  const actualFilled = result.slotResults
    .filter(s => s.playerId !== null)
    .map(s => s.slotIndex);
  const correctSlotsFilled = expectedFilled.every(idx => actualFilled.includes(idx)) &&
                             actualFilled.length === expectedFilled.length;
  tests.push({
    testId: 'E2E-CONFLICT-003',
    description: 'Conflict scenario: slots 1, 2, 3, 11 are filled',
    passed: correctSlotsFilled,
    error: correctSlotsFilled ? undefined : `Expected [1,2,3,11], got [${actualFilled.join(',')}]`,
  });

  // Test 4: Slot 4 cleared (was duplicate of star)
  const slot4 = result.slotResults.find(s => s.slotIndex === 4);
  tests.push({
    testId: 'E2E-CONFLICT-004',
    description: 'Conflict scenario: slot 4 cleared (duplicate)',
    passed: slot4?.playerId === null && slot4?.slotScore === 0,
  });

  // Test 5: Slot 1 (star, 20x) score calculation
  // star base: 100 + 100 + 80 + 166.666... + 200 (century) + 200 (MoM) = 846.666...
  // star slot: 846.666... * 20 = 16933.333...
  const slot1 = result.slotResults.find(s => s.slotIndex === 1);
  const expectedStar = (100 + 100 + 80 + (100/60)*100 + 200 + 200) * 20;
  tests.push({
    testId: 'E2E-CONFLICT-005',
    description: 'Conflict scenario: Slot 1 (star) score correct',
    passed: slot1 !== undefined && floatsEqual(slot1.slotScore, expectedStar),
    error: slot1 !== undefined && floatsEqual(slot1.slotScore, expectedStar) 
      ? undefined 
      : `Expected ${expectedStar}, got ${slot1?.slotScore}`,
  });

  // Test 6: Output is conflict-free
  tests.push({
    testId: 'E2E-CONFLICT-006',
    description: 'Conflict scenario: output is conflict-free',
    passed: isConflictFree(result.conflictFreeAssignments),
  });

  // Test 7: Cleared slots contribute 0 to total
  const clearedSlots = result.slotResults.filter(s => s.playerId === null);
  const clearedContribution = clearedSlots.reduce((sum, s) => sum + s.slotScore, 0);
  tests.push({
    testId: 'E2E-CONFLICT-007',
    description: 'Conflict scenario: cleared slots contribute 0',
    passed: clearedContribution === 0,
    error: clearedContribution === 0 ? undefined : `Expected 0, got ${clearedContribution}`,
  });

  // Test 8: Determinism
  const result2 = runE2EPipeline(matchId, assignments, multipliers, statsMap);
  tests.push({
    testId: 'E2E-CONFLICT-008',
    description: 'Conflict scenario: deterministic output',
    passed: floatsEqual(result.totalScore, result2.totalScore),
  });

  return {
    scenarioId: 'E2E-CONFLICT',
    scenarioName: 'Conflict-Heavy (Multiple Duplicates)',
    tests,
    passed: tests.every(t => t.passed),
  };
}

// =============================================================================
// SCENARIO 3: PARTIAL SLOTS (Some empty)
// =============================================================================

function runPartialSlotsScenario(): E2EScenarioResult {
  const tests: E2ETestResult[] = [];
  const matchId = 'match-partial-001';

  // Create 5 players
  const statsMap = new Map<string, PlayerMatchStats>();
  statsMap.set('a', createStats('a', matchId, { runs: 50, ballsFaced: 40, fours: 5 }));
  statsMap.set('b', createStats('b', matchId, { runs: 30, ballsFaced: 25, fours: 3 }));
  statsMap.set('c', createStats('c', matchId, { oversBowled: 4.0, runsConceded: 24, wickets: 2 }));
  statsMap.set('d', createStats('d', matchId, { catches: 2, runOuts: 1 }));
  statsMap.set('e', createStats('e', matchId, { runs: 10, ballsFaced: 5, sixes: 1 }));

  // Only fill slots 1, 3, 5, 7, 9 (leave 2, 4, 6, 8, 10, 11 empty)
  const assignments: SlotAssignmentMap = {
    1: 'a',
    3: 'b',
    5: 'c',
    7: 'd',
    9: 'e',
    // 2, 4, 6, 8, 10, 11 intentionally missing
  };

  const multipliers: Record<SlotIndex, number> = {
    1: 20, 2: 18, 3: 16, 4: 14, 5: 12,
    6: 10, 7: 8, 8: 6, 9: 4, 10: 2, 11: 1,
  };

  // Run pipeline
  const result = runE2EPipeline(matchId, assignments, multipliers, statsMap);

  // Test 1: No conflicts
  tests.push({
    testId: 'E2E-PARTIAL-001',
    description: 'Partial slots: no conflicts',
    passed: result.conflictsDetected === 0,
  });

  // Test 2: 5 slots filled
  const filledSlots = result.slotResults.filter(s => s.playerId !== null).length;
  tests.push({
    testId: 'E2E-PARTIAL-002',
    description: 'Partial slots: 5 slots filled',
    passed: filledSlots === 5,
    error: filledSlots === 5 ? undefined : `Expected 5, got ${filledSlots}`,
  });

  // Test 3: 6 slots empty
  const emptySlots = result.slotResults.filter(s => s.playerId === null).length;
  tests.push({
    testId: 'E2E-PARTIAL-003',
    description: 'Partial slots: 6 slots empty',
    passed: emptySlots === 6,
    error: emptySlots === 6 ? undefined : `Expected 6, got ${emptySlots}`,
  });

  // Test 4: Slot 2 is null (was missing in input)
  const slot2 = result.slotResults.find(s => s.slotIndex === 2);
  tests.push({
    testId: 'E2E-PARTIAL-004',
    description: 'Partial slots: slot 2 normalized to null',
    passed: slot2?.playerId === null,
  });

  // Test 5: Slot 1 score correct
  // a base: 50 + 50 + 0 + 125 (SR) = 225; 225 * 20 = 4500
  const slot1 = result.slotResults.find(s => s.slotIndex === 1);
  const expectedSlot1 = (50 + 50 + (50/40)*100) * 20;
  tests.push({
    testId: 'E2E-PARTIAL-005',
    description: 'Partial slots: slot 1 score correct',
    passed: slot1 !== undefined && floatsEqual(slot1.slotScore, expectedSlot1),
    error: slot1 !== undefined && floatsEqual(slot1.slotScore, expectedSlot1)
      ? undefined
      : `Expected ${expectedSlot1}, got ${slot1?.slotScore}`,
  });

  // Test 6: Empty slots contribute 0
  const emptyContribution = result.slotResults
    .filter(s => s.playerId === null)
    .reduce((sum, s) => sum + s.slotScore, 0);
  tests.push({
    testId: 'E2E-PARTIAL-006',
    description: 'Partial slots: empty slots contribute 0',
    passed: emptyContribution === 0,
  });

  // Test 7: Resolved map has all 11 slots
  const resolvedSlotCount = Object.keys(result.resolvedAssignments).length;
  tests.push({
    testId: 'E2E-PARTIAL-007',
    description: 'Partial slots: resolved map has all 11 slots',
    passed: resolvedSlotCount === 11,
  });

  return {
    scenarioId: 'E2E-PARTIAL',
    scenarioName: 'Partial Slots (Some Empty)',
    tests,
    passed: tests.every(t => t.passed),
  };
}

// =============================================================================
// SCENARIO 4: ALL-ROUNDER WITH MAXIMUM BONUSES
// =============================================================================

function runAllRounderScenario(): E2EScenarioResult {
  const tests: E2ETestResult[] = [];
  const matchId = 'match-allrounder-001';

  // Single legendary all-rounder
  const statsMap = new Map<string, PlayerMatchStats>();
  statsMap.set('legend', createStats('legend', matchId, {
    runs: 112,
    ballsFaced: 68,
    fours: 12,
    sixes: 4,
    oversBowled: 4.0,
    runsConceded: 28,
    wickets: 5,
    hasTakenHatTrick: true,
    catches: 2,
    runOuts: 1,
    isManOfTheMatch: true,
  }));

  // Put legend in slot 1 only
  const assignments: SlotAssignmentMap = { 1: 'legend' };

  // High multiplier for slot 1
  const multipliers: Record<SlotIndex, number> = {
    1: 25, 2: 1, 3: 1, 4: 1, 5: 1,
    6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1,
  };

  // Run pipeline
  const result = runE2EPipeline(matchId, assignments, multipliers, statsMap);

  // Test 1: Base score matches GTV-003 (1441.70588235294117647)
  const slot1 = result.slotResults.find(s => s.slotIndex === 1);
  const expectedBase = 1441.70588235294117647;
  tests.push({
    testId: 'E2E-ALLROUNDER-001',
    description: 'All-rounder: base score matches GTV-003',
    passed: slot1 !== undefined && floatsEqual(slot1.baseScore ?? 0, expectedBase),
    error: slot1 !== undefined && floatsEqual(slot1.baseScore ?? 0, expectedBase)
      ? undefined
      : `Expected base ${expectedBase}, got ${slot1?.baseScore}`,
  });

  // Test 2: Slot score with 25x multiplier
  const expectedSlotScore = expectedBase * 25;
  tests.push({
    testId: 'E2E-ALLROUNDER-002',
    description: 'All-rounder: slot score = base × 25',
    passed: slot1 !== undefined && floatsEqual(slot1.slotScore, expectedSlotScore),
    error: slot1 !== undefined && floatsEqual(slot1.slotScore, expectedSlotScore)
      ? undefined
      : `Expected ${expectedSlotScore}, got ${slot1?.slotScore}`,
  });

  // Test 3: Total score (only slot 1 contributes)
  tests.push({
    testId: 'E2E-ALLROUNDER-003',
    description: 'All-rounder: total score equals slot 1 score',
    passed: floatsEqual(result.totalScore, expectedSlotScore),
  });

  // Test 4: Rounded total score
  const expectedRounded = Math.round(expectedSlotScore);
  tests.push({
    testId: 'E2E-ALLROUNDER-004',
    description: 'All-rounder: rounded total correct',
    passed: result.totalScoreRounded === expectedRounded,
    error: result.totalScoreRounded === expectedRounded
      ? undefined
      : `Expected ${expectedRounded}, got ${result.totalScoreRounded}`,
  });

  // Test 5: Consistency with golden test vectors
  // GTV-003 expects 1441.70588235294117647 base
  const slot1Base = slot1?.baseScore ?? 0;
  tests.push({
    testId: 'E2E-ALLROUNDER-005',
    description: 'All-rounder: consistent with GTV-003 base score',
    passed: slot1Base !== 0 && 
            Math.abs((slot1Base - 1441.70588235294117647) / 1441.70588235294117647) < 1e-10,
  });

  return {
    scenarioId: 'E2E-ALLROUNDER',
    scenarioName: 'All-Rounder with Maximum Bonuses',
    tests,
    passed: tests.every(t => t.passed),
  };
}

// =============================================================================
// SCENARIO 5: EDGE CASES
// =============================================================================

function runEdgeCaseScenario(): E2EScenarioResult {
  const tests: E2ETestResult[] = [];
  const matchId = 'match-edge-001';

  const statsMap = new Map<string, PlayerMatchStats>();

  // Zero-score player (golden duck)
  statsMap.set('duck', createStats('duck', matchId, { runs: 0, ballsFaced: 1 }));

  // High SR player (6 off 1 ball)
  statsMap.set('highsr', createStats('highsr', matchId, { runs: 6, ballsFaced: 1, sixes: 1 }));

  // Invalid participation (but we'll include for completeness)
  statsMap.set('noscore', createStats('noscore', matchId, {}));

  // Player with only fielding
  statsMap.set('fielder', createStats('fielder', matchId, { catches: 1, runOuts: 1 }));

  const assignments: SlotAssignmentMap = {
    1: 'highsr',
    2: 'duck',
    3: 'fielder',
    // noscore intentionally excluded as invalid
  };

  const multipliers: Record<SlotIndex, number> = {
    1: 100, // Extreme multiplier
    2: 50,
    3: 20,
    4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1,
  };

  // Run pipeline
  const result = runE2EPipeline(matchId, assignments, multipliers, statsMap);

  // Test 1: High SR player (SR = 600)
  // base: 6 + 0 + 20 + 600 = 626; slot: 626 * 100 = 62600
  const slot1 = result.slotResults.find(s => s.slotIndex === 1);
  tests.push({
    testId: 'E2E-EDGE-001',
    description: 'Edge case: high SR (600) × 100 = 62600',
    passed: slot1 !== undefined && floatsEqual(slot1.slotScore, 62600),
    error: slot1 !== undefined && floatsEqual(slot1.slotScore, 62600)
      ? undefined
      : `Expected 62600, got ${slot1?.slotScore}`,
  });

  // Test 2: Golden duck (0 score)
  // base: 0 + 0 + 0 + 0 = 0; slot: 0 * 50 = 0
  const slot2 = result.slotResults.find(s => s.slotIndex === 2);
  tests.push({
    testId: 'E2E-EDGE-002',
    description: 'Edge case: golden duck scores 0',
    passed: slot2 !== undefined && slot2.slotScore === 0,
  });

  // Test 3: Fielding-only player
  // base: 5 + 5 = 10; slot: 10 * 20 = 200
  const slot3 = result.slotResults.find(s => s.slotIndex === 3);
  tests.push({
    testId: 'E2E-EDGE-003',
    description: 'Edge case: fielder scores 10 × 20 = 200',
    passed: slot3 !== undefined && floatsEqual(slot3.slotScore, 200),
    error: slot3 !== undefined && floatsEqual(slot3.slotScore, 200)
      ? undefined
      : `Expected 200, got ${slot3?.slotScore}`,
  });

  // Test 4: Total score is non-negative
  tests.push({
    testId: 'E2E-EDGE-004',
    description: 'Edge case: total score is non-negative',
    passed: result.totalScore >= 0,
  });

  // Test 5: Valid participation check
  const duckStats = statsMap.get('duck')!;
  const highsrStats = statsMap.get('highsr')!;
  const noscoreStats = statsMap.get('noscore')!;
  tests.push({
    testId: 'E2E-EDGE-005',
    description: 'Edge case: duck has valid participation',
    passed: hasValidParticipation(duckStats),
  });

  tests.push({
    testId: 'E2E-EDGE-006',
    description: 'Edge case: highsr has valid participation',
    passed: hasValidParticipation(highsrStats),
  });

  tests.push({
    testId: 'E2E-EDGE-007',
    description: 'Edge case: noscore has invalid participation',
    passed: !hasValidParticipation(noscoreStats),
  });

  return {
    scenarioId: 'E2E-EDGE',
    scenarioName: 'Edge Cases (Zero, High SR, Extreme Multipliers)',
    tests,
    passed: tests.every(t => t.passed),
  };
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

export interface E2ETestSuiteResult {
  readonly totalScenarios: number;
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly scenarios: E2EScenarioResult[];
  readonly executionTimeMs: number;
}

export function runE2ETests(): E2ETestSuiteResult {
  const startTime = performance.now();

  const scenarios: E2EScenarioResult[] = [
    runHappyPathScenario(),
    runConflictHeavyScenario(),
    runPartialSlotsScenario(),
    runAllRounderScenario(),
    runEdgeCaseScenario(),
  ];

  const endTime = performance.now();

  const allTests = scenarios.flatMap(s => s.tests);

  return {
    totalScenarios: scenarios.length,
    totalTests: allTests.length,
    passed: allTests.filter(t => t.passed).length,
    failed: allTests.filter(t => !t.passed).length,
    scenarios,
    executionTimeMs: endTime - startTime,
  };
}

// =============================================================================
// CONSOLE REPORTER
// =============================================================================

function printE2ETestResults(suiteResult: E2ETestSuiteResult): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — END-TO-END SCENARIO TESTS');
  console.log('Authority: Constitution.md v1.0');
  console.log('='.repeat(70) + '\n');

  console.log(`Scenarios: ${suiteResult.totalScenarios}`);
  console.log(`Total tests: ${suiteResult.totalTests}`);
  console.log('\n' + '-'.repeat(70) + '\n');

  for (const scenario of suiteResult.scenarios) {
    const scenarioStatus = scenario.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`${scenarioStatus} SCENARIO: ${scenario.scenarioName}`);
    console.log('');

    for (const test of scenario.tests) {
      const status = test.passed ? '✓ PASS' : '✗ FAIL';
      const statusColor = test.passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(`  ${statusColor}${status}${reset} [${test.testId}] ${test.description}`);

      if (!test.passed && test.error) {
        console.log(`         └─ ${test.error}`);
      }
    }
    console.log('');
  }

  console.log('-'.repeat(70));
  console.log(`\nRESULTS: ${suiteResult.passed}/${suiteResult.totalTests} passed`);
  console.log(`Execution time: ${suiteResult.executionTimeMs.toFixed(2)}ms`);

  if (suiteResult.failed > 0) {
    console.log(`\n\x1b[31m✗ ${suiteResult.failed} TEST(S) FAILED\x1b[0m`);
  } else {
    console.log(`\n\x1b[32m✓ ALL E2E TESTS PASSED\x1b[0m`);
    console.log('Full pipeline is Constitution-compliant');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runE2ETests();
  printE2ETestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printE2ETestResults, runE2EPipeline };
