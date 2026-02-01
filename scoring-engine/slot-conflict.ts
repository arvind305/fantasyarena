/**
 * IPL Friends Betting Game — Slot Conflict Resolution
 * 
 * Authority: Constitution.md v1.0, Section 2.3 (Player Picks)
 * Reference: "One player may occupy only one slot per match"
 * 
 * PURPOSE:
 * This module resolves invalid slot assignments where the same player
 * appears in multiple slots. It enforces the single-slot-per-player rule.
 * 
 * CRITICAL CONSTRAINTS:
 * - This module performs NO scoring
 * - This module applies NO multipliers
 * - Slot order represents priority (lower index = higher priority)
 * - Conflicts are resolved deterministically (lowest index wins)
 * - All operations are pure and side-effect free
 * 
 * CONFLICT DEFINITION:
 * A conflict occurs when the same playerId appears in more than one slot.
 * Resolution: Keep the instance in the lowest slot index, set others to null.
 */

import {
  type SlotIndex,
  type SlotAssignment,
  type ResolvedSlotAssignmentMap,
  ALL_SLOT_INDICES,
} from './slot-assignment';

// =============================================================================
// CONFLICT DETECTION TYPES
// =============================================================================

/**
 * Record of a detected conflict
 */
export interface SlotConflict {
  /** The player ID that appears multiple times */
  readonly playerId: string;
  /** All slot indices where this player appears (in ascending order) */
  readonly slotIndices: readonly SlotIndex[];
  /** The slot index that will be kept (lowest) */
  readonly keptSlotIndex: SlotIndex;
  /** Slot indices that will be cleared (set to null) */
  readonly clearedSlotIndices: readonly SlotIndex[];
}

/**
 * Result of conflict detection
 */
export interface ConflictDetectionResult {
  /** Whether any conflicts were detected */
  readonly hasConflicts: boolean;
  /** Number of conflicts detected */
  readonly conflictCount: number;
  /** Details of each conflict */
  readonly conflicts: readonly SlotConflict[];
  /** Player IDs that have conflicts */
  readonly conflictingPlayerIds: readonly string[];
}

/**
 * Result of conflict resolution
 */
export interface ConflictResolutionResult {
  /** The resolved slot assignment map (conflict-free) */
  readonly resolved: ResolvedSlotAssignmentMap;
  /** Details of conflicts that were resolved */
  readonly conflictsResolved: readonly SlotConflict[];
  /** Whether any conflicts were resolved */
  readonly hadConflicts: boolean;
  /** Number of slots that were cleared due to conflicts */
  readonly slotsClearedCount: number;
}

// =============================================================================
// PURE FUNCTION: DETECT CONFLICTS
// =============================================================================

/**
 * Detect conflicts in a slot assignment map
 * 
 * A conflict occurs when the same playerId appears in multiple slots.
 * This function only detects conflicts; it does not resolve them.
 * 
 * @param assignments - Resolved slot assignment map to check
 * @returns Conflict detection result with details
 */
export function detectSlotConflicts(
  assignments: ResolvedSlotAssignmentMap
): ConflictDetectionResult {
  // Build a map of playerId -> list of slot indices where it appears
  const playerSlotMap = new Map<string, SlotIndex[]>();

  for (const slotIndex of ALL_SLOT_INDICES) {
    const playerId = assignments[slotIndex];
    if (playerId !== null) {
      const existingSlots = playerSlotMap.get(playerId) || [];
      existingSlots.push(slotIndex);
      playerSlotMap.set(playerId, existingSlots);
    }
  }

  // Find players that appear in multiple slots
  const conflicts: SlotConflict[] = [];

  for (const [playerId, slotIndices] of playerSlotMap.entries()) {
    if (slotIndices.length > 1) {
      // Sort slot indices to ensure deterministic order (ascending)
      const sortedIndices = [...slotIndices].sort((a, b) => a - b);
      const keptSlotIndex = sortedIndices[0]; // Lowest index wins
      const clearedSlotIndices = sortedIndices.slice(1);

      conflicts.push({
        playerId,
        slotIndices: sortedIndices,
        keptSlotIndex,
        clearedSlotIndices,
      });
    }
  }

  // Sort conflicts by player ID for deterministic output
  conflicts.sort((a, b) => a.playerId.localeCompare(b.playerId));

  return {
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
    conflicts,
    conflictingPlayerIds: conflicts.map(c => c.playerId),
  };
}

// =============================================================================
// PURE FUNCTION: RESOLVE CONFLICTS
// =============================================================================

/**
 * Resolve slot conflicts in a slot assignment map
 * 
 * CONFLICT RESOLUTION RULES (Constitution Section 2.3):
 * - A playerId may appear in at most one slot
 * - If a playerId appears multiple times:
 *   - Keep the instance in the LOWEST slot index (highest priority)
 *   - All later occurrences are set to null
 * - Null slots remain null
 * 
 * GUARANTEES:
 * - Output is always conflict-free
 * - Slot indices and order are preserved
 * - Deterministic for the same input
 * - Never throws (always resolves deterministically)
 * 
 * DOES NOT:
 * - Reorder slots
 * - Fill empty slots
 * - Perform scoring or multiplication
 * - Validate player eligibility
 * 
 * @param assignments - Resolved slot assignment map (may have conflicts)
 * @returns Conflict-free slot assignment map
 */
export function resolveSlotConflicts(
  assignments: ResolvedSlotAssignmentMap
): ResolvedSlotAssignmentMap {
  // Track which player IDs have already been assigned
  const assignedPlayers = new Set<string>();

  // Build the resolved map
  const resolved: { [K in SlotIndex]?: SlotAssignment } = {};

  // Process slots in order (1 to 11) - lower index = higher priority
  for (const slotIndex of ALL_SLOT_INDICES) {
    const playerId = assignments[slotIndex];

    if (playerId === null) {
      // Null slots remain null
      resolved[slotIndex] = null;
    } else if (assignedPlayers.has(playerId)) {
      // Player already assigned to a lower-index slot → clear this slot
      resolved[slotIndex] = null;
    } else {
      // First occurrence of this player → keep it
      resolved[slotIndex] = playerId;
      assignedPlayers.add(playerId);
    }
  }

  return resolved as ResolvedSlotAssignmentMap;
}

/**
 * Resolve slot conflicts with detailed result
 * 
 * Same as resolveSlotConflicts but returns additional metadata
 * about the conflicts that were resolved.
 * 
 * @param assignments - Resolved slot assignment map (may have conflicts)
 * @returns Resolution result with conflict details
 */
export function resolveSlotConflictsWithDetails(
  assignments: ResolvedSlotAssignmentMap
): ConflictResolutionResult {
  // First detect conflicts
  const detection = detectSlotConflicts(assignments);

  // Then resolve them
  const resolved = resolveSlotConflicts(assignments);

  // Count total slots cleared
  const slotsClearedCount = detection.conflicts.reduce(
    (sum, conflict) => sum + conflict.clearedSlotIndices.length,
    0
  );

  return {
    resolved,
    conflictsResolved: detection.conflicts,
    hadConflicts: detection.hasConflicts,
    slotsClearedCount,
  };
}

// =============================================================================
// VALIDATION HELPER
// =============================================================================

/**
 * Check if a slot assignment map is conflict-free
 * 
 * @param assignments - Slot assignment map to validate
 * @returns True if no conflicts exist
 */
export function isConflictFree(assignments: ResolvedSlotAssignmentMap): boolean {
  const detection = detectSlotConflicts(assignments);
  return !detection.hasConflicts;
}

/**
 * Get all unique player IDs from a slot assignment map
 * 
 * @param assignments - Slot assignment map
 * @returns Array of unique player IDs (excludes nulls)
 */
export function getUniquePlayerIds(
  assignments: ResolvedSlotAssignmentMap
): string[] {
  const playerIds = new Set<string>();

  for (const slotIndex of ALL_SLOT_INDICES) {
    const playerId = assignments[slotIndex];
    if (playerId !== null) {
      playerIds.add(playerId);
    }
  }

  return Array.from(playerIds).sort();
}
