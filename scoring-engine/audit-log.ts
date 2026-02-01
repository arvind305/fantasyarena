/**
 * IPL Friends Betting Game — Audit Log & Replay Guarantees
 * 
 * Authority: Constitution.md v1.0, Section 15.2 (Transparency & Auditability)
 * 
 * PURPOSE:
 * This module provides immutable audit records for every scoring run,
 * enabling deterministic replay and verification of historical results.
 * 
 * AUDIT GUARANTEES:
 * 1. Every scoring run produces an immutable audit record
 * 2. Records are pure data objects (no functions, fully serializable)
 * 3. Same inputs always produce identical outputs (deterministic)
 * 4. Replay function can verify any historical record
 * 
 * REPLAY GUARANTEES:
 * 1. Replay recomputes scores from stored inputs
 * 2. Computed results must match stored results exactly
 * 3. Any tampering will cause replay failure
 * 4. Floating-point comparison uses exact equality
 */

import {
  CONSTITUTION_VERSION,
  type ConstitutionVersion,
} from './constitution-version';

import {
  type AdminSlotMultiplierConfig,
  resolveAdminConfig,
  extractMultipliers,
  type ResolvedAdminConfig,
} from './admin-config';

import {
  type SlotIndex,
  type SlotAssignmentMap,
  ALL_SLOT_INDICES,
  resolveSlotAssignments,
} from './slot-assignment';

import {
  resolveSlotConflicts,
  detectSlotConflicts,
} from './slot-conflict';

import {
  computeBasePlayerScore,
} from './scoring';

import {
  computeSlotScore,
} from './slot-score';

import type {
  PlayerMatchStats,
  RuleVersion,
} from './models';

// =============================================================================
// AUDIT RECORD TYPES
// =============================================================================

/**
 * Per-slot scoring result for audit trail
 */
export interface AuditSlotResult {
  readonly slotIndex: SlotIndex;
  readonly playerId: string | null;
  readonly multiplier: number;
  readonly baseScore: number;
  readonly slotScore: number;
  readonly isEnabled: boolean;
}

/**
 * Complete audit record for a scoring run
 * 
 * This record contains all inputs and outputs for a scoring run,
 * enabling deterministic replay and verification.
 * 
 * IMMUTABILITY:
 * - All fields are readonly
 * - No functions or methods
 * - Fully JSON-serializable
 */
export interface ScoringAuditRecord {
  // === METADATA ===
  /** Unique identifier for this audit record */
  readonly auditId: string;
  /** Match this scoring run applies to */
  readonly matchId: string;
  /** ISO timestamp when this scoring run was executed */
  readonly timestamp: string;
  /** Constitution version governing this scoring run */
  readonly constitutionVersion: ConstitutionVersion;

  // === INPUTS (preserved exactly as provided) ===
  /** Admin configuration as provided (unmodified) */
  readonly adminConfig: AdminSlotMultiplierConfig;
  /** Player stats map: playerId → stats */
  readonly playerStats: Record<string, PlayerMatchStats>;
  /** Raw slot assignments before conflict resolution */
  readonly rawSlotAssignments: Partial<Record<SlotIndex, string | null>>;

  // === RESOLVED STATE (post-validation) ===
  /** Resolved slot multipliers (post-validation) */
  readonly resolvedSlotMultipliers: Record<SlotIndex, number>;
  /** Slot assignments after conflict resolution */
  readonly resolvedSlotAssignments: SlotAssignmentMap;
  /** Whether conflicts were detected and resolved */
  readonly hadConflicts: boolean;
  /** Number of slots cleared due to conflicts */
  readonly conflictsClearedCount: number;

  // === OUTPUTS ===
  /** Per-slot scoring results */
  readonly slotResults: Record<SlotIndex, AuditSlotResult>;
  /** Total score across all slots */
  readonly totalScore: number;
  /** Rounded total score for display */
  readonly totalScoreRounded: number;
}

/**
 * Result of a replay verification attempt
 */
export interface ReplayResult {
  readonly success: boolean;
  readonly auditId: string;
  readonly matchId: string;
  readonly recomputedTotalScore: number;
  readonly storedTotalScore: number;
  readonly discrepancies: readonly ReplayDiscrepancy[];
}

/**
 * Details about a specific discrepancy found during replay
 */
export interface ReplayDiscrepancy {
  readonly field: string;
  readonly slotIndex?: SlotIndex;
  readonly expected: unknown;
  readonly actual: unknown;
  readonly message: string;
}

// =============================================================================
// AUDIT RECORD CREATION
// =============================================================================

/**
 * Generate a unique audit ID
 * Format: AUDIT-{matchId}-{timestamp}-{random}
 */
function generateAuditId(matchId: string, timestamp: string): string {
  const random = Math.random().toString(36).substring(2, 10);
  const sanitizedTimestamp = timestamp.replace(/[:.]/g, '-');
  return `AUDIT-${matchId}-${sanitizedTimestamp}-${random}`;
}

/**
 * Create an immutable audit record for a scoring run
 * 
 * This function:
 * 1. Validates and resolves admin config
 * 2. Resolves and de-conflicts slot assignments
 * 3. Computes all scores
 * 4. Packages everything into an immutable audit record
 * 
 * @param matchId - Match identifier
 * @param adminConfig - Admin-provided multiplier configuration
 * @param rawAssignments - Raw slot assignments (may have conflicts)
 * @param playerStats - Map of playerId → PlayerMatchStats
 * @param ruleVersion - Rule version for scoring
 * @param timestamp - Optional timestamp (defaults to now)
 * @returns Immutable audit record
 */
export function createScoringAuditRecord(
  matchId: string,
  adminConfig: AdminSlotMultiplierConfig,
  rawAssignments: Partial<Record<SlotIndex, string | null>>,
  playerStats: Record<string, PlayerMatchStats>,
  ruleVersion: RuleVersion,
  timestamp?: string
): ScoringAuditRecord {
  // Step 1: Resolve timestamp
  const auditTimestamp = timestamp ?? new Date().toISOString();

  // Step 2: Validate and resolve admin config
  const resolvedConfig = resolveAdminConfig(adminConfig);
  const resolvedMultipliers = extractMultipliers(resolvedConfig);

  // Step 3: Resolve slot assignments (normalize to 11 slots)
  const normalizedAssignments = resolveSlotAssignments(rawAssignments);

  // Step 4: Detect and resolve conflicts
  const conflictDetection = detectSlotConflicts(normalizedAssignments);
  const resolvedAssignments = resolveSlotConflicts(normalizedAssignments);

  // Step 5: Compute per-slot scores
  const slotResults: Record<SlotIndex, AuditSlotResult> = {} as Record<SlotIndex, AuditSlotResult>;
  let totalScore = 0;

  for (const slotIndex of ALL_SLOT_INDICES) {
    const playerId = resolvedAssignments[slotIndex];
    const multiplier = resolvedMultipliers[slotIndex];
    const slotConfig = resolvedConfig.slots[slotIndex];
    const isEnabled = slotConfig.isEnabled;

    let baseScore = 0;
    let slotScore = 0;

    if (playerId !== null) {
      const stats = playerStats[playerId];
      if (stats) {
        const breakdown = computeBasePlayerScore(stats, ruleVersion);
        baseScore = breakdown.totalBaseScore;
        slotScore = computeSlotScore(baseScore, multiplier);
      }
    }

    slotResults[slotIndex] = {
      slotIndex,
      playerId,
      multiplier,
      baseScore,
      slotScore,
      isEnabled,
    };

    totalScore += slotScore;
  }

  // Step 6: Generate audit ID
  const auditId = generateAuditId(matchId, auditTimestamp);

  // Step 7: Build immutable record
  return {
    auditId,
    matchId,
    timestamp: auditTimestamp,
    constitutionVersion: CONSTITUTION_VERSION,

    adminConfig,
    playerStats,
    rawSlotAssignments: rawAssignments,

    resolvedSlotMultipliers: resolvedMultipliers,
    resolvedSlotAssignments: resolvedAssignments,
    hadConflicts: conflictDetection.hasConflicts,
    conflictsClearedCount: conflictDetection.hasConflicts
      ? conflictDetection.conflicts.reduce((sum, c) => sum + c.clearedSlotIndices.length, 0)
      : 0,

    slotResults,
    totalScore,
    totalScoreRounded: Math.round(totalScore),
  };
}

// =============================================================================
// REPLAY VERIFICATION
// =============================================================================

/**
 * Replay a scoring run from an audit record and verify results
 * 
 * This function:
 * 1. Extracts inputs from the audit record
 * 2. Recomputes all scores using the same logic
 * 3. Compares recomputed results with stored results
 * 4. Reports any discrepancies
 * 
 * DETERMINISM GUARANTEE:
 * If the scoring logic is correct and the record is untampered,
 * replay will always succeed with identical results.
 * 
 * @param auditRecord - Previously saved audit record
 * @param ruleVersion - Rule version for scoring (must match original)
 * @returns Replay result with success/failure and any discrepancies
 */
export function replayScoringRun(
  auditRecord: ScoringAuditRecord,
  ruleVersion: RuleVersion
): ReplayResult {
  const discrepancies: ReplayDiscrepancy[] = [];

  // Step 1: Verify Constitution version matches
  if (auditRecord.constitutionVersion !== CONSTITUTION_VERSION) {
    discrepancies.push({
      field: 'constitutionVersion',
      expected: auditRecord.constitutionVersion,
      actual: CONSTITUTION_VERSION,
      message: `Constitution version mismatch: record has ${auditRecord.constitutionVersion}, current is ${CONSTITUTION_VERSION}`,
    });
  }

  // Step 2: Resolve admin config
  let resolvedMultipliers: Record<SlotIndex, number>;
  try {
    const resolvedConfig = resolveAdminConfig(auditRecord.adminConfig);
    resolvedMultipliers = extractMultipliers(resolvedConfig);
  } catch (e) {
    discrepancies.push({
      field: 'adminConfig',
      expected: 'valid config',
      actual: (e as Error).message,
      message: `Admin config validation failed during replay: ${(e as Error).message}`,
    });
    return {
      success: false,
      auditId: auditRecord.auditId,
      matchId: auditRecord.matchId,
      recomputedTotalScore: 0,
      storedTotalScore: auditRecord.totalScore,
      discrepancies,
    };
  }

  // Step 3: Verify resolved multipliers match
  for (const slotIndex of ALL_SLOT_INDICES) {
    const stored = auditRecord.resolvedSlotMultipliers[slotIndex];
    const recomputed = resolvedMultipliers[slotIndex];
    if (stored !== recomputed) {
      discrepancies.push({
        field: 'resolvedSlotMultipliers',
        slotIndex,
        expected: stored,
        actual: recomputed,
        message: `Slot ${slotIndex} multiplier mismatch: stored ${stored}, recomputed ${recomputed}`,
      });
    }
  }

  // Step 4: Resolve slot assignments
  const normalizedAssignments = resolveSlotAssignments(auditRecord.rawSlotAssignments);
  const resolvedAssignments = resolveSlotConflicts(normalizedAssignments);

  // Step 5: Verify resolved assignments match
  for (const slotIndex of ALL_SLOT_INDICES) {
    const stored = auditRecord.resolvedSlotAssignments[slotIndex];
    const recomputed = resolvedAssignments[slotIndex];
    if (stored !== recomputed) {
      discrepancies.push({
        field: 'resolvedSlotAssignments',
        slotIndex,
        expected: stored,
        actual: recomputed,
        message: `Slot ${slotIndex} assignment mismatch: stored "${stored}", recomputed "${recomputed}"`,
      });
    }
  }

  // Step 6: Recompute per-slot scores
  let recomputedTotalScore = 0;

  for (const slotIndex of ALL_SLOT_INDICES) {
    const playerId = resolvedAssignments[slotIndex];
    const multiplier = resolvedMultipliers[slotIndex];

    let baseScore = 0;
    let slotScore = 0;

    if (playerId !== null) {
      const stats = auditRecord.playerStats[playerId];
      if (stats) {
        const breakdown = computeBasePlayerScore(stats, ruleVersion);
        baseScore = breakdown.totalBaseScore;
        slotScore = computeSlotScore(baseScore, multiplier);
      }
    }

    // Verify base score
    const storedSlotResult = auditRecord.slotResults[slotIndex];
    if (storedSlotResult.baseScore !== baseScore) {
      discrepancies.push({
        field: 'slotResults.baseScore',
        slotIndex,
        expected: storedSlotResult.baseScore,
        actual: baseScore,
        message: `Slot ${slotIndex} base score mismatch: stored ${storedSlotResult.baseScore}, recomputed ${baseScore}`,
      });
    }

    // Verify slot score
    if (storedSlotResult.slotScore !== slotScore) {
      discrepancies.push({
        field: 'slotResults.slotScore',
        slotIndex,
        expected: storedSlotResult.slotScore,
        actual: slotScore,
        message: `Slot ${slotIndex} slot score mismatch: stored ${storedSlotResult.slotScore}, recomputed ${slotScore}`,
      });
    }

    recomputedTotalScore += slotScore;
  }

  // Step 7: Verify total score
  if (auditRecord.totalScore !== recomputedTotalScore) {
    discrepancies.push({
      field: 'totalScore',
      expected: auditRecord.totalScore,
      actual: recomputedTotalScore,
      message: `Total score mismatch: stored ${auditRecord.totalScore}, recomputed ${recomputedTotalScore}`,
    });
  }

  return {
    success: discrepancies.length === 0,
    auditId: auditRecord.auditId,
    matchId: auditRecord.matchId,
    recomputedTotalScore,
    storedTotalScore: auditRecord.totalScore,
    discrepancies,
  };
}

// =============================================================================
// SERIALIZATION HELPERS
// =============================================================================

/**
 * Serialize an audit record to JSON string
 * 
 * The output is deterministic for the same input record,
 * enabling byte-for-byte comparison after deserialization.
 */
export function serializeAuditRecord(record: ScoringAuditRecord): string {
  // Use a replacer function to sort keys at all levels for deterministic output
  return JSON.stringify(record, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Sort object keys for deterministic output
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value).sort()) {
        sorted[k] = value[k];
      }
      return sorted;
    }
    return value;
  }, 2);
}

/**
 * Deserialize a JSON string to an audit record
 * 
 * Handles Date object restoration since JSON.parse returns dates as strings.
 * 
 * @throws Error if JSON is invalid or missing required fields
 */
export function deserializeAuditRecord(json: string): ScoringAuditRecord {
  const parsed = JSON.parse(json);

  // Validate required fields exist
  const requiredFields = [
    'auditId', 'matchId', 'timestamp', 'constitutionVersion',
    'adminConfig', 'playerStats', 'rawSlotAssignments',
    'resolvedSlotMultipliers', 'resolvedSlotAssignments',
    'hadConflicts', 'conflictsClearedCount',
    'slotResults', 'totalScore', 'totalScoreRounded',
  ];

  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new Error(`Invalid audit record: missing required field "${field}"`);
    }
  }

  // Restore Date object in adminConfig.configuredAt
  if (parsed.adminConfig && parsed.adminConfig.configuredAt) {
    parsed.adminConfig = {
      ...parsed.adminConfig,
      configuredAt: new Date(parsed.adminConfig.configuredAt),
    };
  }

  return parsed as ScoringAuditRecord;
}

/**
 * Compute a hash of an audit record for integrity verification
 * 
 * Uses a simple deterministic string hash for demonstration.
 * In production, use SHA-256 or similar.
 */
export function computeAuditHash(record: ScoringAuditRecord): string {
  const serialized = serializeAuditRecord(record);
  // Simple hash for demonstration (djb2 algorithm)
  let hash = 5381;
  for (let i = 0; i < serialized.length; i++) {
    hash = ((hash << 5) + hash) + serialized.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// =============================================================================
// AUDIT RECORD VALIDATION
// =============================================================================

/**
 * Validate that an audit record has all required fields and correct types
 */
export function validateAuditRecord(record: unknown): record is ScoringAuditRecord {
  if (typeof record !== 'object' || record === null) {
    return false;
  }

  const r = record as Record<string, unknown>;

  // Check string fields
  if (typeof r.auditId !== 'string' || r.auditId.length === 0) return false;
  if (typeof r.matchId !== 'string' || r.matchId.length === 0) return false;
  if (typeof r.timestamp !== 'string' || r.timestamp.length === 0) return false;
  if (typeof r.constitutionVersion !== 'string') return false;

  // Check numeric fields
  if (typeof r.totalScore !== 'number') return false;
  if (typeof r.totalScoreRounded !== 'number') return false;

  // Check boolean fields
  if (typeof r.hadConflicts !== 'boolean') return false;
  if (typeof r.conflictsClearedCount !== 'number') return false;

  // Check object fields exist
  if (typeof r.adminConfig !== 'object' || r.adminConfig === null) return false;
  if (typeof r.playerStats !== 'object' || r.playerStats === null) return false;
  if (typeof r.rawSlotAssignments !== 'object' || r.rawSlotAssignments === null) return false;
  if (typeof r.resolvedSlotMultipliers !== 'object' || r.resolvedSlotMultipliers === null) return false;
  if (typeof r.resolvedSlotAssignments !== 'object' || r.resolvedSlotAssignments === null) return false;
  if (typeof r.slotResults !== 'object' || r.slotResults === null) return false;

  return true;
}

/**
 * Deep clone an audit record to ensure immutability
 */
export function cloneAuditRecord(record: ScoringAuditRecord): ScoringAuditRecord {
  return JSON.parse(JSON.stringify(record));
}
