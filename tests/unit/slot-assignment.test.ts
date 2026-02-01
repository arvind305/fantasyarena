/**
 * IPL Friends Betting Game — Slot Assignment Unit Tests
 * 
 * Authority: Constitution.md v1.0, Section 2.3 (Player Picks)
 * 
 * TEST COVERAGE:
 * 1. All slots filled
 * 2. Some slots empty
 * 3. All slots empty
 * 4. Single slot filled
 * 5. Order preservation (slot index integrity)
 * 6. Sparse input handling
 * 7. Explicit null preservation
 * 8. Helper function tests
 */

import {
  resolveSlotAssignments,
  toSlotAssignmentEntries,
  getFilledSlots,
  getEmptySlots,
  countFilledSlots,
  countEmptySlots,
  isSlotFilled,
  getPlayerAtSlot,
  createEmptySlotAssignmentMap,
  isValidSlotIndex,
  ALL_SLOT_INDICES,
  SLOT_COUNT,
  type SlotIndex,
  type SlotAssignmentMap,
  type ResolvedSlotAssignmentMap,
} from './slot-assignment';

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
// TEST DATA
// =============================================================================

/**
 * All slots filled (11 players)
 */
const ALL_FILLED_INPUT: SlotAssignmentMap = {
  1: 'player-01',
  2: 'player-02',
  3: 'player-03',
  4: 'player-04',
  5: 'player-05',
  6: 'player-06',
  7: 'player-07',
  8: 'player-08',
  9: 'player-09',
  10: 'player-10',
  11: 'player-11',
};

/**
 * Some slots empty (slots 3, 7, 11 empty)
 */
const SOME_EMPTY_INPUT: SlotAssignmentMap = {
  1: 'player-01',
  2: 'player-02',
  // 3: empty (missing)
  4: 'player-04',
  5: 'player-05',
  6: 'player-06',
  // 7: empty (missing)
  8: 'player-08',
  9: 'player-09',
  10: 'player-10',
  // 11: empty (missing)
};

/**
 * Some slots explicitly null
 */
const EXPLICIT_NULL_INPUT: SlotAssignmentMap = {
  1: 'player-01',
  2: null, // Explicit null
  3: 'player-03',
  4: null, // Explicit null
  5: 'player-05',
};

/**
 * All slots empty (no input)
 */
const ALL_EMPTY_INPUT: SlotAssignmentMap = {};

/**
 * Single slot filled
 */
const SINGLE_FILLED_INPUT: SlotAssignmentMap = {
  5: 'only-player',
};

/**
 * Non-sequential slots filled
 */
const NON_SEQUENTIAL_INPUT: SlotAssignmentMap = {
  1: 'first',
  6: 'middle',
  11: 'last',
};

// =============================================================================
// TEST CASES
// =============================================================================

function runResolveTests(): TestResult[] {
  const results: TestResult[] = [];

  // -------------------------------------------------------------------------
  // Test 1: All slots filled
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotAssignments(ALL_FILLED_INPUT);
    
    // Check all 11 slots are present
    let allPresent = true;
    for (const idx of ALL_SLOT_INDICES) {
      if (!(idx in resolved)) {
        allPresent = false;
        break;
      }
    }
    
    results.push({
      testId: 'SA-001',
      description: 'All slots filled: all 11 slots present in output',
      passed: allPresent,
      error: allPresent ? undefined : 'Not all slots present',
    });

    // Check all assignments preserved
    let allPreserved = true;
    for (const idx of ALL_SLOT_INDICES) {
      if (resolved[idx] !== `player-${String(idx).padStart(2, '0')}`) {
        allPreserved = false;
        break;
      }
    }

    results.push({
      testId: 'SA-002',
      description: 'All slots filled: all player assignments preserved',
      passed: allPreserved,
      error: allPreserved ? undefined : 'Player assignments not preserved',
    });

    // Check no nulls when all filled
    const nullCount = Object.values(resolved).filter(v => v === null).length;
    results.push({
      testId: 'SA-003',
      description: 'All slots filled: no null values',
      passed: nullCount === 0,
      error: nullCount === 0 ? undefined : `Found ${nullCount} null values`,
    });
  }

  // -------------------------------------------------------------------------
  // Test 2: Some slots empty
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotAssignments(SOME_EMPTY_INPUT);

    // Check empty slots are null
    const emptySlots: SlotIndex[] = [3, 7, 11];
    let emptyCorrect = true;
    for (const idx of emptySlots) {
      if (resolved[idx] !== null) {
        emptyCorrect = false;
        break;
      }
    }

    results.push({
      testId: 'SA-004',
      description: 'Some slots empty: missing slots become null',
      passed: emptyCorrect,
      error: emptyCorrect ? undefined : 'Missing slots not set to null',
    });

    // Check filled slots preserved
    const filledSlots: SlotIndex[] = [1, 2, 4, 5, 6, 8, 9, 10];
    let filledCorrect = true;
    for (const idx of filledSlots) {
      const expected = `player-${String(idx).padStart(2, '0')}`;
      if (resolved[idx] !== expected) {
        filledCorrect = false;
        break;
      }
    }

    results.push({
      testId: 'SA-005',
      description: 'Some slots empty: filled slots preserved',
      passed: filledCorrect,
      error: filledCorrect ? undefined : 'Filled slots not preserved',
    });

    // Check total count
    const totalSlots = Object.keys(resolved).length;
    results.push({
      testId: 'SA-006',
      description: 'Some slots empty: output has exactly 11 slots',
      passed: totalSlots === 11,
      error: totalSlots === 11 ? undefined : `Expected 11 slots, got ${totalSlots}`,
    });
  }

  // -------------------------------------------------------------------------
  // Test 3: All slots empty
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotAssignments(ALL_EMPTY_INPUT);

    // Check all slots present
    const totalSlots = Object.keys(resolved).length;
    results.push({
      testId: 'SA-007',
      description: 'All slots empty: output has exactly 11 slots',
      passed: totalSlots === 11,
      error: totalSlots === 11 ? undefined : `Expected 11 slots, got ${totalSlots}`,
    });

    // Check all slots are null
    let allNull = true;
    for (const idx of ALL_SLOT_INDICES) {
      if (resolved[idx] !== null) {
        allNull = false;
        break;
      }
    }

    results.push({
      testId: 'SA-008',
      description: 'All slots empty: all slots are null',
      passed: allNull,
      error: allNull ? undefined : 'Not all slots are null',
    });
  }

  // -------------------------------------------------------------------------
  // Test 4: Single slot filled
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotAssignments(SINGLE_FILLED_INPUT);

    // Check slot 5 has the player
    results.push({
      testId: 'SA-009',
      description: 'Single slot filled: slot 5 has correct player',
      passed: resolved[5] === 'only-player',
      error: resolved[5] === 'only-player' ? undefined : `Slot 5 has ${resolved[5]}`,
    });

    // Check other slots are null
    let othersNull = true;
    for (const idx of ALL_SLOT_INDICES) {
      if (idx !== 5 && resolved[idx] !== null) {
        othersNull = false;
        break;
      }
    }

    results.push({
      testId: 'SA-010',
      description: 'Single slot filled: other slots are null',
      passed: othersNull,
      error: othersNull ? undefined : 'Other slots not null',
    });

    // Check filled count
    const filledCount = countFilledSlots(resolved);
    results.push({
      testId: 'SA-011',
      description: 'Single slot filled: countFilledSlots returns 1',
      passed: filledCount === 1,
      error: filledCount === 1 ? undefined : `Expected 1, got ${filledCount}`,
    });

    // Check empty count
    const emptyCount = countEmptySlots(resolved);
    results.push({
      testId: 'SA-012',
      description: 'Single slot filled: countEmptySlots returns 10',
      passed: emptyCount === 10,
      error: emptyCount === 10 ? undefined : `Expected 10, got ${emptyCount}`,
    });
  }

  // -------------------------------------------------------------------------
  // Test 5: Order preservation (slot index integrity)
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotAssignments(NON_SEQUENTIAL_INPUT);
    const entries = toSlotAssignmentEntries(resolved);

    // Check entries are in order 1-11
    let orderCorrect = true;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].slotIndex !== (i + 1)) {
        orderCorrect = false;
        break;
      }
    }

    results.push({
      testId: 'SA-013',
      description: 'Order preservation: entries returned in slot index order',
      passed: orderCorrect,
      error: orderCorrect ? undefined : 'Entries not in order',
    });

    // Check specific positions preserved
    results.push({
      testId: 'SA-014',
      description: 'Order preservation: slot 1 has "first"',
      passed: resolved[1] === 'first',
      error: resolved[1] === 'first' ? undefined : `Slot 1 has ${resolved[1]}`,
    });

    results.push({
      testId: 'SA-015',
      description: 'Order preservation: slot 6 has "middle"',
      passed: resolved[6] === 'middle',
      error: resolved[6] === 'middle' ? undefined : `Slot 6 has ${resolved[6]}`,
    });

    results.push({
      testId: 'SA-016',
      description: 'Order preservation: slot 11 has "last"',
      passed: resolved[11] === 'last',
      error: resolved[11] === 'last' ? undefined : `Slot 11 has ${resolved[11]}`,
    });
  }

  // -------------------------------------------------------------------------
  // Test 6: Explicit null preservation
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotAssignments(EXPLICIT_NULL_INPUT);

    results.push({
      testId: 'SA-017',
      description: 'Explicit null: slot 2 (explicit null) is null',
      passed: resolved[2] === null,
      error: resolved[2] === null ? undefined : `Slot 2 has ${resolved[2]}`,
    });

    results.push({
      testId: 'SA-018',
      description: 'Explicit null: slot 4 (explicit null) is null',
      passed: resolved[4] === null,
      error: resolved[4] === null ? undefined : `Slot 4 has ${resolved[4]}`,
    });

    results.push({
      testId: 'SA-019',
      description: 'Explicit null: slot 1 has player',
      passed: resolved[1] === 'player-01',
      error: resolved[1] === 'player-01' ? undefined : `Slot 1 has ${resolved[1]}`,
    });
  }

  return results;
}

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

function runHelperTests(): TestResult[] {
  const results: TestResult[] = [];
  const resolved = resolveSlotAssignments(SOME_EMPTY_INPUT);

  // -------------------------------------------------------------------------
  // getFilledSlots
  // -------------------------------------------------------------------------
  {
    const filled = getFilledSlots(resolved);
    
    results.push({
      testId: 'SA-HELPER-001',
      description: 'getFilledSlots: returns correct count',
      passed: filled.length === 8,
      error: filled.length === 8 ? undefined : `Expected 8, got ${filled.length}`,
    });

    // Check order preserved
    let orderCorrect = true;
    const expectedOrder: SlotIndex[] = [1, 2, 4, 5, 6, 8, 9, 10];
    for (let i = 0; i < filled.length; i++) {
      if (filled[i].slotIndex !== expectedOrder[i]) {
        orderCorrect = false;
        break;
      }
    }

    results.push({
      testId: 'SA-HELPER-002',
      description: 'getFilledSlots: maintains slot order',
      passed: orderCorrect,
      error: orderCorrect ? undefined : 'Order not preserved',
    });
  }

  // -------------------------------------------------------------------------
  // getEmptySlots
  // -------------------------------------------------------------------------
  {
    const empty = getEmptySlots(resolved);

    results.push({
      testId: 'SA-HELPER-003',
      description: 'getEmptySlots: returns correct count',
      passed: empty.length === 3,
      error: empty.length === 3 ? undefined : `Expected 3, got ${empty.length}`,
    });

    // Check specific empty slots
    const emptyIndices = empty.map(e => e.slotIndex);
    const hasExpected = emptyIndices.includes(3) && 
                        emptyIndices.includes(7) && 
                        emptyIndices.includes(11);

    results.push({
      testId: 'SA-HELPER-004',
      description: 'getEmptySlots: returns slots 3, 7, 11',
      passed: hasExpected,
      error: hasExpected ? undefined : `Got indices: ${emptyIndices.join(', ')}`,
    });
  }

  // -------------------------------------------------------------------------
  // isSlotFilled
  // -------------------------------------------------------------------------
  {
    results.push({
      testId: 'SA-HELPER-005',
      description: 'isSlotFilled: returns true for filled slot',
      passed: isSlotFilled(resolved, 1) === true,
    });

    results.push({
      testId: 'SA-HELPER-006',
      description: 'isSlotFilled: returns false for empty slot',
      passed: isSlotFilled(resolved, 3) === false,
    });
  }

  // -------------------------------------------------------------------------
  // getPlayerAtSlot
  // -------------------------------------------------------------------------
  {
    results.push({
      testId: 'SA-HELPER-007',
      description: 'getPlayerAtSlot: returns player ID for filled slot',
      passed: getPlayerAtSlot(resolved, 1) === 'player-01',
    });

    results.push({
      testId: 'SA-HELPER-008',
      description: 'getPlayerAtSlot: returns null for empty slot',
      passed: getPlayerAtSlot(resolved, 3) === null,
    });
  }

  // -------------------------------------------------------------------------
  // createEmptySlotAssignmentMap
  // -------------------------------------------------------------------------
  {
    const empty = createEmptySlotAssignmentMap();

    results.push({
      testId: 'SA-HELPER-009',
      description: 'createEmptySlotAssignmentMap: has 11 slots',
      passed: Object.keys(empty).length === 11,
    });

    let allNull = true;
    for (const idx of ALL_SLOT_INDICES) {
      if (empty[idx] !== null) {
        allNull = false;
        break;
      }
    }

    results.push({
      testId: 'SA-HELPER-010',
      description: 'createEmptySlotAssignmentMap: all slots are null',
      passed: allNull,
    });
  }

  // -------------------------------------------------------------------------
  // isValidSlotIndex
  // -------------------------------------------------------------------------
  {
    results.push({
      testId: 'SA-HELPER-011',
      description: 'isValidSlotIndex: 1 is valid',
      passed: isValidSlotIndex(1) === true,
    });

    results.push({
      testId: 'SA-HELPER-012',
      description: 'isValidSlotIndex: 11 is valid',
      passed: isValidSlotIndex(11) === true,
    });

    results.push({
      testId: 'SA-HELPER-013',
      description: 'isValidSlotIndex: 0 is invalid',
      passed: isValidSlotIndex(0) === false,
    });

    results.push({
      testId: 'SA-HELPER-014',
      description: 'isValidSlotIndex: 12 is invalid',
      passed: isValidSlotIndex(12) === false,
    });

    results.push({
      testId: 'SA-HELPER-015',
      description: 'isValidSlotIndex: 5.5 is invalid',
      passed: isValidSlotIndex(5.5) === false,
    });

    results.push({
      testId: 'SA-HELPER-016',
      description: 'isValidSlotIndex: -1 is invalid',
      passed: isValidSlotIndex(-1) === false,
    });
  }

  // -------------------------------------------------------------------------
  // Constants
  // -------------------------------------------------------------------------
  {
    results.push({
      testId: 'SA-CONST-001',
      description: 'SLOT_COUNT equals 11',
      passed: SLOT_COUNT === 11,
    });

    results.push({
      testId: 'SA-CONST-002',
      description: 'ALL_SLOT_INDICES has 11 elements',
      passed: ALL_SLOT_INDICES.length === 11,
    });

    results.push({
      testId: 'SA-CONST-003',
      description: 'ALL_SLOT_INDICES starts with 1',
      passed: ALL_SLOT_INDICES[0] === 1,
    });

    results.push({
      testId: 'SA-CONST-004',
      description: 'ALL_SLOT_INDICES ends with 11',
      passed: ALL_SLOT_INDICES[10] === 11,
    });
  }

  return results;
}

// =============================================================================
// DETERMINISM TESTS
// =============================================================================

function runDeterminismTests(): TestResult[] {
  const results: TestResult[] = [];

  // Run resolve multiple times and verify identical results
  const input = SOME_EMPTY_INPUT;
  const result1 = resolveSlotAssignments(input);
  const result2 = resolveSlotAssignments(input);
  const result3 = resolveSlotAssignments(input);

  let allIdentical = true;
  for (const idx of ALL_SLOT_INDICES) {
    if (result1[idx] !== result2[idx] || result2[idx] !== result3[idx]) {
      allIdentical = false;
      break;
    }
  }

  results.push({
    testId: 'SA-DET-001',
    description: 'Determinism: multiple calls produce identical results',
    passed: allIdentical,
    error: allIdentical ? undefined : 'Results differ across calls',
  });

  return results;
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

export interface SlotAssignmentTestSuiteResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: TestResult[];
  readonly executionTimeMs: number;
}

export function runSlotAssignmentTests(): SlotAssignmentTestSuiteResult {
  const startTime = performance.now();

  const resolveResults = runResolveTests();
  const helperResults = runHelperTests();
  const determinismResults = runDeterminismTests();

  const allResults = [
    ...resolveResults,
    ...helperResults,
    ...determinismResults,
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

function printSlotAssignmentTestResults(
  suiteResult: SlotAssignmentTestSuiteResult
): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — SLOT ASSIGNMENT UNIT TESTS');
  console.log('Authority: Constitution.md v1.0, Section 2.3 (Player Picks)');
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
    console.log('Slot assignment resolution is Constitution-compliant');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runSlotAssignmentTests();
  printSlotAssignmentTestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printSlotAssignmentTestResults };
