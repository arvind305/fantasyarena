/**
 * IPL Friends Betting Game — Golden Test Runner
 * 
 * Authority: Constitution.md v1.0
 * 
 * PURPOSE:
 * Executes all golden test vectors against the scoring engine and reports results.
 * Any failure indicates a regression that must be fixed before deployment.
 * 
 * USAGE:
 * npx ts-node src/domain/golden-test-runner.ts
 * 
 * OR import and call runAllGoldenTests() programmatically
 */

import {
  computeBasePlayerScore,
  computeFinalPlayerScore,
  hasValidParticipation,
} from './scoring';

import {
  ALL_GOLDEN_TEST_VECTORS,
  TEST_COVERAGE_SUMMARY,
  type GoldenTestVector,
} from './golden-test-vectors';

// =============================================================================
// TEST RESULT TYPES
// =============================================================================

interface TestResult {
  readonly vectorId: string;
  readonly description: string;
  readonly passed: boolean;
  readonly failures: string[];
}

interface TestSuiteResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: TestResult[];
  readonly executionTimeMs: number;
}

// =============================================================================
// FLOAT COMPARISON HELPER
// =============================================================================

/**
 * Compare floats with tolerance for floating-point precision issues
 * Uses relative tolerance for large numbers, absolute for small
 */
function floatsEqual(actual: number, expected: number, tolerance = 1e-10): boolean {
  if (expected === 0) {
    return Math.abs(actual) < tolerance;
  }
  return Math.abs((actual - expected) / expected) < tolerance;
}

// =============================================================================
// SINGLE TEST EXECUTOR
// =============================================================================

function runSingleTest(vector: GoldenTestVector): TestResult {
  const failures: string[] = [];
  const { stats, slot, ruleVersion } = vector.input;
  const expected = vector.expected;

  // Test 1: hasValidParticipation
  const actualValidParticipation = hasValidParticipation(stats);
  if (actualValidParticipation !== expected.hasValidParticipation) {
    failures.push(
      `hasValidParticipation: expected ${expected.hasValidParticipation}, got ${actualValidParticipation}`
    );
  }

  // Test 2: computeBasePlayerScore breakdown
  const actualBreakdown = computeBasePlayerScore(stats, ruleVersion);
  const breakdownFields = [
    'runPoints',
    'fourPoints',
    'sixPoints',
    'strikeRatePoints',
    'centuryBonus',
    'battingSubtotal',
    'wicketPoints',
    'rpoPoints',
    'fiveWicketBonus',
    'hatTrickBonus',
    'bowlingSubtotal',
    'catchPoints',
    'runOutPoints',
    'stumpingPoints',
    'fieldingSubtotal',
    'manOfTheMatchBonus',
    'totalBaseScore',
  ] as const;

  for (const field of breakdownFields) {
    const actualValue = actualBreakdown[field];
    const expectedValue = expected.baseScoreBreakdown[field];
    if (!floatsEqual(actualValue, expectedValue)) {
      failures.push(
        `baseScoreBreakdown.${field}: expected ${expectedValue}, got ${actualValue}`
      );
    }
  }

  // Test 3: computeFinalPlayerScore
  const actualFinal = computeFinalPlayerScore(stats, slot, ruleVersion);
  
  if (!floatsEqual(actualFinal.finalScoreFloat, expected.finalScoreFloat)) {
    failures.push(
      `finalScoreFloat: expected ${expected.finalScoreFloat}, got ${actualFinal.finalScoreFloat}`
    );
  }

  if (actualFinal.finalScoreRounded !== expected.finalScoreRounded) {
    failures.push(
      `finalScoreRounded: expected ${expected.finalScoreRounded}, got ${actualFinal.finalScoreRounded}`
    );
  }

  return {
    vectorId: vector.id,
    description: vector.description,
    passed: failures.length === 0,
    failures,
  };
}

// =============================================================================
// TEST SUITE EXECUTOR
// =============================================================================

export function runAllGoldenTests(): TestSuiteResult {
  const startTime = performance.now();
  
  const results: TestResult[] = ALL_GOLDEN_TEST_VECTORS.map(runSingleTest);
  
  const endTime = performance.now();
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    totalTests: results.length,
    passed,
    failed,
    results,
    executionTimeMs: endTime - startTime,
  };
}

// =============================================================================
// CONSOLE REPORTER
// =============================================================================

function printTestResults(suiteResult: TestSuiteResult): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — GOLDEN TEST SUITE');
  console.log('Authority: Constitution.md v1.0');
  console.log('='.repeat(70) + '\n');

  console.log(`Coverage: ${TEST_COVERAGE_SUMMARY.totalVectors} test vectors`);
  console.log(`Categories: ${Object.keys(TEST_COVERAGE_SUMMARY.categories).join(', ')}`);
  console.log(`Constitution sections: ${TEST_COVERAGE_SUMMARY.constitutionSectionsCovered.join(', ')}`);
  console.log('\n' + '-'.repeat(70) + '\n');

  for (const result of suiteResult.results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const statusColor = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${statusColor}${status}${reset} [${result.vectorId}] ${result.description}`);
    
    if (!result.passed) {
      for (const failure of result.failures) {
        console.log(`       └─ ${failure}`);
      }
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`\nRESULTS: ${suiteResult.passed}/${suiteResult.totalTests} passed`);
  console.log(`Execution time: ${suiteResult.executionTimeMs.toFixed(2)}ms`);
  
  if (suiteResult.failed > 0) {
    console.log(`\n\x1b[31m✗ ${suiteResult.failed} TEST(S) FAILED\x1b[0m`);
    console.log('REGRESSION DETECTED — DO NOT DEPLOY');
  } else {
    console.log(`\n\x1b[32m✓ ALL TESTS PASSED\x1b[0m`);
    console.log('Scoring engine is Constitution-compliant');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runAllGoldenTests();
  printTestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printTestResults };
