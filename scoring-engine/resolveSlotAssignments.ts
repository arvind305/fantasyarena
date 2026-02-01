/**
 * IPL Friends Betting Game — Slot Assignment & Resolution
 * 
 * Authority: Constitution.md v1.0, Section 2.3 (Player Picks), Section 5 (Multipliers)
 * 
 * PURPOSE:
 * This module defines types and functions for slot assignment handling.
 * It prepares deterministic slot data for downstream scoring steps.
 * 
 * CRITICAL CONSTRAINTS:
 * - This module performs NO scoring
 * - This module applies NO multipliers
 * - Slot order is meaningful and must be preserved
 * - Empty slots remain explicitly null (no auto-fill)
 * - All operations are pure and deterministic
 * 
 * DEFINITIONS:
 * - A "slot" is a positional container indexed from 1 to 11
 * - A slot may contain exactly one playerId OR null (explicitly empty)
 * - Slot indices correspond to admin-configured multipliers (configured elsewhere)
 */

// =============================================================================
// SLOT INDEX TYPE
// =============================================================================

/**
 * Valid slot indices (1-11)
 * Reference: Constitution Section 5.2 — "Slot-based (e.g., Slot 1 = 20×, Slot 11 = 3×)"
 * 
 * Slots are 1-indexed, not 0-indexed, to match domain language.
 */
export type SlotIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Array of all valid slot indices for iteration
 * Immutable and ordered from 1 to 11
 */
export const ALL_SLOT_INDICES: readonly SlotIndex[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
] as const;

/**
 * Total number of slots
 */
export const SLOT_COUNT = 11 as const;

// =============================================================================
// SLOT ASSIGNMENT TYPES
// =============================================================================

/**
 * A single slot assignment
 * - string: Player ID assigned to this slot
 * - null: Slot is explicitly empty
 * 
 * Reference: Constitution Section 2.3
 * "Users may pick between 0 and N players (admin-defined per match)"
 * "One player may occupy only one slot per match"
 */
export type SlotAssignment = string | null;

/**
 * Map of slot indices to assignments
 * 
 * This is the input format from upstream UI/selection logic.
 * May be sparse (not all slots present) — use Partial<> in input type.
 */
export type SlotAssignmentMap = {
  readonly [K in SlotIndex]?: SlotAssignment;
};

/**
 * Fully resolved slot assignment map
 * 
 * All 11 slots are guaranteed to be present.
 * Empty slots are explicitly set to null.
 * This is the output format for downstream processing.
 */
export type ResolvedSlotAssignmentMap = {
  readonly [K in SlotIndex]: SlotAssignment;
};

// =============================================================================
// SLOT ASSIGNMENT ENTRY TYPE (for iteration)
// =============================================================================

/**
 * Single entry in a slot assignment map
 * Useful for iteration and downstream processing
 */
export interface SlotAssignmentEntry {
  readonly slotIndex: SlotIndex;
  readonly playerId: SlotAssignment;
}

// =============================================================================
// PURE FUNCTION: RESOLVE SLOT ASSIGNMENTS
// =============================================================================

/**
 * Resolve and normalize a slot assignment map
 * 
 * This function ensures all 11 slots are present in the output,
 * with empty slots explicitly set to null.
 * 
 * GUARANTEES:
 * - All 11 slot indices (1-11) are present in output
 * - Slot order is preserved (index integrity maintained)
 * - Existing assignments are preserved exactly
 * - Missing slots are set to null (not auto-filled)
 * - Output is deterministic for the same input
 * 
 * DOES NOT:
 * - Perform any scoring
 * - Apply multipliers
 * - Reorder slots
 * - Fill empty slots automatically with players
 * - Validate player eligibility
 * - Resolve duplicate player conflicts (handled in Step C3)
 * 
 * @param assignments - Input slot assignment map (may be sparse)
 * @returns Fully resolved map with all 11 slots present
 */
export function resolveSlotAssignments(
  assignments: SlotAssignmentMap
): ResolvedSlotAssignmentMap {
  // Build normalized map with all slots present
  const resolved: { [K in SlotIndex]?: SlotAssignment } = {};

  for (const slotIndex of ALL_SLOT_INDICES) {
    // Check if this slot has an assignment in the input
    const assignment = assignments[slotIndex];

    // Preserve existing assignment, or set to null if missing/undefined
    // Note: We preserve explicit null assignments as-is
    resolved[slotIndex] = assignment ?? null;
  }

  // Type assertion is safe because we've set all 11 slots
  return resolved as ResolvedSlotAssignmentMap;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert a resolved slot assignment map to an array of entries
 * Maintains slot index order (1 to 11)
 * 
 * @param resolved - Resolved slot assignment map
 * @returns Array of slot assignment entries in order
 */
export function toSlotAssignmentEntries(
  resolved: ResolvedSlotAssignmentMap
): SlotAssignmentEntry[] {
  return ALL_SLOT_INDICES.map(slotIndex => ({
    slotIndex,
    playerId: resolved[slotIndex],
  }));
}

/**
 * Get all filled (non-null) slot assignments
 * Maintains slot index order
 * 
 * @param resolved - Resolved slot assignment map
 * @returns Array of filled slot entries only
 */
export function getFilledSlots(
  resolved: ResolvedSlotAssignmentMap
): SlotAssignmentEntry[] {
  return toSlotAssignmentEntries(resolved).filter(
    entry => entry.playerId !== null
  );
}

/**
 * Get all empty (null) slot assignments
 * Maintains slot index order
 * 
 * @param resolved - Resolved slot assignment map
 * @returns Array of empty slot entries only
 */
export function getEmptySlots(
  resolved: ResolvedSlotAssignmentMap
): SlotAssignmentEntry[] {
  return toSlotAssignmentEntries(resolved).filter(
    entry => entry.playerId === null
  );
}

/**
 * Count filled slots
 * 
 * @param resolved - Resolved slot assignment map
 * @returns Number of slots with player assignments
 */
export function countFilledSlots(resolved: ResolvedSlotAssignmentMap): number {
  return getFilledSlots(resolved).length;
}

/**
 * Count empty slots
 * 
 * @param resolved - Resolved slot assignment map
 * @returns Number of empty slots
 */
export function countEmptySlots(resolved: ResolvedSlotAssignmentMap): number {
  return getEmptySlots(resolved).length;
}

/**
 * Check if a specific slot is filled
 * 
 * @param resolved - Resolved slot assignment map
 * @param slotIndex - Slot index to check
 * @returns True if slot has a player assignment
 */
export function isSlotFilled(
  resolved: ResolvedSlotAssignmentMap,
  slotIndex: SlotIndex
): boolean {
  return resolved[slotIndex] !== null;
}

/**
 * Get player ID at a specific slot
 * 
 * @param resolved - Resolved slot assignment map
 * @param slotIndex - Slot index to query
 * @returns Player ID or null if empty
 */
export function getPlayerAtSlot(
  resolved: ResolvedSlotAssignmentMap,
  slotIndex: SlotIndex
): SlotAssignment {
  return resolved[slotIndex];
}

/**
 * Create an empty slot assignment map (all slots null)
 * Useful for initialization
 * 
 * @returns Resolved map with all slots empty
 */
export function createEmptySlotAssignmentMap(): ResolvedSlotAssignmentMap {
  return resolveSlotAssignments({});
}

/**
 * Type guard to check if a number is a valid SlotIndex
 * 
 * @param value - Number to check
 * @returns True if value is a valid slot index (1-11)
 */
export function isValidSlotIndex(value: number): value is SlotIndex {
  return Number.isInteger(value) && value >= 1 && value <= 11;
}
