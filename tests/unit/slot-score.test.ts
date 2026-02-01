/**
 * IPL Friends Betting Game — Slot Score Unit Tests
 * 
 * Authority: Constitution.md v1.0, Section 5 (Multipliers)
 * 
 * TEST COVERAGE:
 * 1. Standard multiplier (e.g., 5×)
 * 2. Disabled multiplier (1×)
 * 3. Fractional multiplier (e.g., 2.5×)
 * 4. Very small float player scores
 * 5. Large multipliers (e.g., 100×)
 * 6. Zero player score
 * 7. Non-negativity enforcement
 * 8. Precision preservation (no rounding)
 */

import {
  computeSlotScore,
  computeSlotScoreWithDetails,
  computeSlotScoresBatch,
  type SlotScoreInput,
  type SlotScoreBatchEntry,
} from './slot-score';

// =============================================================================
// TEST INFRASTRUCTURE
// =============================================================================

interface TestCase {
  readonly id: string;
  readonly description: string;
  readonly playerFinalScore: number;
  readonly slotMultiplier: number;
  readonly expectedSlotScore: number;
}

interface TestResult {
  readonly testId: string;
  readonly description: string;
  readonly passed: boolean;
  readonly expected: number;
  readonly actual: number;
  readonly error?: string;
}

/**
 * Float comparison with tolerance for floating-point precision
 */
function floatsEqual(a: number, b: number, tolerance = 1e-12): boolean {
  if (b === 0) return Math.abs(a) < tolerance;
  return Math.abs((a - b) / Math.max(Math.abs(a), Math.abs(b))) < tolerance;
}

// =============================================================================
// TEST CASES
// =============================================================================

const TEST_CASES: readonly TestCase[] = [
  // -------------------------------------------------------------------------
  // 1. Standard multiplier (5×)
  // -------------------------------------------------------------------------
  {
    id: 'SS-001',
    description: 'Standard multiplier 5×: 100 × 5 = 500',
    playerFinalScore: 100,
    slotMultiplier: 5,
    expectedSlotScore: 500,
  },
  {
    id: 'SS-002',
    description: 'Standard multiplier 10×: 250.5 × 10 = 2505',
    playerFinalScore: 250.5,
    slotMultiplier: 10,
    expectedSlotScore: 2505,
  },

  // -------------------------------------------------------------------------
  // 2. Disabled multiplier (1×)
  // -------------------------------------------------------------------------
  {
    id: 'SS-003',
    description: 'Disabled multiplier 1×: 370 × 1 = 370',
    playerFinalScore: 370,
    slotMultiplier: 1,
    expectedSlotScore: 370,
  },
  {
    id: 'SS-004',
    description: 'Disabled multiplier 1× with float: 164.70588235294117 × 1',
    playerFinalScore: 164.70588235294117,
    slotMultiplier: 1,
    expectedSlotScore: 164.70588235294117,
  },

  // -------------------------------------------------------------------------
  // 3. Fractional multiplier (2.5×)
  // -------------------------------------------------------------------------
  {
    id: 'SS-005',
    description: 'Fractional multiplier 2.5×: 100 × 2.5 = 250',
    playerFinalScore: 100,
    slotMultiplier: 2.5,
    expectedSlotScore: 250,
  },
  {
    id: 'SS-006',
    description: 'Fractional multiplier 1.5×: 200 × 1.5 = 300',
    playerFinalScore: 200,
    slotMultiplier: 1.5,
    expectedSlotScore: 300,
  },
  {
    id: 'SS-007',
    description: 'Fractional multiplier 0.5×: 100 × 0.5 = 50',
    playerFinalScore: 100,
    slotMultiplier: 0.5,
    expectedSlotScore: 50,
  },

  // -------------------------------------------------------------------------
  // 4. Very small float player scores
  // -------------------------------------------------------------------------
  {
    id: 'SS-008',
    description: 'Very small float: 0.00001 × 5 = 0.00005',
    playerFinalScore: 0.00001,
    slotMultiplier: 5,
    expectedSlotScore: 0.00005,
  },
  {
    id: 'SS-009',
    description: 'Small SR-derived score: 0.123456789 × 3 = 0.370370367',
    playerFinalScore: 0.123456789,
    slotMultiplier: 3,
    expectedSlotScore: 0.370370367,
  },
  {
    id: 'SS-010',
    description: 'Epsilon-level score: 1e-10 × 2 = 2e-10',
    playerFinalScore: 1e-10,
    slotMultiplier: 2,
    expectedSlotScore: 2e-10,
  },

  // -------------------------------------------------------------------------
  // 5. Large multipliers (100×)
  // -------------------------------------------------------------------------
  {
    id: 'SS-011',
    description: 'Large multiplier 100×: 50 × 100 = 5000',
    playerFinalScore: 50,
    slotMultiplier: 100,
    expectedSlotScore: 5000,
  },
  {
    id: 'SS-012',
    description: 'Large multiplier 20×: 370 × 20 = 7400 (GTV-007 reference)',
    playerFinalScore: 370,
    slotMultiplier: 20,
    expectedSlotScore: 7400,
  },
  {
    id: 'SS-013',
    description: 'Large multiplier 50×: 1441.70588235294117 × 50',
    playerFinalScore: 1441.70588235294117,
    slotMultiplier: 50,
    expectedSlotScore: 72085.2941176470585,
  },

  // -------------------------------------------------------------------------
  // 6. Zero player score
  // -------------------------------------------------------------------------
  {
    id: 'SS-014',
    description: 'Zero score × 20 = 0',
    playerFinalScore: 0,
    slotMultiplier: 20,
    expectedSlotScore: 0,
  },
  {
    id: 'SS-015',
    description: 'Zero score × 1 = 0',
    playerFinalScore: 0,
    slotMultiplier: 1,
    expectedSlotScore: 0,
  },
  {
    id: 'SS-016',
    description: 'Zero score × 100 = 0',
    playerFinalScore: 0,
    slotMultiplier: 100,
    expectedSlotScore: 0,
  },

  // -------------------------------------------------------------------------
  // 7. Non-negativity enforcement (edge cases)
  // -------------------------------------------------------------------------
  // Note: Player scores should never be negative per Constitution,
  // but we test the safety guarantee
  {
    id: 'SS-017',
    description: 'Non-negativity: -100 × 5 → max(0, -500) = 0',
    playerFinalScore: -100,
    slotMultiplier: 5,
    expectedSlotScore: 0,
  },
  {
    id: 'SS-018',
    description: 'Non-negativity: -0.001 × 10 → max(0, -0.01) = 0',
    playerFinalScore: -0.001,
    slotMultiplier: 10,
    expectedSlotScore: 0,
  },

  // -------------------------------------------------------------------------
  // 8. Precision preservation (no rounding)
  // -------------------------------------------------------------------------
  {
    id: 'SS-019',
    description: 'Precision: 164.70588235294117647 × 3 (from GTV-008)',
    playerFinalScore: 164.70588235294117647,
    slotMultiplier: 3,
    expectedSlotScore: 494.11764705882352941,
  },
  {
    id: 'SS-020',
    description: 'Precision: 1/3 × 3 should return 1 (float math)',
    playerFinalScore: 1 / 3,
    slotMultiplier: 3,
    expectedSlotScore: 1,
  },
  {
    id: 'SS-021',
    description: 'Precision: π × e',
    playerFinalScore: Math.PI,
    slotMultiplier: Math.E,
    expectedSlotScore: Math.PI * Math.E,
  },

  // -------------------------------------------------------------------------
  // Additional edge cases
  // -------------------------------------------------------------------------
  {
    id: 'SS-022',
    description: 'Very large score: 1000000 × 20 = 20000000',
    playerFinalScore: 1000000,
    slotMultiplier: 20,
    expectedSlotScore: 20000000,
  },
  {
    id: 'SS-023',
    description: 'Multiplier of zero: 100 × 0 = 0',
    playerFinalScore: 100,
    slotMultiplier: 0,
    expectedSlotScore: 0,
  },
] as const;

// =============================================================================
// TEST RUNNER
// =============================================================================

function runSingleTest(testCase: TestCase): TestResult {
  const actual = computeSlotScore(testCase.playerFinalScore, testCase.slotMultiplier);
  const passed = floatsEqual(actual, testCase.expectedSlotScore);

  return {
    testId: testCase.id,
    description: testCase.description,
    passed,
    expected: testCase.expectedSlotScore,
    actual,
    error: passed ? undefined : `Expected ${testCase.expectedSlotScore}, got ${actual}`,
  };
}

function runComputeSlotScoreWithDetailsTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test that computeSlotScoreWithDetails returns correct structure
  const input: SlotScoreInput = {
    playerFinalScore: 370,
    slotMultiplier: 20,
  };

  const result = computeSlotScoreWithDetails(input);

  results.push({
    testId: 'SS-DETAIL-001',
    description: 'computeSlotScoreWithDetails returns correct inputScore',
    passed: result.inputScore === 370,
    expected: 370,
    actual: result.inputScore,
  });

  results.push({
    testId: 'SS-DETAIL-002',
    description: 'computeSlotScoreWithDetails returns correct multiplier',
    passed: result.multiplier === 20,
    expected: 20,
    actual: result.multiplier,
  });

  results.push({
    testId: 'SS-DETAIL-003',
    description: 'computeSlotScoreWithDetails returns correct slotScore',
    passed: result.slotScore === 7400,
    expected: 7400,
    actual: result.slotScore,
  });

  return results;
}

function runBatchTests(): TestResult[] {
  const results: TestResult[] = [];

  const entries: SlotScoreBatchEntry[] = [
    { playerId: 'p1', playerFinalScore: 100, slotMultiplier: 5 },
    { playerId: 'p2', playerFinalScore: 200, slotMultiplier: 3 },
    { playerId: 'p3', playerFinalScore: 0, slotMultiplier: 20 },
  ];

  const batchResults = computeSlotScoresBatch(entries);

  results.push({
    testId: 'SS-BATCH-001',
    description: 'Batch: correct count of results',
    passed: batchResults.length === 3,
    expected: 3,
    actual: batchResults.length,
  });

  results.push({
    testId: 'SS-BATCH-002',
    description: 'Batch: player 1 score 100 × 5 = 500',
    passed: batchResults[0].slotScore === 500,
    expected: 500,
    actual: batchResults[0].slotScore,
  });

  results.push({
    testId: 'SS-BATCH-003',
    description: 'Batch: player 2 score 200 × 3 = 600',
    passed: batchResults[1].slotScore === 600,
    expected: 600,
    actual: batchResults[1].slotScore,
  });

  results.push({
    testId: 'SS-BATCH-004',
    description: 'Batch: player 3 score 0 × 20 = 0',
    passed: batchResults[2].slotScore === 0,
    expected: 0,
    actual: batchResults[2].slotScore,
  });

  results.push({
    testId: 'SS-BATCH-005',
    description: 'Batch: preserves player IDs',
    passed: batchResults[0].playerId === 'p1' && 
            batchResults[1].playerId === 'p2' && 
            batchResults[2].playerId === 'p3',
    expected: 1,
    actual: (batchResults[0].playerId === 'p1' && 
             batchResults[1].playerId === 'p2' && 
             batchResults[2].playerId === 'p3') ? 1 : 0,
  });

  return results;
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

export interface SlotScoreTestSuiteResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: TestResult[];
  readonly executionTimeMs: number;
}

export function runSlotScoreTests(): SlotScoreTestSuiteResult {
  const startTime = performance.now();

  // Run main test cases
  const mainResults = TEST_CASES.map(runSingleTest);

  // Run detail function tests
  const detailResults = runComputeSlotScoreWithDetailsTests();

  // Run batch tests
  const batchResults = runBatchTests();

  // Combine all results
  const allResults = [...mainResults, ...detailResults, ...batchResults];

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

function printSlotScoreTestResults(suiteResult: SlotScoreTestSuiteResult): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — SLOT SCORE UNIT TESTS');
  console.log('Authority: Constitution.md v1.0, Section 5 (Multipliers)');
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
    console.log('Slot score application is Constitution-compliant');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runSlotScoreTests();
  printSlotScoreTestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printSlotScoreTestResults };
