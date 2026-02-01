/**
 * IPL Friends Betting Game — Constitution Lock Unit Tests
 * 
 * Authority: Constitution.md v1.0
 * 
 * PURPOSE:
 * These tests validate that the Constitution version governance system
 * is properly implemented and that all scoring outputs reference it.
 * 
 * TEST COVERAGE:
 * 1. CONSTITUTION_VERSION exists and is non-empty
 * 2. CONSTITUTION_VERSION matches expected format
 * 3. Stamped scoring outputs include constitutionVersion
 * 4. Golden test vectors include constitutionVersion
 * 5. Version consistency across all outputs
 */

import {
  CONSTITUTION_VERSION,
  CONSTITUTION_VERSION_INFO,
  createConstitutionStamp,
  hasValidConstitutionStamp,
  assertConstitutionVersion,
  type ConstitutionStamped,
} from '../src/domain/constitution-version';

import {
  computeStampedBasePlayerScore,
  computeStampedFinalPlayerScore,
  computeStampedSlotScore,
  computeStampedPlayerScoringResult,
  isCurrentConstitutionVersion,
} from '../src/domain/stamped-scoring';

import {
  ALL_GOLDEN_TEST_VECTORS,
  GOLDEN_RULE_VERSION,
} from '../src/domain/golden-test-vectors';

import type { PlayerMatchStats, Slot } from '../src/domain/models';

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

const TEST_STATS: PlayerMatchStats = {
  playerId: 'test-player',
  matchId: 'test-match',
  runs: 50,
  ballsFaced: 40,
  fours: 5,
  sixes: 2,
  wickets: 0,
  oversBowled: 0,
  runsConceded: 0,
  hasTakenHatTrick: false,
  catches: 1,
  runOuts: 0,
  stumpings: 0,
  isManOfTheMatch: false,
};

const TEST_SLOT: Slot = {
  slotNumber: 1,
  multiplier: 10,
  isEnabled: true,
};

// =============================================================================
// TEST 1: CONSTITUTION_VERSION EXISTS AND IS NON-EMPTY
// =============================================================================

function testVersionExists(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1.1: CONSTITUTION_VERSION is defined
  results.push({
    testId: 'CL-001',
    description: 'CONSTITUTION_VERSION is defined',
    passed: CONSTITUTION_VERSION !== undefined,
    error: CONSTITUTION_VERSION !== undefined ? undefined : 'CONSTITUTION_VERSION is undefined',
  });

  // Test 1.2: CONSTITUTION_VERSION is a string
  results.push({
    testId: 'CL-002',
    description: 'CONSTITUTION_VERSION is a string',
    passed: typeof CONSTITUTION_VERSION === 'string',
    error: typeof CONSTITUTION_VERSION === 'string' ? undefined : `Expected string, got ${typeof CONSTITUTION_VERSION}`,
  });

  // Test 1.3: CONSTITUTION_VERSION is non-empty
  results.push({
    testId: 'CL-003',
    description: 'CONSTITUTION_VERSION is non-empty',
    passed: CONSTITUTION_VERSION.length > 0,
    error: CONSTITUTION_VERSION.length > 0 ? undefined : 'CONSTITUTION_VERSION is empty string',
  });

  // Test 1.4: CONSTITUTION_VERSION matches semver pattern
  const semverPattern = /^\d+\.\d+\.\d+$/;
  results.push({
    testId: 'CL-004',
    description: 'CONSTITUTION_VERSION matches semver pattern (X.Y.Z)',
    passed: semverPattern.test(CONSTITUTION_VERSION),
    error: semverPattern.test(CONSTITUTION_VERSION) 
      ? undefined 
      : `Expected semver format, got "${CONSTITUTION_VERSION}"`,
  });

  // Test 1.5: Current version is 1.0.0
  results.push({
    testId: 'CL-005',
    description: 'CONSTITUTION_VERSION is currently 1.0.0',
    passed: CONSTITUTION_VERSION === '1.0.0',
    error: CONSTITUTION_VERSION === '1.0.0' ? undefined : `Expected 1.0.0, got ${CONSTITUTION_VERSION}`,
  });

  return results;
}

// =============================================================================
// TEST 2: VERSION INFO METADATA
// =============================================================================

function testVersionInfo(): TestResult[] {
  const results: TestResult[] = [];

  // Test 2.1: VERSION_INFO exists
  results.push({
    testId: 'CL-006',
    description: 'CONSTITUTION_VERSION_INFO is defined',
    passed: CONSTITUTION_VERSION_INFO !== undefined,
  });

  // Test 2.2: VERSION_INFO.version matches CONSTITUTION_VERSION
  results.push({
    testId: 'CL-007',
    description: 'VERSION_INFO.version matches CONSTITUTION_VERSION',
    passed: CONSTITUTION_VERSION_INFO.version === CONSTITUTION_VERSION,
    error: CONSTITUTION_VERSION_INFO.version === CONSTITUTION_VERSION 
      ? undefined 
      : `Mismatch: ${CONSTITUTION_VERSION_INFO.version} vs ${CONSTITUTION_VERSION}`,
  });

  // Test 2.3: VERSION_INFO has description
  results.push({
    testId: 'CL-008',
    description: 'VERSION_INFO has non-empty description',
    passed: CONSTITUTION_VERSION_INFO.description.length > 0,
  });

  // Test 2.4: VERSION_INFO has sourceDocument
  results.push({
    testId: 'CL-009',
    description: 'VERSION_INFO references Constitution.md',
    passed: CONSTITUTION_VERSION_INFO.sourceDocument === 'Constitution.md',
  });

  return results;
}

// =============================================================================
// TEST 3: CONSTITUTION STAMP HELPERS
// =============================================================================

function testStampHelpers(): TestResult[] {
  const results: TestResult[] = [];

  // Test 3.1: createConstitutionStamp returns valid stamp
  const stamp = createConstitutionStamp();
  results.push({
    testId: 'CL-010',
    description: 'createConstitutionStamp returns valid stamp',
    passed: stamp.constitutionVersion === CONSTITUTION_VERSION,
    error: stamp.constitutionVersion === CONSTITUTION_VERSION 
      ? undefined 
      : `Expected ${CONSTITUTION_VERSION}, got ${stamp.constitutionVersion}`,
  });

  // Test 3.2: hasValidConstitutionStamp validates correctly
  results.push({
    testId: 'CL-011',
    description: 'hasValidConstitutionStamp returns true for valid stamp',
    passed: hasValidConstitutionStamp(stamp) === true,
  });

  // Test 3.3: hasValidConstitutionStamp rejects invalid
  const invalidStamp = { constitutionVersion: '0.0.0' };
  results.push({
    testId: 'CL-012',
    description: 'hasValidConstitutionStamp returns false for invalid stamp',
    passed: hasValidConstitutionStamp(invalidStamp) === false,
  });

  // Test 3.4: hasValidConstitutionStamp rejects non-object
  results.push({
    testId: 'CL-013',
    description: 'hasValidConstitutionStamp returns false for non-object',
    passed: hasValidConstitutionStamp(null) === false && hasValidConstitutionStamp('string') === false,
  });

  // Test 3.5: assertConstitutionVersion passes for correct version
  let assertPassed = true;
  try {
    assertConstitutionVersion(CONSTITUTION_VERSION);
  } catch {
    assertPassed = false;
  }
  results.push({
    testId: 'CL-014',
    description: 'assertConstitutionVersion passes for correct version',
    passed: assertPassed,
  });

  // Test 3.6: assertConstitutionVersion throws for wrong version
  let assertThrew = false;
  try {
    assertConstitutionVersion('0.0.0');
  } catch {
    assertThrew = true;
  }
  results.push({
    testId: 'CL-015',
    description: 'assertConstitutionVersion throws for wrong version',
    passed: assertThrew,
  });

  return results;
}

// =============================================================================
// TEST 4: STAMPED SCORING OUTPUTS INCLUDE VERSION
// =============================================================================

function testStampedScoringOutputs(): TestResult[] {
  const results: TestResult[] = [];

  // Test 4.1: computeStampedBasePlayerScore includes version
  const stampedBase = computeStampedBasePlayerScore(TEST_STATS, GOLDEN_RULE_VERSION);
  results.push({
    testId: 'CL-016',
    description: 'computeStampedBasePlayerScore includes constitutionVersion',
    passed: stampedBase.constitutionVersion === CONSTITUTION_VERSION,
    error: stampedBase.constitutionVersion === CONSTITUTION_VERSION 
      ? undefined 
      : `Expected ${CONSTITUTION_VERSION}, got ${stampedBase.constitutionVersion}`,
  });

  // Test 4.2: computeStampedFinalPlayerScore includes version
  const stampedFinal = computeStampedFinalPlayerScore(TEST_STATS, TEST_SLOT, GOLDEN_RULE_VERSION);
  results.push({
    testId: 'CL-017',
    description: 'computeStampedFinalPlayerScore includes constitutionVersion',
    passed: stampedFinal.constitutionVersion === CONSTITUTION_VERSION,
  });

  // Test 4.3: computeStampedSlotScore includes version
  const stampedSlot = computeStampedSlotScore(100, 10);
  results.push({
    testId: 'CL-018',
    description: 'computeStampedSlotScore includes constitutionVersion',
    passed: stampedSlot.constitutionVersion === CONSTITUTION_VERSION,
  });

  // Test 4.4: computeStampedPlayerScoringResult includes version
  const stampedResult = computeStampedPlayerScoringResult(TEST_STATS, TEST_SLOT, 10, GOLDEN_RULE_VERSION);
  results.push({
    testId: 'CL-019',
    description: 'computeStampedPlayerScoringResult includes constitutionVersion',
    passed: stampedResult.constitutionVersion === CONSTITUTION_VERSION,
  });

  // Test 4.5: isCurrentConstitutionVersion works
  results.push({
    testId: 'CL-020',
    description: 'isCurrentConstitutionVersion returns true for current version',
    passed: isCurrentConstitutionVersion(stampedBase) === true,
  });

  // Test 4.6: Stamped outputs have all expected fields
  results.push({
    testId: 'CL-021',
    description: 'Stamped base score has totalBaseScore field',
    passed: typeof stampedBase.totalBaseScore === 'number',
  });

  results.push({
    testId: 'CL-022',
    description: 'Stamped final score has finalScoreFloat field',
    passed: typeof stampedFinal.finalScoreFloat === 'number',
  });

  return results;
}

// =============================================================================
// TEST 5: GOLDEN TEST VECTORS INCLUDE VERSION
// =============================================================================

function testGoldenTestVectorsVersion(): TestResult[] {
  const results: TestResult[] = [];

  // Test 5.1: All golden test vectors have constitutionVersion
  let allHaveVersion = true;
  let missingVector = '';
  for (const vector of ALL_GOLDEN_TEST_VECTORS) {
    if (vector.expected.constitutionVersion === undefined) {
      allHaveVersion = false;
      missingVector = vector.id;
      break;
    }
  }
  results.push({
    testId: 'CL-023',
    description: 'All golden test vectors have constitutionVersion in expected',
    passed: allHaveVersion,
    error: allHaveVersion ? undefined : `Vector ${missingVector} missing constitutionVersion`,
  });

  // Test 5.2: All golden test vectors reference current version
  let allCurrentVersion = true;
  let wrongVersionVector = '';
  for (const vector of ALL_GOLDEN_TEST_VECTORS) {
    if (vector.expected.constitutionVersion !== CONSTITUTION_VERSION) {
      allCurrentVersion = false;
      wrongVersionVector = vector.id;
      break;
    }
  }
  results.push({
    testId: 'CL-024',
    description: 'All golden test vectors reference current CONSTITUTION_VERSION',
    passed: allCurrentVersion,
    error: allCurrentVersion 
      ? undefined 
      : `Vector ${wrongVersionVector} has wrong version`,
  });

  // Test 5.3: Golden test vector count (should be 14)
  results.push({
    testId: 'CL-025',
    description: 'All 14 golden test vectors are present',
    passed: ALL_GOLDEN_TEST_VECTORS.length === 14,
    error: ALL_GOLDEN_TEST_VECTORS.length === 14 
      ? undefined 
      : `Expected 14 vectors, got ${ALL_GOLDEN_TEST_VECTORS.length}`,
  });

  return results;
}

// =============================================================================
// TEST 6: VERSION CONSISTENCY
// =============================================================================

function testVersionConsistency(): TestResult[] {
  const results: TestResult[] = [];

  // Test 6.1: Multiple stamped outputs have same version
  const stamp1 = computeStampedBasePlayerScore(TEST_STATS, GOLDEN_RULE_VERSION);
  const stamp2 = computeStampedFinalPlayerScore(TEST_STATS, TEST_SLOT, GOLDEN_RULE_VERSION);
  const stamp3 = computeStampedSlotScore(100, 10);

  results.push({
    testId: 'CL-026',
    description: 'All stamped outputs have consistent constitutionVersion',
    passed: stamp1.constitutionVersion === stamp2.constitutionVersion &&
            stamp2.constitutionVersion === stamp3.constitutionVersion,
  });

  // Test 6.2: Stamped output version matches CONSTITUTION_VERSION constant
  results.push({
    testId: 'CL-027',
    description: 'Stamped outputs match CONSTITUTION_VERSION constant',
    passed: stamp1.constitutionVersion === CONSTITUTION_VERSION,
  });

  // Test 6.3: Golden test expected version matches CONSTITUTION_VERSION
  const firstVector = ALL_GOLDEN_TEST_VECTORS[0];
  results.push({
    testId: 'CL-028',
    description: 'Golden test expected version matches CONSTITUTION_VERSION',
    passed: firstVector.expected.constitutionVersion === CONSTITUTION_VERSION,
  });

  // Test 6.4: VERSION_INFO is consistent
  results.push({
    testId: 'CL-029',
    description: 'VERSION_INFO is internally consistent',
    passed: CONSTITUTION_VERSION_INFO.version === CONSTITUTION_VERSION,
  });

  return results;
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

export interface ConstitutionLockTestSuiteResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: TestResult[];
  readonly executionTimeMs: number;
}

export function runConstitutionLockTests(): ConstitutionLockTestSuiteResult {
  const startTime = performance.now();

  const allResults: TestResult[] = [
    ...testVersionExists(),
    ...testVersionInfo(),
    ...testStampHelpers(),
    ...testStampedScoringOutputs(),
    ...testGoldenTestVectorsVersion(),
    ...testVersionConsistency(),
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

function printConstitutionLockTestResults(
  suiteResult: ConstitutionLockTestSuiteResult
): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — CONSTITUTION LOCK UNIT TESTS');
  console.log('Authority: Constitution.md v1.0');
  console.log('='.repeat(70) + '\n');

  console.log(`CONSTITUTION_VERSION: ${CONSTITUTION_VERSION}`);
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
    console.log('Constitution lock governance is properly implemented');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runConstitutionLockTests();
  printConstitutionLockTestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printConstitutionLockTestResults };
