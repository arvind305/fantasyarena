/**
 * IPL Friends Betting Game — Scoring Engine (Pure Functions)
 * 
 * Authority: Constitution.md v1.0
 * 
 * CRITICAL CONSTRAINTS:
 * - All functions are PURE (no side effects, no external dependencies)
 * - Base scoring is IMMUTABLE (Section 11: Admin may NOT change base stat points)
 * - Only multipliers scale the result (Section 5.3)
 * - Version safety: All calculations require an explicit RuleVersion
 * 
 * ROUNDING POLICY (per clarification):
 * - Base scores use exact float values (e.g., SR 150.75 = 150.75 points)
 * - Rounding to nearest integer happens ONLY at final persistence/display
 */

import type {
  PlayerMatchStats,
  RuleVersion,
  ScoringRules,
  Slot,
} from './models';

// =============================================================================
// SCORE RESULT TYPES
// =============================================================================

/**
 * Breakdown of a player's base score before multiplier
 * Used for transparency and audit (Section 15.2)
 */
export interface BaseScoreBreakdown {
  // Batting components
  readonly runPoints: number;
  readonly fourPoints: number;
  readonly sixPoints: number;
  readonly strikeRatePoints: number;
  readonly centuryBonus: number;
  readonly battingSubtotal: number;

  // Bowling components
  readonly wicketPoints: number;
  readonly rpoPoints: number;
  readonly fiveWicketBonus: number;
  readonly hatTrickBonus: number;
  readonly bowlingSubtotal: number;

  // Fielding components
  readonly catchPoints: number;
  readonly runOutPoints: number;
  readonly stumpingPoints: number;
  readonly fieldingSubtotal: number;

  // Awards
  readonly manOfTheMatchBonus: number;

  // Total (float, not rounded)
  readonly totalBaseScore: number;
}

/**
 * Final score result after multiplier application
 */
export interface FinalScoreResult {
  readonly baseScoreBreakdown: BaseScoreBreakdown;
  readonly multiplier: number;
  readonly finalScoreFloat: number;    // Exact value
  readonly finalScoreRounded: number;  // For display/persistence
}

// =============================================================================
// HELPER FUNCTIONS (PURE)
// =============================================================================

/**
 * Convert overs in decimal format (e.g., 3.4 = 3 overs 4 balls) to total balls
 * This is necessary for accurate RPO calculation
 */
function oversToBalls(overs: number): number {
  const completeOvers = Math.floor(overs);
  const additionalBalls = Math.round((overs - completeOvers) * 10);
  return (completeOvers * 6) + additionalBalls;
}

/**
 * Calculate runs per over from overs (decimal format) and runs conceded
 * Returns null if no balls bowled (to avoid division by zero)
 */
function calculateRPO(oversBowled: number, runsConceded: number): number | null {
  const totalBalls = oversToBalls(oversBowled);
  if (totalBalls === 0) {
    return null;
  }
  const totalOvers = totalBalls / 6;
  return runsConceded / totalOvers;
}

/**
 * Calculate strike rate from runs and balls faced
 * Reference: Constitution Section 4.1 — "SR points = SR value"
 * 
 * Clarification locked: Returns exact float (e.g., 150.75)
 * Returns null if no balls faced
 */
function calculateStrikeRate(runs: number, ballsFaced: number): number | null {
  if (ballsFaced === 0) {
    return null;
  }
  return (runs / ballsFaced) * 100;
}

/**
 * Determine RPO points based on tiered thresholds
 * Reference: Constitution Section 4.2
 * 
 * - RPO ≤ 6: 100 points
 * - RPO > 6 and ≤ 8: 50 points
 * - RPO > 8: 25 points
 */
function getRPOPoints(rpo: number, rules: ScoringRules): number {
  if (rpo <= rules.rpoTier1Threshold) {
    return rules.rpoTier1Points;
  }
  if (rpo <= rules.rpoTier2Threshold) {
    return rules.rpoTier2Points;
  }
  return rules.rpoTier3Points;
}

// =============================================================================
// CORE SCORING FUNCTIONS (PURE)
// =============================================================================

/**
 * Compute base player score from match stats
 * Reference: Constitution Section 4 (Player Scoring Grid)
 * 
 * IMMUTABILITY GUARANTEE:
 * - This function uses ONLY the rules defined in the provided RuleVersion
 * - Base scoring coefficients are immutable (Section 11)
 * - No admin action can modify these calculations post-lock
 * 
 * VALIDITY RULE (Section 4.5):
 * - Even 1 ball faced or bowled is valid for scoring
 * - Strike rate/RPO only calculated if player participated in that discipline
 * 
 * @param stats - Player's match statistics (immutable input)
 * @param ruleVersion - The rule version to use for scoring (version safety)
 * @returns Complete breakdown of base score (float, not rounded)
 */
export function computeBasePlayerScore(
  stats: PlayerMatchStats,
  ruleVersion: RuleVersion
): BaseScoreBreakdown {
  const rules = ruleVersion.scoringRules;

  // -------------------------------------------------------------------------
  // BATTING SCORE (Section 4.1)
  // -------------------------------------------------------------------------
  
  // Runs: 1 point per run
  const runPoints = stats.runs * rules.pointsPerRun;

  // Fours: 10 points each
  const fourPoints = stats.fours * rules.pointsPerFour;

  // Sixes: 20 points each
  const sixPoints = stats.sixes * rules.pointsPerSix;

  // Strike Rate: SR points = SR value (float)
  // Only applicable if player faced at least 1 ball (Section 4.5)
  const strikeRate = calculateStrikeRate(stats.runs, stats.ballsFaced);
  const strikeRatePoints = strikeRate ?? 0;

  // Century Bonus: +200 for 100+ runs
  const centuryBonus = stats.runs >= rules.centuryThreshold 
    ? rules.centuryBonus 
    : 0;

  const battingSubtotal = runPoints + fourPoints + sixPoints + strikeRatePoints + centuryBonus;

  // -------------------------------------------------------------------------
  // BOWLING SCORE (Section 4.2)
  // -------------------------------------------------------------------------

  // Wickets: 20 points each
  const wicketPoints = stats.wickets * rules.pointsPerWicket;

  // RPO-based points: Only if player bowled at least 1 ball (Section 4.5)
  const totalBallsBowled = oversToBalls(stats.oversBowled);
  let rpoPoints = 0;
  if (totalBallsBowled > 0) {
    const rpo = calculateRPO(stats.oversBowled, stats.runsConceded);
    if (rpo !== null) {
      rpoPoints = getRPOPoints(rpo, rules);
    }
  }

  // Five-wicket haul: +200 bonus
  const fiveWicketBonus = stats.wickets >= rules.fiveWicketHaulThreshold
    ? rules.fiveWicketHaulBonus
    : 0;

  // Hat-trick: +200 bonus
  const hatTrickBonus = stats.hasTakenHatTrick 
    ? rules.hatTrickBonus 
    : 0;

  const bowlingSubtotal = wicketPoints + rpoPoints + fiveWicketBonus + hatTrickBonus;

  // -------------------------------------------------------------------------
  // FIELDING SCORE (Section 4.3)
  // -------------------------------------------------------------------------

  // Catches: 5 points each
  const catchPoints = stats.catches * rules.pointsPerCatch;

  // Run-outs: 5 points each (each fielder involvement counts)
  const runOutPoints = stats.runOuts * rules.pointsPerRunOut;

  // Stumpings: 5 points each
  const stumpingPoints = stats.stumpings * rules.pointsPerStumping;

  const fieldingSubtotal = catchPoints + runOutPoints + stumpingPoints;

  // -------------------------------------------------------------------------
  // MAN OF THE MATCH (Section 4.4)
  // -------------------------------------------------------------------------

  const manOfTheMatchBonus = stats.isManOfTheMatch 
    ? rules.manOfTheMatchBonus 
    : 0;

  // -------------------------------------------------------------------------
  // TOTAL BASE SCORE
  // -------------------------------------------------------------------------

  const totalBaseScore = battingSubtotal + bowlingSubtotal + fieldingSubtotal + manOfTheMatchBonus;

  return {
    runPoints,
    fourPoints,
    sixPoints,
    strikeRatePoints,
    centuryBonus,
    battingSubtotal,

    wicketPoints,
    rpoPoints,
    fiveWicketBonus,
    hatTrickBonus,
    bowlingSubtotal,

    catchPoints,
    runOutPoints,
    stumpingPoints,
    fieldingSubtotal,

    manOfTheMatchBonus,

    totalBaseScore,
  };
}

/**
 * Apply slot multiplier to a base score
 * Reference: Constitution Section 5 (Multipliers)
 * 
 * MULTIPLIER-ONLY SCALING:
 * - Multipliers are the ONLY mechanism that scales player scores
 * - Base scoring coefficients are IMMUTABLE (Section 11)
 * - Multipliers apply ONLY to player points and runner points (Section 5.3)
 * - Multipliers do NOT apply to match-level bets or side bets
 * 
 * @param baseScore - The base score (float) before multiplication
 * @param multiplier - The slot multiplier (e.g., 20 for Slot 1)
 * @returns Multiplied score (float, not rounded)
 */
export function applySlotMultiplier(baseScore: number, multiplier: number): number {
  // Pure multiplication — no rounding at this stage
  return baseScore * multiplier;
}

/**
 * Compute final player score including multiplier
 * Reference: Constitution Sections 4, 5
 * 
 * VERSION SAFETY:
 * - This function explicitly requires a RuleVersion parameter
 * - Ensures all scoring is deterministic and auditable (Section 15.2)
 * - The same inputs will ALWAYS produce the same outputs
 * 
 * @param stats - Player's match statistics
 * @param slot - The slot assignment (contains multiplier)
 * @param ruleVersion - The rule version to use for base scoring
 * @returns Complete score result with breakdown, float, and rounded values
 */
export function computeFinalPlayerScore(
  stats: PlayerMatchStats,
  slot: Slot,
  ruleVersion: RuleVersion
): FinalScoreResult {
  // Step 1: Compute base score using immutable rules
  const baseScoreBreakdown = computeBasePlayerScore(stats, ruleVersion);

  // Step 2: Determine effective multiplier
  // If multipliers are disabled for the slot, treat as 1x
  const multiplier = slot.isEnabled ? slot.multiplier : 1;

  // Step 3: Apply multiplier (Section 5.3 — only scales player points)
  const finalScoreFloat = applySlotMultiplier(
    baseScoreBreakdown.totalBaseScore,
    multiplier
  );

  // Step 4: Round for display/persistence (per clarification)
  const finalScoreRounded = Math.round(finalScoreFloat);

  return {
    baseScoreBreakdown,
    multiplier,
    finalScoreFloat,
    finalScoreRounded,
  };
}

// =============================================================================
// VALIDATION HELPERS (PURE)
// =============================================================================

/**
 * Check if player has valid participation for scoring
 * Reference: Constitution Section 4.5 — "Even 1 ball faced or bowled is valid"
 * 
 * A player is valid for scoring if they:
 * - Faced at least 1 ball, OR
 * - Bowled at least 1 ball, OR
 * - Took a catch/run-out/stumping, OR
 * - Were awarded Man of the Match
 */
export function hasValidParticipation(stats: PlayerMatchStats): boolean {
  return (
    stats.ballsFaced > 0 ||
    oversToBalls(stats.oversBowled) > 0 ||
    stats.catches > 0 ||
    stats.runOuts > 0 ||
    stats.stumpings > 0 ||
    stats.isManOfTheMatch
  );
}
