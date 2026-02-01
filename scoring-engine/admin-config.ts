/**
 * IPL Friends Betting Game — Admin Configuration & Validation
 * 
 * Authority: Constitution.md v1.0, Section 5 (Multipliers), Section 11 (Admin Powers)
 * 
 * PURPOSE:
 * This module defines the admin configuration model for slot multipliers
 * and provides strict validation to enforce governance boundaries.
 * 
 * ADMIN DISCRETION BOUNDARIES (Section 11):
 * - Admin MAY configure slot multipliers per match
 * - Admin may NOT change base scoring coefficients (immutable)
 * - Multipliers are the ONLY mechanism that scales player scores
 * 
 * VALIDATION RULES:
 * 1. Slot numbers must be integers from 1 to 11 only
 * 2. Multipliers must be finite numbers (not NaN, not Infinity)
 * 3. Multipliers must be ≥ 0
 * 4. Missing slots are allowed and treated as disabled (1×)
 * 
 * ERROR POLICY:
 * - Validator throws explicit errors on invalid configs
 * - No silent correction or coercion
 * - All errors are descriptive for debugging
 */

import {
  type SlotIndex,
  ALL_SLOT_INDICES,
  SLOT_COUNT,
  isValidSlotIndex,
} from './slot-assignment';

import {
  CONSTITUTION_VERSION,
  type ConstitutionVersion,
} from './constitution-version';

// =============================================================================
// ADMIN CONFIGURATION TYPES
// =============================================================================

/**
 * Admin-configured multiplier for a single slot
 */
export interface SlotMultiplierConfig {
  readonly slotNumber: SlotIndex;
  readonly multiplier: number;
  readonly isEnabled: boolean;
}

/**
 * Complete admin configuration for a match's slot multipliers
 * 
 * This is the primary input from admin for configuring multipliers.
 * It is a sparse map - missing slots are treated as disabled (1×).
 */
export interface AdminSlotMultiplierConfig {
  /** Match ID this configuration applies to */
  readonly matchId: string;
  /** Sparse mapping of slot number to multiplier value */
  readonly multipliers: Partial<Record<SlotIndex, number>>;
  /** Optional: explicitly disabled slots (overrides multiplier value) */
  readonly disabledSlots?: readonly SlotIndex[];
  /** Timestamp when this config was created/updated */
  readonly configuredAt: Date;
  /** Admin user ID who configured this */
  readonly configuredBy: string;
}

/**
 * Resolved (validated and normalized) admin configuration
 * 
 * After validation, this provides a complete 11-slot configuration
 * with all slots explicitly accounted for.
 */
export interface ResolvedAdminConfig {
  readonly matchId: string;
  readonly slots: Record<SlotIndex, SlotMultiplierConfig>;
  readonly configuredAt: Date;
  readonly configuredBy: string;
  readonly constitutionVersion: ConstitutionVersion;
}

// =============================================================================
// VALIDATION ERROR TYPES
// =============================================================================

/**
 * Error codes for admin config validation failures
 */
export enum AdminConfigErrorCode {
  INVALID_SLOT_INDEX = 'INVALID_SLOT_INDEX',
  INVALID_MULTIPLIER_NAN = 'INVALID_MULTIPLIER_NAN',
  INVALID_MULTIPLIER_INFINITY = 'INVALID_MULTIPLIER_INFINITY',
  INVALID_MULTIPLIER_NEGATIVE = 'INVALID_MULTIPLIER_NEGATIVE',
  INVALID_MATCH_ID = 'INVALID_MATCH_ID',
  INVALID_CONFIGURED_BY = 'INVALID_CONFIGURED_BY',
  INVALID_DISABLED_SLOT = 'INVALID_DISABLED_SLOT',
}

/**
 * Detailed validation error with context
 */
export interface AdminConfigValidationError {
  readonly code: AdminConfigErrorCode;
  readonly message: string;
  readonly slotNumber?: number;
  readonly value?: unknown;
}

/**
 * Result of validation (success or failure with errors)
 */
export interface AdminConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly AdminConfigValidationError[];
}

/**
 * Custom error class for admin config validation failures
 */
export class AdminConfigError extends Error {
  readonly code: AdminConfigErrorCode;
  readonly slotNumber?: number;
  readonly value?: unknown;
  readonly validationErrors: readonly AdminConfigValidationError[];

  constructor(
    message: string,
    code: AdminConfigErrorCode,
    validationErrors: readonly AdminConfigValidationError[],
    slotNumber?: number,
    value?: unknown
  ) {
    super(message);
    this.name = 'AdminConfigError';
    this.code = code;
    this.slotNumber = slotNumber;
    this.value = value;
    this.validationErrors = validationErrors;
  }
}

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

/**
 * Default multiplier for disabled or missing slots
 */
export const DEFAULT_DISABLED_MULTIPLIER = 1;

/**
 * Minimum allowed multiplier value
 */
export const MIN_MULTIPLIER = 0;

// =============================================================================
// VALIDATION FUNCTIONS (PURE)
// =============================================================================

/**
 * Validate a single slot index
 * 
 * @param slotNumber - The slot number to validate
 * @returns Validation error or null if valid
 */
function validateSlotIndex(slotNumber: unknown): AdminConfigValidationError | null {
  // Must be a number
  if (typeof slotNumber !== 'number') {
    return {
      code: AdminConfigErrorCode.INVALID_SLOT_INDEX,
      message: `Slot index must be a number, got ${typeof slotNumber}`,
      slotNumber: slotNumber as number,
      value: slotNumber,
    };
  }

  // Must be an integer
  if (!Number.isInteger(slotNumber)) {
    return {
      code: AdminConfigErrorCode.INVALID_SLOT_INDEX,
      message: `Slot index must be an integer, got ${slotNumber}`,
      slotNumber,
      value: slotNumber,
    };
  }

  // Must be in range 1-11
  if (!isValidSlotIndex(slotNumber)) {
    return {
      code: AdminConfigErrorCode.INVALID_SLOT_INDEX,
      message: `Slot index must be between 1 and ${SLOT_COUNT}, got ${slotNumber}`,
      slotNumber,
      value: slotNumber,
    };
  }

  return null;
}

/**
 * Validate a single multiplier value
 * 
 * @param multiplier - The multiplier value to validate
 * @param slotNumber - The slot this multiplier is for (for error context)
 * @returns Validation error or null if valid
 */
function validateMultiplier(
  multiplier: unknown,
  slotNumber: number
): AdminConfigValidationError | null {
  // Must be a number
  if (typeof multiplier !== 'number') {
    return {
      code: AdminConfigErrorCode.INVALID_MULTIPLIER_NAN,
      message: `Multiplier for slot ${slotNumber} must be a number, got ${typeof multiplier}`,
      slotNumber,
      value: multiplier,
    };
  }

  // Must not be NaN
  if (Number.isNaN(multiplier)) {
    return {
      code: AdminConfigErrorCode.INVALID_MULTIPLIER_NAN,
      message: `Multiplier for slot ${slotNumber} cannot be NaN`,
      slotNumber,
      value: multiplier,
    };
  }

  // Must not be Infinity or -Infinity
  if (!Number.isFinite(multiplier)) {
    return {
      code: AdminConfigErrorCode.INVALID_MULTIPLIER_INFINITY,
      message: `Multiplier for slot ${slotNumber} must be finite, got ${multiplier}`,
      slotNumber,
      value: multiplier,
    };
  }

  // Must be non-negative
  if (multiplier < MIN_MULTIPLIER) {
    return {
      code: AdminConfigErrorCode.INVALID_MULTIPLIER_NEGATIVE,
      message: `Multiplier for slot ${slotNumber} must be ≥ ${MIN_MULTIPLIER}, got ${multiplier}`,
      slotNumber,
      value: multiplier,
    };
  }

  return null;
}

/**
 * Validate an admin slot multiplier configuration (non-throwing)
 * 
 * Returns a validation result with all errors found.
 * Does NOT throw - use validateAdminConfig for throwing version.
 * 
 * @param config - The admin configuration to validate
 * @returns Validation result with isValid flag and any errors
 */
export function validateAdminConfigSafe(
  config: AdminSlotMultiplierConfig
): AdminConfigValidationResult {
  const errors: AdminConfigValidationError[] = [];

  // Validate matchId
  if (!config.matchId || typeof config.matchId !== 'string' || config.matchId.trim() === '') {
    errors.push({
      code: AdminConfigErrorCode.INVALID_MATCH_ID,
      message: 'Match ID must be a non-empty string',
      value: config.matchId,
    });
  }

  // Validate configuredBy
  if (!config.configuredBy || typeof config.configuredBy !== 'string' || config.configuredBy.trim() === '') {
    errors.push({
      code: AdminConfigErrorCode.INVALID_CONFIGURED_BY,
      message: 'Configured by must be a non-empty string',
      value: config.configuredBy,
    });
  }

  // Validate each slot multiplier entry
  if (config.multipliers) {
    const entries = Object.entries(config.multipliers);
    for (const [slotKey, multiplier] of entries) {
      const slotNumber = parseInt(slotKey, 10);

      // Check if the key was a valid integer string (e.g., "5" not "5.5")
      // parseInt("5.5", 10) returns 5, but we want to reject non-integer keys
      if (slotKey !== String(slotNumber)) {
        errors.push({
          code: AdminConfigErrorCode.INVALID_SLOT_INDEX,
          message: `Slot index must be an integer, got "${slotKey}"`,
          slotNumber: NaN,
          value: slotKey,
        });
        continue; // Skip further validation for this entry
      }

      // Validate slot index
      const slotError = validateSlotIndex(slotNumber);
      if (slotError) {
        errors.push(slotError);
        continue; // Skip multiplier validation if slot is invalid
      }

      // Validate multiplier value
      const multiplierError = validateMultiplier(multiplier, slotNumber);
      if (multiplierError) {
        errors.push(multiplierError);
      }
    }
  }

  // Validate disabled slots array (if provided)
  if (config.disabledSlots) {
    for (const slot of config.disabledSlots) {
      const slotError = validateSlotIndex(slot);
      if (slotError) {
        errors.push({
          code: AdminConfigErrorCode.INVALID_DISABLED_SLOT,
          message: `Invalid slot in disabledSlots array: ${slot}`,
          slotNumber: slot as number,
          value: slot,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an admin slot multiplier configuration (throwing)
 * 
 * Throws an AdminConfigError if validation fails.
 * Use this before any scoring operations to enforce governance.
 * 
 * @param config - The admin configuration to validate
 * @throws AdminConfigError if validation fails
 */
export function validateAdminConfig(config: AdminSlotMultiplierConfig): void {
  const result = validateAdminConfigSafe(config);

  if (!result.isValid) {
    const firstError = result.errors[0];
    const message = result.errors.length === 1
      ? firstError.message
      : `Admin config validation failed with ${result.errors.length} errors: ${result.errors.map(e => e.message).join('; ')}`;

    throw new AdminConfigError(
      message,
      firstError.code,
      result.errors,
      firstError.slotNumber,
      firstError.value
    );
  }
}

// =============================================================================
// RESOLUTION FUNCTIONS (PURE)
// =============================================================================

/**
 * Resolve an admin configuration to a complete 11-slot configuration
 * 
 * This function:
 * 1. Validates the input configuration (throws on invalid)
 * 2. Normalizes to a complete 11-slot record
 * 3. Applies disabled slots
 * 4. Stamps with Constitution version
 * 
 * @param config - The admin configuration to resolve
 * @returns Resolved configuration with all 11 slots
 * @throws AdminConfigError if validation fails
 */
export function resolveAdminConfig(
  config: AdminSlotMultiplierConfig
): ResolvedAdminConfig {
  // Step 1: Validate (throws on failure)
  validateAdminConfig(config);

  // Step 2: Build disabled slots set for quick lookup
  const disabledSet = new Set<SlotIndex>(config.disabledSlots ?? []);

  // Step 3: Build complete 11-slot configuration
  const slots: Record<SlotIndex, SlotMultiplierConfig> = {} as Record<SlotIndex, SlotMultiplierConfig>;

  for (const slotIndex of ALL_SLOT_INDICES) {
    const configuredMultiplier = config.multipliers[slotIndex];
    const isExplicitlyDisabled = disabledSet.has(slotIndex);
    const hasConfiguredValue = configuredMultiplier !== undefined;

    // Determine if slot is enabled
    // Enabled if: has configured value AND not explicitly disabled
    const isEnabled = hasConfiguredValue && !isExplicitlyDisabled;

    // Determine multiplier value
    // Use configured value if present, otherwise default to 1
    const multiplier = hasConfiguredValue ? configuredMultiplier : DEFAULT_DISABLED_MULTIPLIER;

    slots[slotIndex] = {
      slotNumber: slotIndex,
      multiplier,
      isEnabled,
    };
  }

  return {
    matchId: config.matchId,
    slots,
    configuredAt: config.configuredAt,
    configuredBy: config.configuredBy,
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract multipliers from resolved config as a simple Record
 * 
 * Useful for passing to scoring functions that expect a multiplier map.
 * 
 * @param resolved - Resolved admin configuration
 * @returns Simple slot → multiplier mapping
 */
export function extractMultipliers(
  resolved: ResolvedAdminConfig
): Record<SlotIndex, number> {
  const multipliers: Record<SlotIndex, number> = {} as Record<SlotIndex, number>;

  for (const slotIndex of ALL_SLOT_INDICES) {
    const slotConfig = resolved.slots[slotIndex];
    // Use configured multiplier if enabled, otherwise 1
    multipliers[slotIndex] = slotConfig.isEnabled ? slotConfig.multiplier : DEFAULT_DISABLED_MULTIPLIER;
  }

  return multipliers;
}

/**
 * Create a default admin configuration with all slots at 1×
 * 
 * Useful for testing or when no admin config is provided.
 * 
 * @param matchId - Match ID
 * @param configuredBy - Admin user ID
 * @returns Default configuration with all slots at 1×
 */
export function createDefaultAdminConfig(
  matchId: string,
  configuredBy: string
): AdminSlotMultiplierConfig {
  const multipliers: Partial<Record<SlotIndex, number>> = {};
  
  for (const slotIndex of ALL_SLOT_INDICES) {
    multipliers[slotIndex] = DEFAULT_DISABLED_MULTIPLIER;
  }

  return {
    matchId,
    multipliers,
    configuredAt: new Date(),
    configuredBy,
  };
}

/**
 * Create a standard IPL-style descending multiplier configuration
 * 
 * Common pattern: Slot 1 = highest multiplier, Slot 11 = lowest
 * 
 * @param matchId - Match ID
 * @param configuredBy - Admin user ID
 * @param maxMultiplier - Maximum multiplier for Slot 1 (default 20)
 * @returns Configuration with descending multipliers
 */
export function createDescendingMultiplierConfig(
  matchId: string,
  configuredBy: string,
  maxMultiplier = 20
): AdminSlotMultiplierConfig {
  const multipliers: Partial<Record<SlotIndex, number>> = {};
  
  // Calculate step size for even distribution
  // Slot 1 = maxMultiplier, Slot 11 = 1
  const step = (maxMultiplier - 1) / (SLOT_COUNT - 1);
  
  for (const slotIndex of ALL_SLOT_INDICES) {
    multipliers[slotIndex] = Math.round((maxMultiplier - (slotIndex - 1) * step) * 100) / 100;
  }

  return {
    matchId,
    multipliers,
    configuredAt: new Date(),
    configuredBy,
  };
}

/**
 * Check if a resolved config has any enabled slots with multiplier > 1
 * 
 * @param resolved - Resolved admin configuration
 * @returns True if any slot has multiplier > 1 and is enabled
 */
export function hasActiveMultipliers(resolved: ResolvedAdminConfig): boolean {
  for (const slotIndex of ALL_SLOT_INDICES) {
    const slotConfig = resolved.slots[slotIndex];
    if (slotConfig.isEnabled && slotConfig.multiplier > 1) {
      return true;
    }
  }
  return false;
}

/**
 * Get the maximum multiplier from a resolved config
 * 
 * @param resolved - Resolved admin configuration
 * @returns Maximum multiplier value across all enabled slots
 */
export function getMaxMultiplier(resolved: ResolvedAdminConfig): number {
  let max = 0;
  
  for (const slotIndex of ALL_SLOT_INDICES) {
    const slotConfig = resolved.slots[slotIndex];
    if (slotConfig.isEnabled && slotConfig.multiplier > max) {
      max = slotConfig.multiplier;
    }
  }
  
  return max;
}
