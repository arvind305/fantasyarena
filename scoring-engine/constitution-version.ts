/**
 * IPL Friends Betting Game — Constitution Version Lock
 * 
 * Authority: Constitution.md v1.0
 * 
 * PURPOSE:
 * This module defines the canonical Constitution version that governs
 * all scoring logic. Every scoring output must reference this version
 * to ensure auditability and determinism.
 * 
 * GOVERNANCE:
 * - CONSTITUTION_VERSION is manually controlled
 * - Changes require explicit versioning in Constitution.md
 * - All scoring outputs must include constitutionVersion
 * - This is a governance mechanism, not a scoring mechanism
 * 
 * IMMUTABILITY:
 * This version string must match Constitution.md Section 15.1:
 * "This document is final unless explicitly versioned"
 */

// =============================================================================
// CONSTITUTION VERSION (MANUALLY CONTROLLED)
// =============================================================================

/**
 * The canonical Constitution version governing this codebase.
 * 
 * FORMAT: Semantic versioning (MAJOR.MINOR.PATCH)
 * - MAJOR: Breaking changes to scoring rules
 * - MINOR: Additive changes (new bet types, etc.)
 * - PATCH: Clarifications, typo fixes
 * 
 * CHANGE PROTOCOL:
 * 1. Update Constitution.md with new version
 * 2. Update this constant to match
 * 3. Update golden tests if scoring changes
 * 4. All three must stay in sync
 */
export const CONSTITUTION_VERSION = '1.0.0' as const;

/**
 * Type for the Constitution version string
 */
export type ConstitutionVersion = typeof CONSTITUTION_VERSION;

// =============================================================================
// VERSION METADATA
// =============================================================================

/**
 * Metadata about the Constitution version
 */
export interface ConstitutionVersionInfo {
  /** The version string */
  readonly version: ConstitutionVersion;
  /** Human-readable description */
  readonly description: string;
  /** Date this version was locked */
  readonly lockedAt: string;
  /** Reference to the source document */
  readonly sourceDocument: string;
}

/**
 * Complete metadata for the current Constitution version
 */
export const CONSTITUTION_VERSION_INFO: ConstitutionVersionInfo = {
  version: CONSTITUTION_VERSION,
  description: 'IPL Friends Betting Game Constitution - Foundational Version',
  lockedAt: '2025-01-01',
  sourceDocument: 'Constitution.md',
} as const;

// =============================================================================
// VERSION STAMP FOR OUTPUTS
// =============================================================================

/**
 * Interface for objects that include Constitution version stamp
 */
export interface ConstitutionStamped {
  readonly constitutionVersion: ConstitutionVersion;
}

/**
 * Create a Constitution version stamp
 * Use this to stamp any output that depends on Constitution rules
 */
export function createConstitutionStamp(): ConstitutionStamped {
  return {
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

/**
 * Verify that an object has a valid Constitution stamp
 */
export function hasValidConstitutionStamp(obj: unknown): obj is ConstitutionStamped {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'constitutionVersion' in obj &&
    (obj as ConstitutionStamped).constitutionVersion === CONSTITUTION_VERSION
  );
}

/**
 * Assert that the Constitution version matches expected
 * Throws if versions don't match (useful for validation)
 */
export function assertConstitutionVersion(expected: string): void {
  if (CONSTITUTION_VERSION !== expected) {
    throw new Error(
      `Constitution version mismatch: expected ${expected}, got ${CONSTITUTION_VERSION}`
    );
  }
}
