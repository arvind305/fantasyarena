/**
 * IPL Friends Betting Game — Slot Conflict Resolution Unit Tests
 * 
 * Authority: Constitution.md v1.0, Section 2.3 (Player Picks)
 * Reference: "One player may occupy only one slot per match"
 * 
 * TEST COVERAGE:
 * 1. No conflicts
 * 2. Single duplicate (two slots)
 * 3. Multiple duplicates (three or more slots)
 * 4. Duplicate with nulls in between
 * 5. Same player in Slot 1 and Slot 11
 * 6. All slots containing the same playerId
 * 7. Multiple different players with conflicts
 * 8. Detection vs resolution consistency
 * 9. Determinism tests
 */

import {
  resolveSlotConflicts,
  resolveSlotConflictsWithDetails,
  detectSlotConflicts,
  isConflictFree,
  getUniquePlayerIds,
  type SlotConflict,
  type ConflictDetectionResult,
} from './slot-conflict';

import {
  resolveSlotAssignments,
  type SlotAssignmentMap,
  type ResolvedSlotAssignmentMap,
  ALL_SLOT_INDICES,
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

/**
 * Helper to create a resolved map from partial input
 */
function createResolvedMap(input: SlotAssignmentMap): ResolvedSlotAssignmentMap {
  return resolveSlotAssignments(input);
}

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * No conflicts - all unique players
 */
const NO_CONFLICTS_INPUT = createResolvedMap({
  1: 'player-A',
  2: 'player-B',
  3: 'player-C',
  4: 'player-D',
  5: 'player-E',
  6: null,
  7: 'player-F',
  8: null,
  9: 'player-G',
  10: 'player-H',
  11: 'player-I',
});

/**
 * Single duplicate - player-A in slots 2 and 5
 */
const SINGLE_DUPLICATE_INPUT = createResolvedMap({
  1: 'player-X',
  2: 'player-A',
  3: 'player-B',
  4: 'player-C',
  5: 'player-A', // DUPLICATE
  6: 'player-D',
});

/**
 * Multiple duplicates - player-A in slots 1, 4, and 7
 */
const TRIPLE_DUPLICATE_INPUT = createResolvedMap({
  1: 'player-A',
  2: 'player-B',
  3: 'player-C',
  4: 'player-A', // DUPLICATE
  5: 'player-D',
  6: 'player-E',
  7: 'player-A', // DUPLICATE
});

/**
 * Duplicate with nulls in between - player-A in slots 2 and 8
 */
const DUPLICATE_WITH_NULLS_INPUT = createResolvedMap({
  1: 'player-X',
  2: 'player-A',
  3: null,
  4: null,
  5: null,
  6: null,
  7: null,
  8: 'player-A', // DUPLICATE
  9: 'player-Y',
});

/**
 * Same player in Slot 1 and Slot 11 (edge case: max distance)
 */
const SLOT_1_AND_11_INPUT = createResolvedMap({
  1: 'player-A',
  2: 'player-B',
  3: 'player-C',
  4: 'player-D',
  5: 'player-E',
  6: 'player-F',
  7: 'player-G',
  8: 'player-H',
  9: 'player-I',
  10: 'player-J',
  11: 'player-A', // DUPLICATE (should be cleared)
});

/**
 * All slots containing the same playerId
 */
const ALL_SAME_PLAYER_INPUT = createResolvedMap({
  1: 'player-A',
  2: 'player-A',
  3: 'player-A',
  4: 'player-A',
  5: 'player-A',
  6: 'player-A',
  7: 'player-A',
  8: 'player-A',
  9: 'player-A',
  10: 'player-A',
  11: 'player-A',
});

/**
 * Multiple different players with conflicts
 */
const MULTIPLE_PLAYERS_CONFLICTS_INPUT = createResolvedMap({
  1: 'player-A',
  2: 'player-B',
  3: 'player-A', // DUPLICATE of A
  4: 'player-B', // DUPLICATE of B
  5: 'player-C',
  6: 'player-C', // DUPLICATE of C
  7: 'player-D',
});

/**
 * Empty map (all nulls)
 */
const ALL_EMPTY_INPUT = createResolvedMap({});

// =============================================================================
// RESOLUTION TESTS
// =============================================================================

function runResolutionTests(): TestResult[] {
  const results: TestResult[] = [];

  // -------------------------------------------------------------------------
  // Test 1: No conflicts
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotConflicts(NO_CONFLICTS_INPUT);

    // All values should be unchanged
    let unchanged = true;
    for (const idx of ALL_SLOT_INDICES) {
      if (resolved[idx] !== NO_CONFLICTS_INPUT[idx]) {
        unchanged = false;
        break;
      }
    }

    results.push({
      testId: 'SC-001',
      description: 'No conflicts: output equals input',
      passed: unchanged,
      error: unchanged ? undefined : 'Output differs from input',
    });

    results.push({
      testId: 'SC-002',
      description: 'No conflicts: isConflictFree returns true',
      passed: isConflictFree(resolved),
      error: isConflictFree(resolved) ? undefined : 'isConflictFree returned false',
    });
  }

  // -------------------------------------------------------------------------
  // Test 2: Single duplicate (two slots)
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotConflicts(SINGLE_DUPLICATE_INPUT);

    // Slot 2 should keep player-A
    results.push({
      testId: 'SC-003',
      description: 'Single duplicate: slot 2 keeps player-A',
      passed: resolved[2] === 'player-A',
      error: resolved[2] === 'player-A' ? undefined : `Slot 2 has ${resolved[2]}`,
    });

    // Slot 5 should be cleared to null
    results.push({
      testId: 'SC-004',
      description: 'Single duplicate: slot 5 cleared to null',
      passed: resolved[5] === null,
      error: resolved[5] === null ? undefined : `Slot 5 has ${resolved[5]}`,
    });

    // Other slots unchanged
    results.push({
      testId: 'SC-005',
      description: 'Single duplicate: slot 1 unchanged',
      passed: resolved[1] === 'player-X',
    });

    results.push({
      testId: 'SC-006',
      description: 'Single duplicate: output is conflict-free',
      passed: isConflictFree(resolved),
    });
  }

  // -------------------------------------------------------------------------
  // Test 3: Multiple duplicates (three or more slots)
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotConflicts(TRIPLE_DUPLICATE_INPUT);

    // Slot 1 should keep player-A (lowest index)
    results.push({
      testId: 'SC-007',
      description: 'Triple duplicate: slot 1 keeps player-A',
      passed: resolved[1] === 'player-A',
      error: resolved[1] === 'player-A' ? undefined : `Slot 1 has ${resolved[1]}`,
    });

    // Slots 4 and 7 should be cleared
    results.push({
      testId: 'SC-008',
      description: 'Triple duplicate: slot 4 cleared to null',
      passed: resolved[4] === null,
      error: resolved[4] === null ? undefined : `Slot 4 has ${resolved[4]}`,
    });

    results.push({
      testId: 'SC-009',
      description: 'Triple duplicate: slot 7 cleared to null',
      passed: resolved[7] === null,
      error: resolved[7] === null ? undefined : `Slot 7 has ${resolved[7]}`,
    });

    // Other players unchanged
    results.push({
      testId: 'SC-010',
      description: 'Triple duplicate: slot 2 (player-B) unchanged',
      passed: resolved[2] === 'player-B',
    });

    results.push({
      testId: 'SC-011',
      description: 'Triple duplicate: output is conflict-free',
      passed: isConflictFree(resolved),
    });
  }

  // -------------------------------------------------------------------------
  // Test 4: Duplicate with nulls in between
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotConflicts(DUPLICATE_WITH_NULLS_INPUT);

    // Slot 2 should keep player-A
    results.push({
      testId: 'SC-012',
      description: 'Duplicate with nulls: slot 2 keeps player-A',
      passed: resolved[2] === 'player-A',
      error: resolved[2] === 'player-A' ? undefined : `Slot 2 has ${resolved[2]}`,
    });

    // Slot 8 should be cleared
    results.push({
      testId: 'SC-013',
      description: 'Duplicate with nulls: slot 8 cleared to null',
      passed: resolved[8] === null,
      error: resolved[8] === null ? undefined : `Slot 8 has ${resolved[8]}`,
    });

    // Null slots remain null
    results.push({
      testId: 'SC-014',
      description: 'Duplicate with nulls: slot 5 remains null',
      passed: resolved[5] === null,
    });

    results.push({
      testId: 'SC-015',
      description: 'Duplicate with nulls: output is conflict-free',
      passed: isConflictFree(resolved),
    });
  }

  // -------------------------------------------------------------------------
  // Test 5: Same player in Slot 1 and Slot 11
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotConflicts(SLOT_1_AND_11_INPUT);

    // Slot 1 should keep player-A (lowest index)
    results.push({
      testId: 'SC-016',
      description: 'Slot 1 vs 11: slot 1 keeps player-A',
      passed: resolved[1] === 'player-A',
      error: resolved[1] === 'player-A' ? undefined : `Slot 1 has ${resolved[1]}`,
    });

    // Slot 11 should be cleared
    results.push({
      testId: 'SC-017',
      description: 'Slot 1 vs 11: slot 11 cleared to null',
      passed: resolved[11] === null,
      error: resolved[11] === null ? undefined : `Slot 11 has ${resolved[11]}`,
    });

    // Middle slots unchanged
    results.push({
      testId: 'SC-018',
      description: 'Slot 1 vs 11: slot 6 (player-F) unchanged',
      passed: resolved[6] === 'player-F',
    });

    results.push({
      testId: 'SC-019',
      description: 'Slot 1 vs 11: output is conflict-free',
      passed: isConflictFree(resolved),
    });
  }

  // -------------------------------------------------------------------------
  // Test 6: All slots containing the same playerId
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotConflicts(ALL_SAME_PLAYER_INPUT);

    // Slot 1 should keep player-A
    results.push({
      testId: 'SC-020',
      description: 'All same player: slot 1 keeps player-A',
      passed: resolved[1] === 'player-A',
      error: resolved[1] === 'player-A' ? undefined : `Slot 1 has ${resolved[1]}`,
    });

    // All other slots should be cleared
    let allOthersNull = true;
    for (let i = 2; i <= 11; i++) {
      if (resolved[i as 2] !== null) {
        allOthersNull = false;
        break;
      }
    }

    results.push({
      testId: 'SC-021',
      description: 'All same player: slots 2-11 all cleared to null',
      passed: allOthersNull,
      error: allOthersNull ? undefined : 'Not all slots 2-11 are null',
    });

    results.push({
      testId: 'SC-022',
      description: 'All same player: output is conflict-free',
      passed: isConflictFree(resolved),
    });

    // Check unique player count
    const uniquePlayers = getUniquePlayerIds(resolved);
    results.push({
      testId: 'SC-023',
      description: 'All same player: exactly 1 unique player',
      passed: uniquePlayers.length === 1,
      error: uniquePlayers.length === 1 ? undefined : `Got ${uniquePlayers.length} unique players`,
    });
  }

  // -------------------------------------------------------------------------
  // Test 7: Multiple different players with conflicts
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotConflicts(MULTIPLE_PLAYERS_CONFLICTS_INPUT);

    // Slot 1 keeps player-A, slot 3 cleared
    results.push({
      testId: 'SC-024',
      description: 'Multiple conflicts: slot 1 keeps player-A',
      passed: resolved[1] === 'player-A',
    });

    results.push({
      testId: 'SC-025',
      description: 'Multiple conflicts: slot 3 cleared to null',
      passed: resolved[3] === null,
    });

    // Slot 2 keeps player-B, slot 4 cleared
    results.push({
      testId: 'SC-026',
      description: 'Multiple conflicts: slot 2 keeps player-B',
      passed: resolved[2] === 'player-B',
    });

    results.push({
      testId: 'SC-027',
      description: 'Multiple conflicts: slot 4 cleared to null',
      passed: resolved[4] === null,
    });

    // Slot 5 keeps player-C, slot 6 cleared
    results.push({
      testId: 'SC-028',
      description: 'Multiple conflicts: slot 5 keeps player-C',
      passed: resolved[5] === 'player-C',
    });

    results.push({
      testId: 'SC-029',
      description: 'Multiple conflicts: slot 6 cleared to null',
      passed: resolved[6] === null,
    });

    // Slot 7 unchanged
    results.push({
      testId: 'SC-030',
      description: 'Multiple conflicts: slot 7 (player-D) unchanged',
      passed: resolved[7] === 'player-D',
    });

    results.push({
      testId: 'SC-031',
      description: 'Multiple conflicts: output is conflict-free',
      passed: isConflictFree(resolved),
    });
  }

  // -------------------------------------------------------------------------
  // Test 8: Empty map (all nulls)
  // -------------------------------------------------------------------------
  {
    const resolved = resolveSlotConflicts(ALL_EMPTY_INPUT);

    let allNull = true;
    for (const idx of ALL_SLOT_INDICES) {
      if (resolved[idx] !== null) {
        allNull = false;
        break;
      }
    }

    results.push({
      testId: 'SC-032',
      description: 'All empty: all slots remain null',
      passed: allNull,
    });

    results.push({
      testId: 'SC-033',
      description: 'All empty: output is conflict-free',
      passed: isConflictFree(resolved),
    });
  }

  return results;
}

// =============================================================================
// DETECTION TESTS
// =============================================================================

function runDetectionTests(): TestResult[] {
  const results: TestResult[] = [];

  // -------------------------------------------------------------------------
  // Detection: No conflicts
  // -------------------------------------------------------------------------
  {
    const detection = detectSlotConflicts(NO_CONFLICTS_INPUT);

    results.push({
      testId: 'SC-DET-001',
      description: 'Detection: no conflicts returns hasConflicts=false',
      passed: detection.hasConflicts === false,
    });

    results.push({
      testId: 'SC-DET-002',
      description: 'Detection: no conflicts returns conflictCount=0',
      passed: detection.conflictCount === 0,
    });
  }

  // -------------------------------------------------------------------------
  // Detection: Single duplicate
  // -------------------------------------------------------------------------
  {
    const detection = detectSlotConflicts(SINGLE_DUPLICATE_INPUT);

    results.push({
      testId: 'SC-DET-003',
      description: 'Detection: single duplicate returns hasConflicts=true',
      passed: detection.hasConflicts === true,
    });

    results.push({
      testId: 'SC-DET-004',
      description: 'Detection: single duplicate returns conflictCount=1',
      passed: detection.conflictCount === 1,
    });

    const conflict = detection.conflicts[0];
    results.push({
      testId: 'SC-DET-005',
      description: 'Detection: single duplicate identifies player-A',
      passed: conflict?.playerId === 'player-A',
    });

    results.push({
      testId: 'SC-DET-006',
      description: 'Detection: single duplicate identifies slots 2 and 5',
      passed: conflict?.slotIndices.length === 2 &&
              conflict?.slotIndices[0] === 2 &&
              conflict?.slotIndices[1] === 5,
    });

    results.push({
      testId: 'SC-DET-007',
      description: 'Detection: single duplicate keptSlotIndex is 2',
      passed: conflict?.keptSlotIndex === 2,
    });

    results.push({
      testId: 'SC-DET-008',
      description: 'Detection: single duplicate clearedSlotIndices is [5]',
      passed: conflict?.clearedSlotIndices.length === 1 &&
              conflict?.clearedSlotIndices[0] === 5,
    });
  }

  // -------------------------------------------------------------------------
  // Detection: All same player
  // -------------------------------------------------------------------------
  {
    const detection = detectSlotConflicts(ALL_SAME_PLAYER_INPUT);

    results.push({
      testId: 'SC-DET-009',
      description: 'Detection: all same player returns conflictCount=1',
      passed: detection.conflictCount === 1,
    });

    const conflict = detection.conflicts[0];
    results.push({
      testId: 'SC-DET-010',
      description: 'Detection: all same player has 11 slot indices',
      passed: conflict?.slotIndices.length === 11,
    });

    results.push({
      testId: 'SC-DET-011',
      description: 'Detection: all same player has 10 cleared slots',
      passed: conflict?.clearedSlotIndices.length === 10,
    });
  }

  // -------------------------------------------------------------------------
  // Detection: Multiple conflicts
  // -------------------------------------------------------------------------
  {
    const detection = detectSlotConflicts(MULTIPLE_PLAYERS_CONFLICTS_INPUT);

    results.push({
      testId: 'SC-DET-012',
      description: 'Detection: multiple conflicts returns conflictCount=3',
      passed: detection.conflictCount === 3,
    });

    results.push({
      testId: 'SC-DET-013',
      description: 'Detection: multiple conflicts identifies all players',
      passed: detection.conflictingPlayerIds.includes('player-A') &&
              detection.conflictingPlayerIds.includes('player-B') &&
              detection.conflictingPlayerIds.includes('player-C'),
    });
  }

  return results;
}

// =============================================================================
// DETAILED RESOLUTION TESTS
// =============================================================================

function runDetailedResolutionTests(): TestResult[] {
  const results: TestResult[] = [];

  // -------------------------------------------------------------------------
  // Detailed resolution: Single duplicate
  // -------------------------------------------------------------------------
  {
    const result = resolveSlotConflictsWithDetails(SINGLE_DUPLICATE_INPUT);

    results.push({
      testId: 'SC-DTL-001',
      description: 'Detailed: single duplicate hadConflicts=true',
      passed: result.hadConflicts === true,
    });

    results.push({
      testId: 'SC-DTL-002',
      description: 'Detailed: single duplicate slotsClearedCount=1',
      passed: result.slotsClearedCount === 1,
    });

    results.push({
      testId: 'SC-DTL-003',
      description: 'Detailed: single duplicate conflictsResolved has 1 entry',
      passed: result.conflictsResolved.length === 1,
    });

    results.push({
      testId: 'SC-DTL-004',
      description: 'Detailed: single duplicate resolved map is conflict-free',
      passed: isConflictFree(result.resolved),
    });
  }

  // -------------------------------------------------------------------------
  // Detailed resolution: All same player
  // -------------------------------------------------------------------------
  {
    const result = resolveSlotConflictsWithDetails(ALL_SAME_PLAYER_INPUT);

    results.push({
      testId: 'SC-DTL-005',
      description: 'Detailed: all same player slotsClearedCount=10',
      passed: result.slotsClearedCount === 10,
    });
  }

  // -------------------------------------------------------------------------
  // Detailed resolution: No conflicts
  // -------------------------------------------------------------------------
  {
    const result = resolveSlotConflictsWithDetails(NO_CONFLICTS_INPUT);

    results.push({
      testId: 'SC-DTL-006',
      description: 'Detailed: no conflicts hadConflicts=false',
      passed: result.hadConflicts === false,
    });

    results.push({
      testId: 'SC-DTL-007',
      description: 'Detailed: no conflicts slotsClearedCount=0',
      passed: result.slotsClearedCount === 0,
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
  const result1 = resolveSlotConflicts(MULTIPLE_PLAYERS_CONFLICTS_INPUT);
  const result2 = resolveSlotConflicts(MULTIPLE_PLAYERS_CONFLICTS_INPUT);
  const result3 = resolveSlotConflicts(MULTIPLE_PLAYERS_CONFLICTS_INPUT);

  let allIdentical = true;
  for (const idx of ALL_SLOT_INDICES) {
    if (result1[idx] !== result2[idx] || result2[idx] !== result3[idx]) {
      allIdentical = false;
      break;
    }
  }

  results.push({
    testId: 'SC-DET-014',
    description: 'Determinism: multiple calls produce identical results',
    passed: allIdentical,
    error: allIdentical ? undefined : 'Results differ across calls',
  });

  // Detection determinism
  const det1 = detectSlotConflicts(MULTIPLE_PLAYERS_CONFLICTS_INPUT);
  const det2 = detectSlotConflicts(MULTIPLE_PLAYERS_CONFLICTS_INPUT);

  const detectionsMatch = 
    det1.conflictCount === det2.conflictCount &&
    det1.conflicts.every((c, i) => 
      c.playerId === det2.conflicts[i].playerId &&
      c.keptSlotIndex === det2.conflicts[i].keptSlotIndex
    );

  results.push({
    testId: 'SC-DET-015',
    description: 'Determinism: detection results are identical across calls',
    passed: detectionsMatch,
  });

  return results;
}

// =============================================================================
// UNIQUE PLAYER IDS TESTS
// =============================================================================

function runUniquePlayerTests(): TestResult[] {
  const results: TestResult[] = [];

  // Before resolution
  const uniqueBefore = getUniquePlayerIds(SINGLE_DUPLICATE_INPUT);
  results.push({
    testId: 'SC-UNQ-001',
    description: 'Unique players: before resolution counts duplicates once',
    passed: uniqueBefore.filter(p => p === 'player-A').length === 1,
  });

  // After resolution
  const resolved = resolveSlotConflicts(SINGLE_DUPLICATE_INPUT);
  const uniqueAfter = getUniquePlayerIds(resolved);
  results.push({
    testId: 'SC-UNQ-002',
    description: 'Unique players: after resolution player-A still present',
    passed: uniqueAfter.includes('player-A'),
  });

  // All same player - should have exactly 1 unique
  const allSameResolved = resolveSlotConflicts(ALL_SAME_PLAYER_INPUT);
  const uniqueAllSame = getUniquePlayerIds(allSameResolved);
  results.push({
    testId: 'SC-UNQ-003',
    description: 'Unique players: all same player has 1 unique after resolution',
    passed: uniqueAllSame.length === 1 && uniqueAllSame[0] === 'player-A',
  });

  return results;
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

export interface SlotConflictTestSuiteResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: TestResult[];
  readonly executionTimeMs: number;
}

export function runSlotConflictTests(): SlotConflictTestSuiteResult {
  const startTime = performance.now();

  const resolutionResults = runResolutionTests();
  const detectionResults = runDetectionTests();
  const detailedResults = runDetailedResolutionTests();
  const determinismResults = runDeterminismTests();
  const uniquePlayerResults = runUniquePlayerTests();

  const allResults = [
    ...resolutionResults,
    ...detectionResults,
    ...detailedResults,
    ...determinismResults,
    ...uniquePlayerResults,
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

function printSlotConflictTestResults(
  suiteResult: SlotConflictTestSuiteResult
): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — SLOT CONFLICT RESOLUTION UNIT TESTS');
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
    console.log('Slot conflict resolution is Constitution-compliant');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runSlotConflictTests();
  printSlotConflictTestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printSlotConflictTestResults };
