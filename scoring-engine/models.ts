/**
 * IPL Friends Betting Game — Core Domain Models
 * 
 * Authority: Constitution.md v1.0
 * 
 * These types define the foundational data structures for the game.
 * All scoring logic references these immutable type definitions.
 */

// =============================================================================
// PLAYER & MATCH ENTITIES
// =============================================================================

/**
 * Unique identifier types for type safety
 */
export type PlayerId = string;
export type MatchId = string;
export type UserId = string;
export type RuleVersionId = string;
export type SlotId = number;

/**
 * Match entity
 * Reference: Constitution Section 2 (Match-Level Betting Components)
 */
export interface Match {
  readonly id: MatchId;
  readonly teamA: string;
  readonly teamB: string;
  readonly scheduledTime: Date;
  readonly isAbandoned: boolean; // Section 3.3: Abandoned matches are not scored at all
  readonly isLocked: boolean;    // Section 9.2: Locks atomically at first ball
  readonly includesSuperOver: boolean;
}

/**
 * Player entity (IPL cricketer)
 */
export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly team: string;
}

/**
 * Player match statistics
 * Reference: Constitution Section 4 (Player Scoring Grid)
 *
 * All stats are raw values from official data sources.
 * Section 4.5 Validity Rule: Even 1 ball faced or bowled is valid for scoring.
 */
export interface PlayerMatchStats {
  readonly playerId: PlayerId;
  readonly matchId: MatchId;

  // Batting stats (Section 4.1)
  readonly runs: number;
  readonly ballsFaced: number;
  readonly fours: number;
  readonly sixes: number;
  readonly strikeRate: number;       // Calculated: (runs / ballsFaced) * 100, rounded

  // Bowling stats (Section 4.2)
  readonly wickets: number;
  readonly oversBowled: number;      // Decimal format: 3.4 = 3 overs 4 balls
  readonly runsConceded: number;
  readonly economyRate: number;      // Calculated: runsConceded / overs bowled
  readonly hasTakenHatTrick: boolean;

  // Fielding stats (Section 4.3)
  readonly catches: number;
  readonly runOuts: number;          // Each fielder involvement counts separately
  readonly stumpings: number;

  // Awards (Section 4.4)
  readonly isManOfTheMatch: boolean;
}

// =============================================================================
// SLOT & MULTIPLIER STRUCTURES
// =============================================================================

/**
 * Slot definition for player picks
 * Reference: Constitution Section 5 (Multipliers)
 * 
 * CRITICAL: Multipliers apply ONLY to player points and runner points.
 * They do NOT apply to match-level bets or side bets (Section 5.3).
 * 
 * Base scoring is IMMUTABLE — only multipliers scale the final result.
 */
export interface Slot {
  readonly slotNumber: SlotId;       // e.g., 1-11
  readonly multiplier: number;       // e.g., 20 for Slot 1, 3 for Slot 11
  readonly isEnabled: boolean;       // Section 5.2: Admin can enable/disable per match
}

/**
 * Slot configuration for a match
 * Reference: Constitution Section 5.2
 */
export interface MatchSlotConfig {
  readonly matchId: MatchId;
  readonly multipliersEnabled: boolean;
  readonly slots: readonly Slot[];
}

// =============================================================================
// BET STRUCTURES
// =============================================================================

/**
 * A single player pick within a bet
 * Reference: Constitution Section 2.3
 * 
 * One player may occupy only one slot per match.
 */
export interface PlayerPick {
  readonly playerId: PlayerId;
  readonly slotNumber: SlotId;
}

/**
 * Runner pick
 * Reference: Constitution Section 6 (Runners)
 * 
 * Runner must place a bet to contribute (Section 6.2).
 * Only X% of runner score is added (Section 6.3).
 */
export interface RunnerPick {
  readonly runnerUserId: UserId;
}

/**
 * Match result prediction
 * Reference: Constitution Section 2.1
 */
export type MatchResultPrediction = 'TEAM_A' | 'TEAM_B' | 'SUPER_OVER';

/**
 * Side bet answer
 * Reference: Constitution Section 2.5, Section 7
 */
export interface SideBetAnswer {
  readonly sideBetId: string;
  readonly selectedOption: string;
}

/**
 * Complete user bet for a match
 * Reference: Constitution Section 2 (all subsections)
 * 
 * Section 10: Incomplete bets allowed with warning. No auto-fills.
 * Section 10: No duplicate players or runners.
 */
export interface Bet {
  readonly id: string;
  readonly userId: UserId;
  readonly matchId: MatchId;
  readonly ruleVersionId: RuleVersionId;
  readonly submittedAt: Date;
  readonly isLocked: boolean;        // Section 9.2: Locks at first ball

  // Section 2.1: Match Result Bet
  readonly matchResultPrediction: MatchResultPrediction | null;

  // Section 2.2: Total Runs Prediction
  readonly totalRunsPrediction: number | null;

  // Section 2.3: Player Picks (0 to N, admin-defined)
  readonly playerPicks: readonly PlayerPick[];

  // Section 2.4: Runner Picks (0 to R, admin-defined)
  readonly runnerPicks: readonly RunnerPick[];

  // Section 2.5: Side Bets
  readonly sideBetAnswers: readonly SideBetAnswer[];
}

// =============================================================================
// RULE VERSION (IMMUTABLE)
// =============================================================================

/**
 * Scoring rule coefficients
 * Reference: Constitution Section 4 (Player Scoring Grid)
 *
 * CRITICAL CONSTRAINT (Section 11):
 * - Admin may NOT change base stat points
 * - These values are IMMUTABLE once a rule version is created
 * - Version safety: all scoring calculations MUST reference a specific RuleVersion
 */
export interface ScoringRules {
  // Batting (Section 4.1)
  readonly pointsPerRun: number;           // Constitution: 1
  readonly pointsPerFour: number;          // Constitution: 10
  readonly pointsPerSix: number;           // Constitution: 20
  readonly strikeRateMultiplier: number;   // Constitution: 1 (SR directly converts to points, rounded)
  readonly centuryBonus: number;           // Constitution: 200 (for 100+ runs)
  readonly centuryThreshold: number;       // Constitution: 100

  // Bowling (Section 4.2)
  readonly pointsPerWicket: number;        // Constitution: 20
  readonly economyTier1Threshold: number;  // Constitution: 6 (Economy ≤ 6)
  readonly economyTier1Points: number;     // Constitution: 100
  readonly economyTier2Threshold: number;  // Constitution: 8 (Economy > 6 and ≤ 8)
  readonly economyTier2Points: number;     // Constitution: 50
  readonly economyTier3Threshold: number;  // Constitution: 10 (Economy > 8 and ≤ 10)
  readonly economyTier3Points: number;     // Constitution: 25
  readonly economyTier4Points: number;     // Constitution: 0 (Economy > 10)
  readonly fiveWicketHaulBonus: number;    // Constitution: 200
  readonly fiveWicketHaulThreshold: number;// Constitution: 5
  readonly hatTrickBonus: number;          // Constitution: 200

  // Fielding (Section 4.3)
  readonly pointsPerCatch: number;         // Constitution: 5
  readonly pointsPerRunOut: number;        // Constitution: 5
  readonly pointsPerStumping: number;      // Constitution: 5

  // Awards (Section 4.4)
  readonly manOfTheMatchBonus: number;     // Constitution: 200
}

/**
 * Immutable rule version
 * Reference: Constitution Section 15.1 (Authority)
 * 
 * VERSION SAFETY:
 * - Each RuleVersion is immutable once created
 * - All scoring calculations MUST specify which RuleVersion to use
 * - This ensures auditability and determinism (Section 15.2)
 */
export interface RuleVersion {
  readonly id: RuleVersionId;
  readonly version: string;              // Semantic version, e.g., "1.0.0"
  readonly createdAt: Date;
  readonly isActive: boolean;
  readonly scoringRules: ScoringRules;
}

// =============================================================================
// CANONICAL RULE VERSION (Constitution v1.0)
// =============================================================================

/**
 * The canonical scoring rules as defined in Constitution.md Section 4
 *
 * This is the SINGLE SOURCE OF TRUTH for base scoring.
 * Admin CANNOT modify these values (Section 11).
 */
export const CONSTITUTION_V1_SCORING_RULES: ScoringRules = {
  // Batting (Section 4.1)
  pointsPerRun: 1,
  pointsPerFour: 10,
  pointsPerSix: 20,
  strikeRateMultiplier: 1,          // SR 150 = 150 points (rounded)
  centuryBonus: 200,
  centuryThreshold: 100,

  // Bowling (Section 4.2)
  pointsPerWicket: 20,
  economyTier1Threshold: 6,         // Economy ≤ 6
  economyTier1Points: 100,
  economyTier2Threshold: 8,         // Economy > 6 and ≤ 8
  economyTier2Points: 50,
  economyTier3Threshold: 10,        // Economy > 8 and ≤ 10
  economyTier3Points: 25,
  economyTier4Points: 0,            // Economy > 10
  fiveWicketHaulBonus: 200,
  fiveWicketHaulThreshold: 5,
  hatTrickBonus: 200,

  // Fielding (Section 4.3)
  pointsPerCatch: 5,
  pointsPerRunOut: 5,
  pointsPerStumping: 5,

  // Awards (Section 4.4)
  manOfTheMatchBonus: 200,
} as const;
