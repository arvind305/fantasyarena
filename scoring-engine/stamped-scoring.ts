/**
 * IPL Friends Betting Game — Stamped Scoring Outputs
 * 
 * Authority: Constitution.md v1.0
 * 
 * PURPOSE:
 * This module provides Constitution-stamped versions of scoring outputs.
 * Every final scoring result includes the Constitution version for audit.
 * 
 * GOVERNANCE (Section 15.2):
 * - All scoring outputs must be traceable to a Constitution version
 * - This ensures auditability and determinism
 * - The stamp is governance-only; it does NOT affect scoring logic
 */

import {
  CONSTITUTION_VERSION,
  type ConstitutionVersion,
  type ConstitutionStamped,
} from './constitution-version';

import {
  computeBasePlayerScore,
  computeFinalPlayerScore,
  type BaseScoreBreakdown,
  type FinalScoreResult,
} from './scoring';

import { computeSlotScore } from './slot-score';

import type {
  PlayerMatchStats,
  RuleVersion,
  Slot,
} from './models';

// =============================================================================
// STAMPED OUTPUT TYPES
// =============================================================================

/**
 * Base score breakdown with Constitution stamp
 */
export interface StampedBaseScoreBreakdown extends BaseScoreBreakdown, ConstitutionStamped {}

/**
 * Final score result with Constitution stamp
 */
export interface StampedFinalScoreResult extends FinalScoreResult, ConstitutionStamped {}

/**
 * Slot score result with Constitution stamp
 */
export interface StampedSlotScoreResult extends ConstitutionStamped {
  readonly inputScore: number;
  readonly multiplier: number;
  readonly slotScore: number;
}

/**
 * Complete player scoring result with all details and Constitution stamp
 */
export interface StampedPlayerScoringResult extends ConstitutionStamped {
  readonly playerId: string;
  readonly matchId: string;
  readonly baseScoreBreakdown: BaseScoreBreakdown;
  readonly multiplier: number;
  readonly finalScoreFloat: number;
  readonly finalScoreRounded: number;
  readonly slotScore: number;
  readonly slotScoreRounded: number;
}

// =============================================================================
// STAMPED SCORING FUNCTIONS
// =============================================================================

/**
 * Compute base player score with Constitution stamp
 * 
 * This is a wrapper around computeBasePlayerScore that adds
 * the Constitution version to the output for audit purposes.
 * 
 * IMPORTANT: This does NOT modify scoring logic.
 */
export function computeStampedBasePlayerScore(
  stats: PlayerMatchStats,
  ruleVersion: RuleVersion
): StampedBaseScoreBreakdown {
  const breakdown = computeBasePlayerScore(stats, ruleVersion);
  
  return {
    ...breakdown,
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

/**
 * Compute final player score with Constitution stamp
 * 
 * This is a wrapper around computeFinalPlayerScore that adds
 * the Constitution version to the output for audit purposes.
 * 
 * IMPORTANT: This does NOT modify scoring logic.
 */
export function computeStampedFinalPlayerScore(
  stats: PlayerMatchStats,
  slot: Slot,
  ruleVersion: RuleVersion
): StampedFinalScoreResult {
  const result = computeFinalPlayerScore(stats, slot, ruleVersion);
  
  return {
    ...result,
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

/**
 * Compute slot score with Constitution stamp
 * 
 * IMPORTANT: This does NOT modify scoring logic.
 */
export function computeStampedSlotScore(
  playerFinalScore: number,
  slotMultiplier: number
): StampedSlotScoreResult {
  const slotScore = computeSlotScore(playerFinalScore, slotMultiplier);
  
  return {
    inputScore: playerFinalScore,
    multiplier: slotMultiplier,
    slotScore,
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

/**
 * Compute complete player scoring result with Constitution stamp
 * 
 * This is the comprehensive scoring function that produces a fully
 * stamped result suitable for persistence and audit.
 * 
 * IMPORTANT: This does NOT modify scoring logic.
 */
export function computeStampedPlayerScoringResult(
  stats: PlayerMatchStats,
  slot: Slot,
  slotMultiplier: number,
  ruleVersion: RuleVersion
): StampedPlayerScoringResult {
  // Compute base score
  const baseScoreBreakdown = computeBasePlayerScore(stats, ruleVersion);
  
  // Compute final score with slot enabled/disabled handling
  const multiplier = slot.isEnabled ? slot.multiplier : 1;
  const finalScoreFloat = baseScoreBreakdown.totalBaseScore * multiplier;
  const finalScoreRounded = Math.round(finalScoreFloat);
  
  // Compute slot score
  const slotScore = computeSlotScore(baseScoreBreakdown.totalBaseScore, slotMultiplier);
  const slotScoreRounded = Math.round(slotScore);
  
  return {
    playerId: stats.playerId,
    matchId: stats.matchId,
    baseScoreBreakdown,
    multiplier,
    finalScoreFloat,
    finalScoreRounded,
    slotScore,
    slotScoreRounded,
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

// =============================================================================
// VERSION ASSERTION HELPERS
// =============================================================================

/**
 * Assert that a stamped result matches the current Constitution version
 */
export function assertStampedResultVersion<T extends ConstitutionStamped>(
  result: T,
  context?: string
): void {
  if (result.constitutionVersion !== CONSTITUTION_VERSION) {
    const prefix = context ? `[${context}] ` : '';
    throw new Error(
      `${prefix}Constitution version mismatch in result: expected ${CONSTITUTION_VERSION}, got ${result.constitutionVersion}`
    );
  }
}

/**
 * Check if a stamped result matches the current Constitution version
 */
export function isCurrentConstitutionVersion<T extends ConstitutionStamped>(
  result: T
): boolean {
  return result.constitutionVersion === CONSTITUTION_VERSION;
}
