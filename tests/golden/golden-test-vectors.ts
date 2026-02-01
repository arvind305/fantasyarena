/**
 * IPL Friends Betting Game — Golden Test Vectors (v1)
 * 
 * Authority: Constitution.md v1.0
 * 
 * PURPOSE:
 * These test vectors serve as PERMANENT REGRESSION ANCHORS for the scoring engine.
 * They are deterministic, hand-calculated, and verified against Constitution Section 4.
 * 
 * IMMUTABILITY:
 * These expected values must NEVER change unless the Constitution is versioned.
 * Any deviation from these outputs indicates a scoring engine bug.
 * 
 * COVERAGE:
 * 1. Batting-only performance
 * 2. Bowling-only performance
 * 3. All-rounder performance (century + 5-wicket haul + hat-trick + MoM)
 * 4. Invalid participation (should not be scored)
 * 5. Worst-case valid performance (0 base score, valid participation)
 * 6. High-SR edge case (extreme strike rate)
 * 7. Multiplier application (Slot 1 = 20×)
 * 8. Multiplier with fractional base score
 * 9. Partial over bowling (3.4 overs format)
 * 10. RPO tier boundary tests
 */

import type {
  PlayerMatchStats,
  RuleVersion,
  Slot,
} from './models';

import {
  CONSTITUTION_V1_SCORING_RULES,
} from './models';

import type {
  BaseScoreBreakdown,
  FinalScoreResult,
} from './scoring';

// =============================================================================
// CANONICAL RULE VERSION FOR TESTING
// =============================================================================

/**
 * The canonical RuleVersion used for all golden tests
 * Represents Constitution v1.0
 */
export const GOLDEN_RULE_VERSION: RuleVersion = {
  id: 'rule-v1-golden',
  version: '1.0.0',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  isActive: true,
  scoringRules: CONSTITUTION_V1_SCORING_RULES,
};

// =============================================================================
// TEST VECTOR INTERFACE
// =============================================================================

export interface GoldenTestVector {
  readonly id: string;
  readonly description: string;
  readonly category: 
    | 'batting-only'
    | 'bowling-only'
    | 'all-rounder'
    | 'invalid-participation'
    | 'worst-case-valid'
    | 'high-sr-edge'
    | 'multiplier'
    | 'partial-over'
    | 'rpo-boundary';
  readonly input: {
    readonly stats: PlayerMatchStats;
    readonly slot: Slot;
    readonly ruleVersion: RuleVersion;
  };
  readonly expected: {
    readonly baseScoreBreakdown: BaseScoreBreakdown;
    readonly finalScoreFloat: number;
    readonly finalScoreRounded: number;
    readonly hasValidParticipation: boolean;
  };
}

// =============================================================================
// HELPER: Create base stats template
// =============================================================================

function createEmptyStats(
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
// DEFAULT SLOT (1× multiplier, enabled)
// =============================================================================

const SLOT_1X: Slot = {
  slotNumber: 1,
  multiplier: 1,
  isEnabled: true,
};

const SLOT_20X: Slot = {
  slotNumber: 1,
  multiplier: 20,
  isEnabled: true,
};

const SLOT_3X: Slot = {
  slotNumber: 5,
  multiplier: 3,
  isEnabled: true,
};

const SLOT_DISABLED: Slot = {
  slotNumber: 1,
  multiplier: 20,
  isEnabled: false, // Should be treated as 1×
};

// =============================================================================
// TEST VECTOR 1: BATTING-ONLY PERFORMANCE
// =============================================================================

/**
 * Scenario: Quality batting innings with fielding contribution
 * 
 * Stats:
 * - 75 runs off 50 balls (SR = 150.0)
 * - 8 fours, 3 sixes
 * - 1 catch
 * - No bowling
 * 
 * Calculation:
 * - Run points: 75 × 1 = 75
 * - Four points: 8 × 10 = 80
 * - Six points: 3 × 20 = 60
 * - SR points: (75/50) × 100 = 150.0
 * - Century bonus: 0 (< 100)
 * - Batting subtotal: 75 + 80 + 60 + 150 + 0 = 365
 * 
 * - Bowling subtotal: 0 (no bowling)
 * 
 * - Catch points: 1 × 5 = 5
 * - Fielding subtotal: 5
 * 
 * - MoM bonus: 0
 * 
 * Total: 365 + 0 + 5 + 0 = 370
 */
export const TEST_VECTOR_1_BATTING_ONLY: GoldenTestVector = {
  id: 'GTV-001',
  description: 'Batting-only: 75(50) with 8×4, 3×6, 1 catch',
  category: 'batting-only',
  input: {
    stats: createEmptyStats('player-001', 'match-001', {
      runs: 75,
      ballsFaced: 50,
      fours: 8,
      sixes: 3,
      catches: 1,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 75,
      fourPoints: 80,
      sixPoints: 60,
      strikeRatePoints: 150.0,
      centuryBonus: 0,
      battingSubtotal: 365.0,

      wicketPoints: 0,
      rpoPoints: 0,
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 0,

      catchPoints: 5,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 5,

      manOfTheMatchBonus: 0,

      totalBaseScore: 370.0,
    },
    finalScoreFloat: 370.0,
    finalScoreRounded: 370,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 2: BOWLING-ONLY PERFORMANCE
// =============================================================================

/**
 * Scenario: Economical bowling spell
 * 
 * Stats:
 * - 4 overs, 24 runs conceded (RPO = 6.0, Tier 1)
 * - 3 wickets
 * - No batting
 * 
 * Calculation:
 * - Batting subtotal: 0 (no balls faced, SR = N/A → 0)
 * 
 * - Wicket points: 3 × 20 = 60
 * - RPO: 24 / 4 = 6.0 → ≤ 6 → 100 points
 * - 5-wicket bonus: 0
 * - Hat-trick bonus: 0
 * - Bowling subtotal: 60 + 100 + 0 + 0 = 160
 * 
 * - Fielding subtotal: 0
 * - MoM bonus: 0
 * 
 * Total: 0 + 160 + 0 + 0 = 160
 */
export const TEST_VECTOR_2_BOWLING_ONLY: GoldenTestVector = {
  id: 'GTV-002',
  description: 'Bowling-only: 4-0-24-3 (RPO 6.0, Tier 1)',
  category: 'bowling-only',
  input: {
    stats: createEmptyStats('player-002', 'match-001', {
      oversBowled: 4.0,
      runsConceded: 24,
      wickets: 3,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 0,
      fourPoints: 0,
      sixPoints: 0,
      strikeRatePoints: 0, // No balls faced
      centuryBonus: 0,
      battingSubtotal: 0,

      wicketPoints: 60,
      rpoPoints: 100,
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 160,

      catchPoints: 0,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 0,

      manOfTheMatchBonus: 0,

      totalBaseScore: 160.0,
    },
    finalScoreFloat: 160.0,
    finalScoreRounded: 160,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 3: ALL-ROUNDER PERFORMANCE
// =============================================================================

/**
 * Scenario: Dominant all-round performance with all bonuses
 * 
 * Stats:
 * - 112 runs off 68 balls (SR = 164.705882352941...)
 * - 12 fours, 4 sixes
 * - 4 overs, 28 runs conceded (RPO = 7.0, Tier 2)
 * - 5 wickets (5-wicket haul bonus)
 * - Hat-trick
 * - 2 catches, 1 run-out
 * - Man of the Match
 * 
 * Calculation:
 * - Run points: 112 × 1 = 112
 * - Four points: 12 × 10 = 120
 * - Six points: 4 × 20 = 80
 * - SR points: (112/68) × 100 = 164.70588235294117647...
 * - Century bonus: 200 (≥ 100)
 * - Batting subtotal: 112 + 120 + 80 + 164.70588235294117647 + 200 = 676.70588235294117647
 * 
 * - Wicket points: 5 × 20 = 100
 * - RPO: 28 / 4 = 7.0 → > 6 and ≤ 8 → 50 points
 * - 5-wicket bonus: 200
 * - Hat-trick bonus: 200
 * - Bowling subtotal: 100 + 50 + 200 + 200 = 550
 * 
 * - Catch points: 2 × 5 = 10
 * - Run-out points: 1 × 5 = 5
 * - Fielding subtotal: 15
 * 
 * - MoM bonus: 200
 * 
 * Total: 676.70588235294117647 + 550 + 15 + 200 = 1441.70588235294117647
 * Rounded: 1442
 */
export const TEST_VECTOR_3_ALL_ROUNDER: GoldenTestVector = {
  id: 'GTV-003',
  description: 'All-rounder: 112(68), 5-wicket haul, hat-trick, MoM',
  category: 'all-rounder',
  input: {
    stats: createEmptyStats('player-003', 'match-001', {
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
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 112,
      fourPoints: 120,
      sixPoints: 80,
      strikeRatePoints: 164.70588235294117647,
      centuryBonus: 200,
      battingSubtotal: 676.70588235294117647,

      wicketPoints: 100,
      rpoPoints: 50,
      fiveWicketBonus: 200,
      hatTrickBonus: 200,
      bowlingSubtotal: 550,

      catchPoints: 10,
      runOutPoints: 5,
      stumpingPoints: 0,
      fieldingSubtotal: 15,

      manOfTheMatchBonus: 200,

      totalBaseScore: 1441.70588235294117647,
    },
    finalScoreFloat: 1441.70588235294117647,
    finalScoreRounded: 1442,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 4: INVALID PARTICIPATION
// =============================================================================

/**
 * Scenario: Player in squad but did not participate
 * 
 * Stats:
 * - 0 balls faced
 * - 0 balls bowled
 * - 0 fielding actions
 * - Not MoM
 * 
 * Reference: Constitution Section 4.5
 * "Even 1 ball faced or bowled is valid for scoring"
 * → 0 balls = INVALID participation
 * 
 * Total: 0 (but hasValidParticipation = false)
 */
export const TEST_VECTOR_4_INVALID_PARTICIPATION: GoldenTestVector = {
  id: 'GTV-004',
  description: 'Invalid participation: 0 balls faced/bowled, no fielding',
  category: 'invalid-participation',
  input: {
    stats: createEmptyStats('player-004', 'match-001', {}),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 0,
      fourPoints: 0,
      sixPoints: 0,
      strikeRatePoints: 0,
      centuryBonus: 0,
      battingSubtotal: 0,

      wicketPoints: 0,
      rpoPoints: 0,
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 0,

      catchPoints: 0,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 0,

      manOfTheMatchBonus: 0,

      totalBaseScore: 0,
    },
    finalScoreFloat: 0,
    finalScoreRounded: 0,
    hasValidParticipation: false,
  },
};

// =============================================================================
// TEST VECTOR 5: WORST-CASE VALID PERFORMANCE
// =============================================================================

/**
 * Scenario: Golden duck (out first ball, 0 runs)
 * 
 * Stats:
 * - 0 runs off 1 ball (SR = 0.0)
 * - No boundaries
 * - No bowling
 * - No fielding
 * 
 * Reference: Constitution Section 4.5
 * "Even 1 ball faced or bowled is valid for scoring"
 * → Valid participation but 0 total score
 * 
 * Calculation:
 * - SR points: (0/1) × 100 = 0.0
 * - All other components: 0
 * 
 * Total: 0 (but hasValidParticipation = true)
 */
export const TEST_VECTOR_5_WORST_CASE_VALID: GoldenTestVector = {
  id: 'GTV-005',
  description: 'Worst-case valid: Golden duck 0(1)',
  category: 'worst-case-valid',
  input: {
    stats: createEmptyStats('player-005', 'match-001', {
      runs: 0,
      ballsFaced: 1,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 0,
      fourPoints: 0,
      sixPoints: 0,
      strikeRatePoints: 0.0,
      centuryBonus: 0,
      battingSubtotal: 0.0,

      wicketPoints: 0,
      rpoPoints: 0,
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 0,

      catchPoints: 0,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 0,

      manOfTheMatchBonus: 0,

      totalBaseScore: 0.0,
    },
    finalScoreFloat: 0.0,
    finalScoreRounded: 0,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 6: HIGH-SR EDGE CASE
// =============================================================================

/**
 * Scenario: Extreme strike rate (6 runs off 1 ball - one six)
 * 
 * Stats:
 * - 6 runs off 1 ball (SR = 600.0)
 * - 1 six
 * 
 * Calculation:
 * - Run points: 6 × 1 = 6
 * - Six points: 1 × 20 = 20
 * - SR points: (6/1) × 100 = 600.0
 * - Batting subtotal: 6 + 0 + 20 + 600 + 0 = 626
 * 
 * Total: 626
 */
export const TEST_VECTOR_6_HIGH_SR_EDGE: GoldenTestVector = {
  id: 'GTV-006',
  description: 'High-SR edge: 6(1) with 1×6 (SR = 600)',
  category: 'high-sr-edge',
  input: {
    stats: createEmptyStats('player-006', 'match-001', {
      runs: 6,
      ballsFaced: 1,
      sixes: 1,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 6,
      fourPoints: 0,
      sixPoints: 20,
      strikeRatePoints: 600.0,
      centuryBonus: 0,
      battingSubtotal: 626.0,

      wicketPoints: 0,
      rpoPoints: 0,
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 0,

      catchPoints: 0,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 0,

      manOfTheMatchBonus: 0,

      totalBaseScore: 626.0,
    },
    finalScoreFloat: 626.0,
    finalScoreRounded: 626,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 7: MULTIPLIER APPLICATION (20×)
// =============================================================================

/**
 * Scenario: Test Vector 1 stats with 20× multiplier (Slot 1)
 * 
 * Reference: Constitution Section 5.3
 * "Multipliers apply only to player points and runner points"
 * 
 * Base score: 370.0 (from TEST_VECTOR_1)
 * Multiplier: 20×
 * Final: 370.0 × 20 = 7400.0
 */
export const TEST_VECTOR_7_MULTIPLIER_20X: GoldenTestVector = {
  id: 'GTV-007',
  description: 'Multiplier 20×: 370 base × 20 = 7400',
  category: 'multiplier',
  input: {
    stats: createEmptyStats('player-007', 'match-001', {
      runs: 75,
      ballsFaced: 50,
      fours: 8,
      sixes: 3,
      catches: 1,
    }),
    slot: SLOT_20X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 75,
      fourPoints: 80,
      sixPoints: 60,
      strikeRatePoints: 150.0,
      centuryBonus: 0,
      battingSubtotal: 365.0,

      wicketPoints: 0,
      rpoPoints: 0,
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 0,

      catchPoints: 5,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 5,

      manOfTheMatchBonus: 0,

      totalBaseScore: 370.0,
    },
    finalScoreFloat: 7400.0,
    finalScoreRounded: 7400,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 8: MULTIPLIER WITH FRACTIONAL BASE
// =============================================================================

/**
 * Scenario: Test Vector 3 stats with 3× multiplier
 * 
 * Tests that fractional base scores multiply correctly
 * and rounding happens only at the end.
 * 
 * Base score: 1441.70588235294117647 (from TEST_VECTOR_3)
 * Multiplier: 3×
 * Final float: 1441.70588235294117647 × 3 = 4325.11764705882352941
 * Final rounded: 4325
 */
export const TEST_VECTOR_8_MULTIPLIER_FRACTIONAL: GoldenTestVector = {
  id: 'GTV-008',
  description: 'Multiplier 3× with fractional base: 1441.71 × 3 = 4325.12',
  category: 'multiplier',
  input: {
    stats: createEmptyStats('player-008', 'match-001', {
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
    }),
    slot: SLOT_3X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 112,
      fourPoints: 120,
      sixPoints: 80,
      strikeRatePoints: 164.70588235294117647,
      centuryBonus: 200,
      battingSubtotal: 676.70588235294117647,

      wicketPoints: 100,
      rpoPoints: 50,
      fiveWicketBonus: 200,
      hatTrickBonus: 200,
      bowlingSubtotal: 550,

      catchPoints: 10,
      runOutPoints: 5,
      stumpingPoints: 0,
      fieldingSubtotal: 15,

      manOfTheMatchBonus: 200,

      totalBaseScore: 1441.70588235294117647,
    },
    finalScoreFloat: 4325.11764705882352941,
    finalScoreRounded: 4325,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 9: PARTIAL OVER BOWLING
// =============================================================================

/**
 * Scenario: Bowler with partial over (3.4 overs = 22 balls)
 * 
 * Stats:
 * - 3.4 overs bowled (22 balls)
 * - 30 runs conceded
 * - 2 wickets
 * 
 * Calculation:
 * - Overs to balls: 3 × 6 + 4 = 22 balls
 * - Effective overs: 22 / 6 = 3.6666...
 * - RPO: 30 / 3.6666... = 8.18181818...
 * - RPO > 8 → Tier 3 → 25 points
 * 
 * - Wicket points: 2 × 20 = 40
 * - Bowling subtotal: 40 + 25 = 65
 * 
 * Total: 65
 */
export const TEST_VECTOR_9_PARTIAL_OVER: GoldenTestVector = {
  id: 'GTV-009',
  description: 'Partial over: 3.4-0-30-2 (RPO 8.18, Tier 3)',
  category: 'partial-over',
  input: {
    stats: createEmptyStats('player-009', 'match-001', {
      oversBowled: 3.4, // 22 balls
      runsConceded: 30,
      wickets: 2,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 0,
      fourPoints: 0,
      sixPoints: 0,
      strikeRatePoints: 0,
      centuryBonus: 0,
      battingSubtotal: 0,

      wicketPoints: 40,
      rpoPoints: 25, // RPO = 8.18 > 8 → Tier 3
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 65,

      catchPoints: 0,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 0,

      manOfTheMatchBonus: 0,

      totalBaseScore: 65.0,
    },
    finalScoreFloat: 65.0,
    finalScoreRounded: 65,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 10A: RPO TIER 1 BOUNDARY (exactly 6.0)
// =============================================================================

/**
 * Scenario: RPO exactly at Tier 1 threshold (6.0)
 * 
 * Reference: Constitution Section 4.2
 * "RPO ≤ 6: 100 points"
 * 
 * Stats:
 * - 4 overs, 24 runs → RPO = 6.0 exactly
 */
export const TEST_VECTOR_10A_RPO_TIER1_BOUNDARY: GoldenTestVector = {
  id: 'GTV-010A',
  description: 'RPO boundary: exactly 6.0 → Tier 1 (100 pts)',
  category: 'rpo-boundary',
  input: {
    stats: createEmptyStats('player-010a', 'match-001', {
      oversBowled: 4.0,
      runsConceded: 24,
      wickets: 0,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 0,
      fourPoints: 0,
      sixPoints: 0,
      strikeRatePoints: 0,
      centuryBonus: 0,
      battingSubtotal: 0,

      wicketPoints: 0,
      rpoPoints: 100, // RPO = 6.0 ≤ 6 → Tier 1
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 100,

      catchPoints: 0,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 0,

      manOfTheMatchBonus: 0,

      totalBaseScore: 100.0,
    },
    finalScoreFloat: 100.0,
    finalScoreRounded: 100,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 10B: RPO TIER 2 BOUNDARY (exactly 8.0)
// =============================================================================

/**
 * Scenario: RPO exactly at Tier 2 threshold (8.0)
 * 
 * Reference: Constitution Section 4.2
 * "RPO > 6 and ≤ 8: 50 points"
 * 
 * Stats:
 * - 4 overs, 32 runs → RPO = 8.0 exactly
 */
export const TEST_VECTOR_10B_RPO_TIER2_BOUNDARY: GoldenTestVector = {
  id: 'GTV-010B',
  description: 'RPO boundary: exactly 8.0 → Tier 2 (50 pts)',
  category: 'rpo-boundary',
  input: {
    stats: createEmptyStats('player-010b', 'match-001', {
      oversBowled: 4.0,
      runsConceded: 32,
      wickets: 0,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 0,
      fourPoints: 0,
      sixPoints: 0,
      strikeRatePoints: 0,
      centuryBonus: 0,
      battingSubtotal: 0,

      wicketPoints: 0,
      rpoPoints: 50, // RPO = 8.0 ≤ 8 → Tier 2
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 50,

      catchPoints: 0,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 0,

      manOfTheMatchBonus: 0,

      totalBaseScore: 50.0,
    },
    finalScoreFloat: 50.0,
    finalScoreRounded: 50,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 10C: RPO TIER 3 (just above 8.0)
// =============================================================================

/**
 * Scenario: RPO just above Tier 2 threshold (> 8.0)
 * 
 * Reference: Constitution Section 4.2
 * "RPO > 8: 25 points"
 * 
 * Stats:
 * - 4 overs, 33 runs → RPO = 8.25
 */
export const TEST_VECTOR_10C_RPO_TIER3: GoldenTestVector = {
  id: 'GTV-010C',
  description: 'RPO boundary: 8.25 > 8 → Tier 3 (25 pts)',
  category: 'rpo-boundary',
  input: {
    stats: createEmptyStats('player-010c', 'match-001', {
      oversBowled: 4.0,
      runsConceded: 33,
      wickets: 0,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 0,
      fourPoints: 0,
      sixPoints: 0,
      strikeRatePoints: 0,
      centuryBonus: 0,
      battingSubtotal: 0,

      wicketPoints: 0,
      rpoPoints: 25, // RPO = 8.25 > 8 → Tier 3
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 25,

      catchPoints: 0,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 0,

      manOfTheMatchBonus: 0,

      totalBaseScore: 25.0,
    },
    finalScoreFloat: 25.0,
    finalScoreRounded: 25,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 11: DISABLED MULTIPLIER (should default to 1×)
// =============================================================================

/**
 * Scenario: Slot with high multiplier but disabled
 * 
 * Reference: Constitution Section 5.2
 * "Enabled/disabled per match by admin"
 * 
 * When disabled, multiplier should be treated as 1×
 */
export const TEST_VECTOR_11_DISABLED_MULTIPLIER: GoldenTestVector = {
  id: 'GTV-011',
  description: 'Disabled multiplier: 20× slot disabled → 1×',
  category: 'multiplier',
  input: {
    stats: createEmptyStats('player-011', 'match-001', {
      runs: 75,
      ballsFaced: 50,
      fours: 8,
      sixes: 3,
      catches: 1,
    }),
    slot: SLOT_DISABLED,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 75,
      fourPoints: 80,
      sixPoints: 60,
      strikeRatePoints: 150.0,
      centuryBonus: 0,
      battingSubtotal: 365.0,

      wicketPoints: 0,
      rpoPoints: 0,
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 0,

      catchPoints: 5,
      runOutPoints: 0,
      stumpingPoints: 0,
      fieldingSubtotal: 5,

      manOfTheMatchBonus: 0,

      totalBaseScore: 370.0,
    },
    finalScoreFloat: 370.0, // 370 × 1 (disabled)
    finalScoreRounded: 370,
    hasValidParticipation: true,
  },
};

// =============================================================================
// TEST VECTOR 12: FIELDING-ONLY VALID PARTICIPATION
// =============================================================================

/**
 * Scenario: Player valid through fielding only (substitute fielder)
 * 
 * Stats:
 * - 0 balls faced
 * - 0 balls bowled
 * - 1 catch, 1 run-out
 * 
 * Reference: Constitution Section 4.5
 * Fielding actions count as valid participation
 */
export const TEST_VECTOR_12_FIELDING_ONLY: GoldenTestVector = {
  id: 'GTV-012',
  description: 'Fielding-only valid: 1 catch, 1 run-out',
  category: 'worst-case-valid',
  input: {
    stats: createEmptyStats('player-012', 'match-001', {
      catches: 1,
      runOuts: 1,
    }),
    slot: SLOT_1X,
    ruleVersion: GOLDEN_RULE_VERSION,
  },
  expected: {
    baseScoreBreakdown: {
      runPoints: 0,
      fourPoints: 0,
      sixPoints: 0,
      strikeRatePoints: 0,
      centuryBonus: 0,
      battingSubtotal: 0,

      wicketPoints: 0,
      rpoPoints: 0,
      fiveWicketBonus: 0,
      hatTrickBonus: 0,
      bowlingSubtotal: 0,

      catchPoints: 5,
      runOutPoints: 5,
      stumpingPoints: 0,
      fieldingSubtotal: 10,

      manOfTheMatchBonus: 0,

      totalBaseScore: 10.0,
    },
    finalScoreFloat: 10.0,
    finalScoreRounded: 10,
    hasValidParticipation: true,
  },
};

// =============================================================================
// COMPLETE TEST VECTOR COLLECTION
// =============================================================================

/**
 * All golden test vectors for regression testing
 * 
 * USAGE:
 * Import this array and iterate to verify scoring engine correctness.
 * Any deviation from expected values indicates a regression.
 */
export const ALL_GOLDEN_TEST_VECTORS: readonly GoldenTestVector[] = [
  TEST_VECTOR_1_BATTING_ONLY,
  TEST_VECTOR_2_BOWLING_ONLY,
  TEST_VECTOR_3_ALL_ROUNDER,
  TEST_VECTOR_4_INVALID_PARTICIPATION,
  TEST_VECTOR_5_WORST_CASE_VALID,
  TEST_VECTOR_6_HIGH_SR_EDGE,
  TEST_VECTOR_7_MULTIPLIER_20X,
  TEST_VECTOR_8_MULTIPLIER_FRACTIONAL,
  TEST_VECTOR_9_PARTIAL_OVER,
  TEST_VECTOR_10A_RPO_TIER1_BOUNDARY,
  TEST_VECTOR_10B_RPO_TIER2_BOUNDARY,
  TEST_VECTOR_10C_RPO_TIER3,
  TEST_VECTOR_11_DISABLED_MULTIPLIER,
  TEST_VECTOR_12_FIELDING_ONLY,
] as const;

/**
 * Summary of test coverage
 */
export const TEST_COVERAGE_SUMMARY = {
  totalVectors: ALL_GOLDEN_TEST_VECTORS.length,
  categories: {
    'batting-only': 1,
    'bowling-only': 1,
    'all-rounder': 1,
    'invalid-participation': 1,
    'worst-case-valid': 2,
    'high-sr-edge': 1,
    'multiplier': 3,
    'partial-over': 1,
    'rpo-boundary': 3,
  },
  constitutionSectionsCovered: [
    '4.1 (Batting)',
    '4.2 (Bowling)',
    '4.3 (Fielding)',
    '4.4 (Man of the Match)',
    '4.5 (Validity Rule)',
    '5.1-5.3 (Multipliers)',
  ],
} as const;
