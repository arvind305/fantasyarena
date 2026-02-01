/**
 * IPL Friends Betting Game — Admin Config Validation Unit Tests
 * 
 * Authority: Constitution.md v1.0, Section 5 (Multipliers), Section 11 (Admin Powers)
 * 
 * PURPOSE:
 * These tests validate that admin configuration validation enforces
 * the governance boundaries defined in the Constitution.
 * 
 * TEST COVERAGE:
 * 1. Valid admin configs (happy path)
 * 2. Invalid slot indices (0, 12, negative, float, non-integer)
 * 3. Negative multipliers
 * 4. NaN multipliers
 * 5. Infinity multipliers
 * 6. Missing/empty required fields
 * 7. Partial configs (missing slots)
 * 8. Disabled slots handling
 * 9. Resolution and extraction helpers
 */

import {
  validateAdminConfig,
  validateAdminConfigSafe,
  resolveAdminConfig,
  extractMultipliers,
  createDefaultAdminConfig,
  createDescendingMultiplierConfig,
  hasActiveMultipliers,
  getMaxMultiplier,
  AdminConfigError,
  AdminConfigErrorCode,
  DEFAULT_DISABLED_MULTIPLIER,
  type AdminSlotMultiplierConfig,
  type ResolvedAdminConfig,
} from '../src/domain/admin-config';

import { CONSTITUTION_VERSION } from '../src/domain/constitution-version';
import { ALL_SLOT_INDICES, type SlotIndex } from '../src/domain/slot-assignment';

// =============================================================================
// TEST INFRASTRUCTURE
// =============================================================================

interface TestResult {
  readonly testId: string;
  readonly description: string;
  readonly passed: boolean;
  readonly error?: string;
}

// =============================================================================
// TEST DATA: VALID CONFIGS
// =============================================================================

function createValidConfig(
  overrides?: Partial<AdminSlotMultiplierConfig>
): AdminSlotMultiplierConfig {
  return {
    matchId: 'match-001',
    multipliers: {
      1: 20, 2: 18, 3: 16, 4: 14, 5: 12,
      6: 10, 7: 8, 8: 6, 9: 4, 10: 2, 11: 1,
    },
    configuredAt: new Date('2025-01-01T00:00:00Z'),
    configuredBy: 'admin-user',
    ...overrides,
  };
}

// =============================================================================
// TEST 1: VALID ADMIN CONFIGS
// =============================================================================

function testValidConfigs(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1.1: Full valid config passes validation
  {
    const config = createValidConfig();
    let passed = true;
    let errorMsg: string | undefined;
    try {
      validateAdminConfig(config);
    } catch (e) {
      passed = false;
      errorMsg = (e as Error).message;
    }
    results.push({
      testId: 'AC-001',
      description: 'Full valid config passes validation',
      passed,
      error: errorMsg,
    });
  }

  // Test 1.2: Config with partial multipliers (not all slots)
  {
    const config = createValidConfig({
      multipliers: { 1: 20, 5: 10, 11: 1 }, // Only 3 slots configured
    });
    let passed = true;
    try {
      validateAdminConfig(config);
    } catch {
      passed = false;
    }
    results.push({
      testId: 'AC-002',
      description: 'Partial config (some slots only) passes validation',
      passed,
    });
  }

  // Test 1.3: Config with zero multiplier (valid)
  {
    const config = createValidConfig({
      multipliers: { 1: 0, 2: 5 },
    });
    let passed = true;
    try {
      validateAdminConfig(config);
    } catch {
      passed = false;
    }
    results.push({
      testId: 'AC-003',
      description: 'Zero multiplier is valid',
      passed,
    });
  }

  // Test 1.4: Config with fractional multiplier (valid)
  {
    const config = createValidConfig({
      multipliers: { 1: 2.5, 2: 1.75, 3: 0.5 },
    });
    let passed = true;
    try {
      validateAdminConfig(config);
    } catch {
      passed = false;
    }
    results.push({
      testId: 'AC-004',
      description: 'Fractional multipliers are valid',
      passed,
    });
  }

  // Test 1.5: Config with very large multiplier (valid)
  {
    const config = createValidConfig({
      multipliers: { 1: 1000000 },
    });
    let passed = true;
    try {
      validateAdminConfig(config);
    } catch {
      passed = false;
    }
    results.push({
      testId: 'AC-005',
      description: 'Very large multiplier is valid',
      passed,
    });
  }

  // Test 1.6: Empty multipliers object (valid - all slots disabled)
  {
    const config = createValidConfig({
      multipliers: {},
    });
    let passed = true;
    try {
      validateAdminConfig(config);
    } catch {
      passed = false;
    }
    results.push({
      testId: 'AC-006',
      description: 'Empty multipliers object is valid',
      passed,
    });
  }

  return results;
}

// =============================================================================
// TEST 2: INVALID SLOT INDICES
// =============================================================================

function testInvalidSlotIndices(): TestResult[] {
  const results: TestResult[] = [];

  // Test 2.1: Slot 0 (invalid - too low)
  {
    const config = createValidConfig({
      multipliers: { 0: 10 } as any,
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_SLOT_INDEX;
      }
    }
    results.push({
      testId: 'AC-007',
      description: 'Slot 0 throws INVALID_SLOT_INDEX error',
      passed: threw && correctCode,
      error: threw && correctCode ? undefined : 'Did not throw correct error',
    });
  }

  // Test 2.2: Slot 12 (invalid - too high)
  {
    const config = createValidConfig({
      multipliers: { 12: 10 } as any,
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_SLOT_INDEX;
      }
    }
    results.push({
      testId: 'AC-008',
      description: 'Slot 12 throws INVALID_SLOT_INDEX error',
      passed: threw && correctCode,
    });
  }

  // Test 2.3: Negative slot (-1)
  {
    const config = createValidConfig({
      multipliers: { '-1': 10 } as any,
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_SLOT_INDEX;
      }
    }
    results.push({
      testId: 'AC-009',
      description: 'Negative slot (-1) throws INVALID_SLOT_INDEX error',
      passed: threw && correctCode,
    });
  }

  // Test 2.4: Float slot (5.5)
  {
    const config = createValidConfig({
      multipliers: { '5.5': 10 } as any,
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_SLOT_INDEX;
      }
    }
    results.push({
      testId: 'AC-010',
      description: 'Float slot (5.5) throws INVALID_SLOT_INDEX error',
      passed: threw && correctCode,
    });
  }

  // Test 2.5: Very large slot (100)
  {
    const config = createValidConfig({
      multipliers: { 100: 10 } as any,
    });
    let threw = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
    }
    results.push({
      testId: 'AC-011',
      description: 'Slot 100 throws error',
      passed: threw,
    });
  }

  return results;
}

// =============================================================================
// TEST 3: NEGATIVE MULTIPLIERS
// =============================================================================

function testNegativeMultipliers(): TestResult[] {
  const results: TestResult[] = [];

  // Test 3.1: Negative multiplier (-1)
  {
    const config = createValidConfig({
      multipliers: { 1: -1 },
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_MULTIPLIER_NEGATIVE;
      }
    }
    results.push({
      testId: 'AC-012',
      description: 'Negative multiplier (-1) throws INVALID_MULTIPLIER_NEGATIVE error',
      passed: threw && correctCode,
      error: threw && correctCode ? undefined : 'Did not throw correct error',
    });
  }

  // Test 3.2: Very negative multiplier (-100)
  {
    const config = createValidConfig({
      multipliers: { 5: -100 },
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_MULTIPLIER_NEGATIVE;
      }
    }
    results.push({
      testId: 'AC-013',
      description: 'Very negative multiplier (-100) throws error',
      passed: threw && correctCode,
    });
  }

  // Test 3.3: Small negative multiplier (-0.001)
  {
    const config = createValidConfig({
      multipliers: { 3: -0.001 },
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_MULTIPLIER_NEGATIVE;
      }
    }
    results.push({
      testId: 'AC-014',
      description: 'Small negative multiplier (-0.001) throws error',
      passed: threw && correctCode,
    });
  }

  // Test 3.4: Error includes slot number context
  {
    const config = createValidConfig({
      multipliers: { 7: -5 },
    });
    let correctSlot = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      if (e instanceof AdminConfigError) {
        correctSlot = e.slotNumber === 7;
      }
    }
    results.push({
      testId: 'AC-015',
      description: 'Error includes correct slot number (7)',
      passed: correctSlot,
    });
  }

  return results;
}

// =============================================================================
// TEST 4: NaN MULTIPLIERS
// =============================================================================

function testNaNMultipliers(): TestResult[] {
  const results: TestResult[] = [];

  // Test 4.1: NaN multiplier
  {
    const config = createValidConfig({
      multipliers: { 1: NaN },
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_MULTIPLIER_NAN;
      }
    }
    results.push({
      testId: 'AC-016',
      description: 'NaN multiplier throws INVALID_MULTIPLIER_NAN error',
      passed: threw && correctCode,
      error: threw && correctCode ? undefined : 'Did not throw correct error',
    });
  }

  // Test 4.2: Multiple NaN values
  {
    const config = createValidConfig({
      multipliers: { 1: NaN, 5: NaN, 11: NaN },
    });
    const result = validateAdminConfigSafe(config);
    const nanErrors = result.errors.filter(
      e => e.code === AdminConfigErrorCode.INVALID_MULTIPLIER_NAN
    );
    results.push({
      testId: 'AC-017',
      description: 'Multiple NaN values produce multiple errors',
      passed: nanErrors.length === 3,
      error: nanErrors.length === 3 ? undefined : `Expected 3 errors, got ${nanErrors.length}`,
    });
  }

  return results;
}

// =============================================================================
// TEST 5: INFINITY MULTIPLIERS
// =============================================================================

function testInfinityMultipliers(): TestResult[] {
  const results: TestResult[] = [];

  // Test 5.1: Positive Infinity
  {
    const config = createValidConfig({
      multipliers: { 1: Infinity },
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_MULTIPLIER_INFINITY;
      }
    }
    results.push({
      testId: 'AC-018',
      description: 'Infinity throws INVALID_MULTIPLIER_INFINITY error',
      passed: threw && correctCode,
      error: threw && correctCode ? undefined : 'Did not throw correct error',
    });
  }

  // Test 5.2: Negative Infinity
  {
    const config = createValidConfig({
      multipliers: { 5: -Infinity },
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        // -Infinity is caught by INFINITY check (not finite)
        correctCode = e.code === AdminConfigErrorCode.INVALID_MULTIPLIER_INFINITY;
      }
    }
    results.push({
      testId: 'AC-019',
      description: '-Infinity throws INVALID_MULTIPLIER_INFINITY error',
      passed: threw && correctCode,
    });
  }

  return results;
}

// =============================================================================
// TEST 6: MISSING/EMPTY REQUIRED FIELDS
// =============================================================================

function testMissingFields(): TestResult[] {
  const results: TestResult[] = [];

  // Test 6.1: Empty matchId
  {
    const config = createValidConfig({
      matchId: '',
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_MATCH_ID;
      }
    }
    results.push({
      testId: 'AC-020',
      description: 'Empty matchId throws INVALID_MATCH_ID error',
      passed: threw && correctCode,
    });
  }

  // Test 6.2: Whitespace-only matchId
  {
    const config = createValidConfig({
      matchId: '   ',
    });
    let threw = false;
    try {
      validateAdminConfig(config);
    } catch {
      threw = true;
    }
    results.push({
      testId: 'AC-021',
      description: 'Whitespace-only matchId throws error',
      passed: threw,
    });
  }

  // Test 6.3: Empty configuredBy
  {
    const config = createValidConfig({
      configuredBy: '',
    });
    let threw = false;
    let correctCode = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      threw = true;
      if (e instanceof AdminConfigError) {
        correctCode = e.code === AdminConfigErrorCode.INVALID_CONFIGURED_BY;
      }
    }
    results.push({
      testId: 'AC-022',
      description: 'Empty configuredBy throws INVALID_CONFIGURED_BY error',
      passed: threw && correctCode,
    });
  }

  return results;
}

// =============================================================================
// TEST 7: DISABLED SLOTS HANDLING
// =============================================================================

function testDisabledSlots(): TestResult[] {
  const results: TestResult[] = [];

  // Test 7.1: Valid disabled slots array
  {
    const config = createValidConfig({
      disabledSlots: [1, 5, 11],
    });
    let passed = true;
    try {
      validateAdminConfig(config);
    } catch {
      passed = false;
    }
    results.push({
      testId: 'AC-023',
      description: 'Valid disabledSlots array passes validation',
      passed,
    });
  }

  // Test 7.2: Invalid slot in disabledSlots
  {
    const config = createValidConfig({
      disabledSlots: [1, 0, 11] as any, // 0 is invalid
    });
    let threw = false;
    try {
      validateAdminConfig(config);
    } catch {
      threw = true;
    }
    results.push({
      testId: 'AC-024',
      description: 'Invalid slot in disabledSlots throws error',
      passed: threw,
    });
  }

  // Test 7.3: Resolved config marks disabled slots correctly
  {
    const config = createValidConfig({
      multipliers: { 1: 20, 5: 10 },
      disabledSlots: [5],
    });
    const resolved = resolveAdminConfig(config);
    const slot5Disabled = !resolved.slots[5].isEnabled;
    const slot1Enabled = resolved.slots[1].isEnabled;
    results.push({
      testId: 'AC-025',
      description: 'Resolved config marks disabled slots correctly',
      passed: slot5Disabled && slot1Enabled,
      error: slot5Disabled && slot1Enabled 
        ? undefined 
        : `Slot 5 enabled: ${!slot5Disabled}, Slot 1 enabled: ${slot1Enabled}`,
    });
  }

  return results;
}

// =============================================================================
// TEST 8: RESOLUTION AND EXTRACTION
// =============================================================================

function testResolutionAndExtraction(): TestResult[] {
  const results: TestResult[] = [];

  // Test 8.1: Resolution produces all 11 slots
  {
    const config = createValidConfig({
      multipliers: { 1: 20 }, // Only slot 1 configured
    });
    const resolved = resolveAdminConfig(config);
    const slotCount = Object.keys(resolved.slots).length;
    results.push({
      testId: 'AC-026',
      description: 'Resolution produces all 11 slots',
      passed: slotCount === 11,
      error: slotCount === 11 ? undefined : `Expected 11 slots, got ${slotCount}`,
    });
  }

  // Test 8.2: Missing slots default to disabled (1×)
  {
    const config = createValidConfig({
      multipliers: { 1: 20 },
    });
    const resolved = resolveAdminConfig(config);
    const slot5 = resolved.slots[5];
    results.push({
      testId: 'AC-027',
      description: 'Missing slots default to 1× and disabled',
      passed: slot5.multiplier === DEFAULT_DISABLED_MULTIPLIER && !slot5.isEnabled,
    });
  }

  // Test 8.3: Resolution includes Constitution version
  {
    const config = createValidConfig();
    const resolved = resolveAdminConfig(config);
    results.push({
      testId: 'AC-028',
      description: 'Resolution includes Constitution version',
      passed: resolved.constitutionVersion === CONSTITUTION_VERSION,
    });
  }

  // Test 8.4: extractMultipliers returns correct values
  {
    const config = createValidConfig({
      multipliers: { 1: 20, 5: 10 },
      disabledSlots: [5],
    });
    const resolved = resolveAdminConfig(config);
    const multipliers = extractMultipliers(resolved);
    
    // Slot 1 should be 20 (configured, enabled)
    // Slot 5 should be 1 (configured but disabled)
    // Slot 3 should be 1 (not configured)
    const correct = multipliers[1] === 20 && multipliers[5] === 1 && multipliers[3] === 1;
    results.push({
      testId: 'AC-029',
      description: 'extractMultipliers returns correct values for enabled/disabled/missing',
      passed: correct,
      error: correct 
        ? undefined 
        : `Slot1=${multipliers[1]}, Slot5=${multipliers[5]}, Slot3=${multipliers[3]}`,
    });
  }

  // Test 8.5: createDefaultAdminConfig produces valid config
  {
    const config = createDefaultAdminConfig('match-test', 'admin-test');
    let passed = true;
    try {
      validateAdminConfig(config);
    } catch {
      passed = false;
    }
    results.push({
      testId: 'AC-030',
      description: 'createDefaultAdminConfig produces valid config',
      passed,
    });
  }

  // Test 8.6: createDescendingMultiplierConfig produces valid config
  {
    const config = createDescendingMultiplierConfig('match-test', 'admin-test', 20);
    let passed = true;
    try {
      validateAdminConfig(config);
    } catch {
      passed = false;
    }
    results.push({
      testId: 'AC-031',
      description: 'createDescendingMultiplierConfig produces valid config',
      passed,
    });
  }

  // Test 8.7: Descending config has correct order
  {
    const config = createDescendingMultiplierConfig('match-test', 'admin-test', 20);
    const slot1Higher = (config.multipliers[1] ?? 0) > (config.multipliers[11] ?? 0);
    results.push({
      testId: 'AC-032',
      description: 'Descending config: Slot 1 > Slot 11',
      passed: slot1Higher,
    });
  }

  return results;
}

// =============================================================================
// TEST 9: HELPER FUNCTIONS
// =============================================================================

function testHelperFunctions(): TestResult[] {
  const results: TestResult[] = [];

  // Test 9.1: hasActiveMultipliers - with active
  {
    const config = createValidConfig({
      multipliers: { 1: 20, 2: 15 },
    });
    const resolved = resolveAdminConfig(config);
    results.push({
      testId: 'AC-033',
      description: 'hasActiveMultipliers returns true when multipliers > 1',
      passed: hasActiveMultipliers(resolved) === true,
    });
  }

  // Test 9.2: hasActiveMultipliers - all at 1×
  {
    const config = createValidConfig({
      multipliers: { 1: 1, 2: 1, 3: 1 },
    });
    const resolved = resolveAdminConfig(config);
    results.push({
      testId: 'AC-034',
      description: 'hasActiveMultipliers returns false when all multipliers = 1',
      passed: hasActiveMultipliers(resolved) === false,
    });
  }

  // Test 9.3: getMaxMultiplier
  {
    const config = createValidConfig({
      multipliers: { 1: 20, 5: 50, 11: 5 },
    });
    const resolved = resolveAdminConfig(config);
    const max = getMaxMultiplier(resolved);
    results.push({
      testId: 'AC-035',
      description: 'getMaxMultiplier returns correct max (50)',
      passed: max === 50,
      error: max === 50 ? undefined : `Expected 50, got ${max}`,
    });
  }

  // Test 9.4: getMaxMultiplier with disabled highest
  {
    const config = createValidConfig({
      multipliers: { 1: 20, 5: 50 },
      disabledSlots: [5], // Highest is disabled
    });
    const resolved = resolveAdminConfig(config);
    const max = getMaxMultiplier(resolved);
    results.push({
      testId: 'AC-036',
      description: 'getMaxMultiplier ignores disabled slots',
      passed: max === 20,
      error: max === 20 ? undefined : `Expected 20, got ${max}`,
    });
  }

  return results;
}

// =============================================================================
// TEST 10: VALIDATION RESULT DETAILS
// =============================================================================

function testValidationDetails(): TestResult[] {
  const results: TestResult[] = [];

  // Test 10.1: Safe validation returns all errors
  {
    const config = createValidConfig({
      matchId: '',
      multipliers: { 0: -1, 5: NaN, 12: Infinity } as any,
    });
    const result = validateAdminConfigSafe(config);
    // Should have: INVALID_MATCH_ID, INVALID_SLOT_INDEX (0), INVALID_MULTIPLIER_NEGATIVE,
    // INVALID_MULTIPLIER_NAN, INVALID_SLOT_INDEX (12)
    results.push({
      testId: 'AC-037',
      description: 'Safe validation returns multiple errors',
      passed: result.errors.length >= 4,
      error: result.errors.length >= 4 
        ? undefined 
        : `Expected ≥4 errors, got ${result.errors.length}`,
    });
  }

  // Test 10.2: AdminConfigError includes validationErrors array
  {
    const config = createValidConfig({
      multipliers: { 1: -1, 5: NaN },
    });
    let hasErrorsArray = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      if (e instanceof AdminConfigError) {
        hasErrorsArray = Array.isArray(e.validationErrors) && e.validationErrors.length > 0;
      }
    }
    results.push({
      testId: 'AC-038',
      description: 'AdminConfigError includes validationErrors array',
      passed: hasErrorsArray,
    });
  }

  // Test 10.3: Error message includes all errors when multiple
  {
    const config = createValidConfig({
      multipliers: { 1: -1, 5: NaN, 11: Infinity },
    });
    let hasMultipleInMessage = false;
    try {
      validateAdminConfig(config);
    } catch (e) {
      if (e instanceof AdminConfigError) {
        hasMultipleInMessage = e.message.includes('3 errors');
      }
    }
    results.push({
      testId: 'AC-039',
      description: 'Error message mentions count when multiple errors',
      passed: hasMultipleInMessage,
    });
  }

  return results;
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

export interface AdminConfigTestSuiteResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: TestResult[];
  readonly executionTimeMs: number;
}

export function runAdminConfigTests(): AdminConfigTestSuiteResult {
  const startTime = performance.now();

  const allResults: TestResult[] = [
    ...testValidConfigs(),
    ...testInvalidSlotIndices(),
    ...testNegativeMultipliers(),
    ...testNaNMultipliers(),
    ...testInfinityMultipliers(),
    ...testMissingFields(),
    ...testDisabledSlots(),
    ...testResolutionAndExtraction(),
    ...testHelperFunctions(),
    ...testValidationDetails(),
  ];

  const endTime = performance.now();

  return {
    totalTests: allResults.length,
    passed: allResults.filter(r => r.passed).length,
    failed: allResults.filter(r => !r.passed).length,
    results: allResults,
    executionTimeMs: endTime - startTime,
  };
}

// =============================================================================
// CONSOLE REPORTER
// =============================================================================

function printAdminConfigTestResults(
  suiteResult: AdminConfigTestSuiteResult
): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — ADMIN CONFIG VALIDATION UNIT TESTS');
  console.log('Authority: Constitution.md v1.0, Section 11 (Admin Powers)');
  console.log('='.repeat(70) + '\n');

  console.log(`Total tests: ${suiteResult.totalTests}`);
  console.log('\n' + '-'.repeat(70) + '\n');

  for (const result of suiteResult.results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const statusColor = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${statusColor}${status}${reset} [${result.testId}] ${result.description}`);

    if (!result.passed && result.error) {
      console.log(`       └─ ${result.error}`);
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`\nRESULTS: ${suiteResult.passed}/${suiteResult.totalTests} passed`);
  console.log(`Execution time: ${suiteResult.executionTimeMs.toFixed(2)}ms`);

  if (suiteResult.failed > 0) {
    console.log(`\n\x1b[31m✗ ${suiteResult.failed} TEST(S) FAILED\x1b[0m`);
  } else {
    console.log(`\n\x1b[32m✓ ALL TESTS PASSED\x1b[0m`);
    console.log('Admin config validation enforces governance boundaries');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runAdminConfigTests();
  printAdminConfigTestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printAdminConfigTestResults };
