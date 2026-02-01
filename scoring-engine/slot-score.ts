/**
 * IPL Friends Betting Game — Slot Score Application
 * 
 * Authority: Constitution.md v1.0, Section 5 (Multipliers)
 * 
 * CRITICAL CONSTRAINTS:
 * - Slot multipliers are ADMIN-CONFIGURED per match (Section 5.2)
 * - Multipliers are NOT hardcoded constants
 * - Player scores can NEVER be negative
 * - Rounding happens only at final team aggregation, NOT here
 * - This function is PURE (no side effects, no external state)
 * 
 * MULTIPLIER APPLICATION SCOPE (Section 5.3):
 * - Multipliers apply ONLY to player points and runner points
 * - They do NOT apply to match-level bets or side bets
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for slot score computation
 * Both values are provided at runtime; neither is hardcoded
 */
export interface SlotScoreInput {
  /** 
   * The player's final score (post base scoring, pre-multiplier)
   * This value comes from computeFinalPlayerScore() in scoring.ts
   * It may be a float due to Strike Rate points
   */
  readonly playerFinalScore: number;

  /**
   * The multiplier for this slot, admin-configured per match
   * Constitution Section 5.2: "Slot-based (e.g., Slot 1 = 20×, Slot 11 = 3×)"
   * These examples are ILLUSTRATIVE ONLY; actual values vary by match
   * Assumed to be validated upstream (positive number)
   */
  readonly slotMultiplier: number;
}

/**
 * Output of slot score computation
 */
export interface SlotScoreResult {
  /** Original player score before multiplication */
  readonly inputScore: number;

  /** Multiplier applied */
  readonly multiplier: number;

  /** 
   * Final slot score after multiplication
   * Guaranteed non-negative
   * NOT rounded (rounding happens at team aggregation)
   */
  readonly slotScore: number;
}

// =============================================================================
// PURE FUNCTION: SLOT SCORE APPLICATION
// =============================================================================

/**
 * Apply slot multiplier to a player's final score
 * 
 * Reference: Constitution Section 5 (Multipliers)
 * - Section 5.1: "Multipliers introduce intentional randomness and volatility"
 * - Section 5.2: Multipliers are admin-configured per match
 * - Section 5.3: Apply only to player points and runner points
 * 
 * NON-NEGATIVITY GUARANTEE:
 * Player scores can never be negative per Constitution Section 4.
 * This function enforces max(0, result) as a safety invariant.
 * 
 * ROUNDING POLICY:
 * NO rounding is performed here. Rounding occurs only at final
 * team aggregation to preserve precision through intermediate calculations.
 * 
 * @param playerFinalScore - The player's computed score (may be float)
 * @param slotMultiplier - Admin-configured multiplier for this slot
 * @returns The multiplied score, guaranteed non-negative, not rounded
 */
export function computeSlotScore(
  playerFinalScore: number,
  slotMultiplier: number
): number {
  // Multiply player score by slot multiplier
  const rawResult = playerFinalScore * slotMultiplier;

  // Enforce non-negativity invariant
  // Player scores should never be negative, but this provides a safety guarantee
  return Math.max(0, rawResult);
}

/**
 * Apply slot multiplier with full input/output structure
 * Provides complete audit trail of the computation
 * 
 * @param input - SlotScoreInput containing player score and multiplier
 * @returns SlotScoreResult with full breakdown
 */
export function computeSlotScoreWithDetails(
  input: SlotScoreInput
): SlotScoreResult {
  const slotScore = computeSlotScore(input.playerFinalScore, input.slotMultiplier);

  return {
    inputScore: input.playerFinalScore,
    multiplier: input.slotMultiplier,
    slotScore,
  };
}

// =============================================================================
// BATCH PROCESSING HELPER
// =============================================================================

/**
 * Entry for batch slot score computation
 */
export interface SlotScoreBatchEntry {
  readonly playerId: string;
  readonly playerFinalScore: number;
  readonly slotMultiplier: number;
}

/**
 * Result of batch slot score computation
 */
export interface SlotScoreBatchResult {
  readonly playerId: string;
  readonly inputScore: number;
  readonly multiplier: number;
  readonly slotScore: number;
}

/**
 * Compute slot scores for multiple players
 * 
 * NOTE: This does NOT aggregate scores across players.
 * It returns individual slot scores for each player.
 * Aggregation is handled separately at team level.
 * 
 * @param entries - Array of player scores and their slot multipliers
 * @returns Array of individual slot score results
 */
export function computeSlotScoresBatch(
  entries: readonly SlotScoreBatchEntry[]
): SlotScoreBatchResult[] {
  return entries.map(entry => ({
    playerId: entry.playerId,
    inputScore: entry.playerFinalScore,
    multiplier: entry.slotMultiplier,
    slotScore: computeSlotScore(entry.playerFinalScore, entry.slotMultiplier),
  }));
}
