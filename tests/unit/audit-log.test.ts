/**
 * IPL Friends Betting Game — Audit Log & Replay Unit Tests
 * 
 * Authority: Constitution.md v1.0, Section 15.2 (Transparency & Auditability)
 * 
 * PURPOSE:
 * These tests validate that the audit log and replay system provides
 * deterministic, tamper-evident scoring records.
 * 
 * TEST COVERAGE:
 * 1. Audit record creation with all required fields
 * 2. Successful replay of valid audit records
 * 3. Replay failure when fields are tampered
 * 4. Serialization/deserialization round-trip
 * 5. Hash integrity verification
 * 6. Determinism guarantees
 */

import {
  createScoringAuditRecord,
  replayScoringRun,
  serializeAuditRecord,
  deserializeAuditRecord,
  computeAuditHash,
  validateAuditRecord,
  cloneAuditRecord,
  type ScoringAuditRecord,
  type ReplayResult,
} from '../src/domain/audit-log';

import {
  type AdminSlotMultiplierConfig,
} from '../src/domain/admin-config';

import { CONSTITUTION_VERSION } from '../src/domain/constitution-version';
import { GOLDEN_RULE_VERSION } from '../src/domain/golden-test-vectors';
import { type SlotIndex } from '../src/domain/slot-assignment';
import type { PlayerMatchStats } from '../src/domain/models';

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

function createTestAdminConfig(): AdminSlotMultiplierConfig {
  return {
    matchId: 'match-audit-001',
    multipliers: {
      1: 20, 2: 18, 3: 16, 4: 14, 5: 12,
      6: 10, 7: 8, 8: 6, 9: 4, 10: 2, 11: 1,
    },
    configuredAt: new Date('2025-01-15T10:00:00Z'),
    configuredBy: 'admin-test',
  };
}

function createTestPlayerStats(): Record<string, PlayerMatchStats> {
  return {
    'player-A': {
      playerId: 'player-A',
      matchId: 'match-audit-001',
      runs: 75,
      ballsFaced: 50,
      fours: 8,
      sixes: 3,
      wickets: 0,
      oversBowled: 0,
      runsConceded: 0,
      hasTakenHatTrick: false,
      catches: 1,
      runOuts: 0,
      stumpings: 0,
      isManOfTheMatch: false,
    },
    'player-B': {
      playerId: 'player-B',
      matchId: 'match-audit-001',
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      wickets: 3,
      oversBowled: 4,
      runsConceded: 24,
      hasTakenHatTrick: false,
      catches: 0,
      runOuts: 0,
      stumpings: 0,
      isManOfTheMatch: false,
    },
    'player-C': {
      playerId: 'player-C',
      matchId: 'match-audit-001',
      runs: 50,
      ballsFaced: 40,
      fours: 5,
      sixes: 1,
      wickets: 1,
      oversBowled: 2,
      runsConceded: 18,
      hasTakenHatTrick: false,
      catches: 2,
      runOuts: 1,
      stumpings: 0,
      isManOfTheMatch: true,
    },
  };
}

function createTestAssignments(): Partial<Record<SlotIndex, string | null>> {
  return {
    1: 'player-A',
    2: 'player-B',
    3: 'player-C',
    // Slots 4-11 intentionally empty
  };
}

const FIXED_TIMESTAMP = '2025-01-15T12:00:00.000Z';

// =============================================================================
// TEST 1: AUDIT RECORD CREATION
// =============================================================================

function testAuditRecordCreation(): TestResult[] {
  const results: TestResult[] = [];

  const adminConfig = createTestAdminConfig();
  const playerStats = createTestPlayerStats();
  const assignments = createTestAssignments();

  const record = createScoringAuditRecord(
    'match-audit-001',
    adminConfig,
    assignments,
    playerStats,
    GOLDEN_RULE_VERSION,
    FIXED_TIMESTAMP
  );

  // Test 1.1: Audit ID exists and has correct format
  results.push({
    testId: 'AL-001',
    description: 'Audit ID exists and starts with AUDIT-',
    passed: record.auditId.startsWith('AUDIT-'),
    error: record.auditId.startsWith('AUDIT-') ? undefined : `Got: ${record.auditId}`,
  });

  // Test 1.2: Match ID is preserved
  results.push({
    testId: 'AL-002',
    description: 'Match ID is preserved',
    passed: record.matchId === 'match-audit-001',
  });

  // Test 1.3: Timestamp is preserved
  results.push({
    testId: 'AL-003',
    description: 'Timestamp is preserved',
    passed: record.timestamp === FIXED_TIMESTAMP,
  });

  // Test 1.4: Constitution version is included
  results.push({
    testId: 'AL-004',
    description: 'Constitution version matches current',
    passed: record.constitutionVersion === CONSTITUTION_VERSION,
  });

  // Test 1.5: Admin config is preserved unmodified
  results.push({
    testId: 'AL-005',
    description: 'Admin config is preserved unmodified',
    passed: JSON.stringify(record.adminConfig) === JSON.stringify(adminConfig),
  });

  // Test 1.6: Player stats are preserved
  results.push({
    testId: 'AL-006',
    description: 'Player stats are preserved',
    passed: JSON.stringify(record.playerStats) === JSON.stringify(playerStats),
  });

  // Test 1.7: Raw assignments are preserved
  results.push({
    testId: 'AL-007',
    description: 'Raw slot assignments are preserved',
    passed: JSON.stringify(record.rawSlotAssignments) === JSON.stringify(assignments),
  });

  // Test 1.8: Resolved multipliers has all 11 slots
  results.push({
    testId: 'AL-008',
    description: 'Resolved multipliers has all 11 slots',
    passed: Object.keys(record.resolvedSlotMultipliers).length === 11,
  });

  // Test 1.9: Resolved assignments has all 11 slots
  results.push({
    testId: 'AL-009',
    description: 'Resolved assignments has all 11 slots',
    passed: Object.keys(record.resolvedSlotAssignments).length === 11,
  });

  // Test 1.10: Slot results has all 11 slots
  results.push({
    testId: 'AL-010',
    description: 'Slot results has all 11 entries',
    passed: Object.keys(record.slotResults).length === 11,
  });

  // Test 1.11: Total score is a number
  results.push({
    testId: 'AL-011',
    description: 'Total score is a finite number',
    passed: typeof record.totalScore === 'number' && Number.isFinite(record.totalScore),
  });

  // Test 1.12: Total score rounded exists
  results.push({
    testId: 'AL-012',
    description: 'Total score rounded exists and is integer',
    passed: Number.isInteger(record.totalScoreRounded),
  });

  // Test 1.13: hadConflicts is boolean
  results.push({
    testId: 'AL-013',
    description: 'hadConflicts is boolean',
    passed: typeof record.hadConflicts === 'boolean',
  });

  // Test 1.14: conflictsClearedCount is number
  results.push({
    testId: 'AL-014',
    description: 'conflictsClearedCount is a number',
    passed: typeof record.conflictsClearedCount === 'number',
  });

  return results;
}

// =============================================================================
// TEST 2: SUCCESSFUL REPLAY
// =============================================================================

function testSuccessfulReplay(): TestResult[] {
  const results: TestResult[] = [];

  const adminConfig = createTestAdminConfig();
  const playerStats = createTestPlayerStats();
  const assignments = createTestAssignments();

  const record = createScoringAuditRecord(
    'match-audit-001',
    adminConfig,
    assignments,
    playerStats,
    GOLDEN_RULE_VERSION,
    FIXED_TIMESTAMP
  );

  const replayResult = replayScoringRun(record, GOLDEN_RULE_VERSION);

  // Test 2.1: Replay succeeds
  results.push({
    testId: 'AL-015',
    description: 'Replay of valid record succeeds',
    passed: replayResult.success === true,
    error: replayResult.success ? undefined : `Discrepancies: ${replayResult.discrepancies.map(d => d.message).join('; ')}`,
  });

  // Test 2.2: No discrepancies
  results.push({
    testId: 'AL-016',
    description: 'Replay has no discrepancies',
    passed: replayResult.discrepancies.length === 0,
    error: replayResult.discrepancies.length === 0 
      ? undefined 
      : `Found ${replayResult.discrepancies.length} discrepancies`,
  });

  // Test 2.3: Recomputed total matches stored total
  results.push({
    testId: 'AL-017',
    description: 'Recomputed total score matches stored',
    passed: replayResult.recomputedTotalScore === replayResult.storedTotalScore,
    error: replayResult.recomputedTotalScore === replayResult.storedTotalScore
      ? undefined
      : `Recomputed: ${replayResult.recomputedTotalScore}, Stored: ${replayResult.storedTotalScore}`,
  });

  // Test 2.4: Audit ID is preserved in result
  results.push({
    testId: 'AL-018',
    description: 'Audit ID is preserved in replay result',
    passed: replayResult.auditId === record.auditId,
  });

  // Test 2.5: Match ID is preserved in result
  results.push({
    testId: 'AL-019',
    description: 'Match ID is preserved in replay result',
    passed: replayResult.matchId === record.matchId,
  });

  return results;
}

// =============================================================================
// TEST 3: REPLAY FAILURE ON TAMPERING
// =============================================================================

function testReplayFailureOnTampering(): TestResult[] {
  const results: TestResult[] = [];

  const adminConfig = createTestAdminConfig();
  const playerStats = createTestPlayerStats();
  const assignments = createTestAssignments();

  // Test 3.1: Tampering totalScore causes failure
  {
    const record = createScoringAuditRecord(
      'match-audit-001', adminConfig, assignments, playerStats,
      GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
    );
    const tamperedRecord = {
      ...record,
      totalScore: record.totalScore + 1000, // Tamper!
    };
    const replayResult = replayScoringRun(tamperedRecord, GOLDEN_RULE_VERSION);
    
    results.push({
      testId: 'AL-020',
      description: 'Tampering totalScore causes replay failure',
      passed: replayResult.success === false,
    });

    results.push({
      testId: 'AL-021',
      description: 'Tampering totalScore produces discrepancy',
      passed: replayResult.discrepancies.some(d => d.field === 'totalScore'),
    });
  }

  // Test 3.2: Tampering slot score causes failure
  {
    const record = createScoringAuditRecord(
      'match-audit-001', adminConfig, assignments, playerStats,
      GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
    );
    const tamperedSlotResults = { ...record.slotResults };
    tamperedSlotResults[1] = {
      ...tamperedSlotResults[1],
      slotScore: tamperedSlotResults[1].slotScore + 500, // Tamper!
    };
    const tamperedRecord = {
      ...record,
      slotResults: tamperedSlotResults,
    };
    const replayResult = replayScoringRun(tamperedRecord, GOLDEN_RULE_VERSION);
    
    results.push({
      testId: 'AL-022',
      description: 'Tampering slot score causes replay failure',
      passed: replayResult.success === false,
    });
  }

  // Test 3.3: Tampering base score causes failure
  {
    const record = createScoringAuditRecord(
      'match-audit-001', adminConfig, assignments, playerStats,
      GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
    );
    const tamperedSlotResults = { ...record.slotResults };
    tamperedSlotResults[1] = {
      ...tamperedSlotResults[1],
      baseScore: tamperedSlotResults[1].baseScore + 100, // Tamper!
    };
    const tamperedRecord = {
      ...record,
      slotResults: tamperedSlotResults,
    };
    const replayResult = replayScoringRun(tamperedRecord, GOLDEN_RULE_VERSION);
    
    results.push({
      testId: 'AL-023',
      description: 'Tampering base score causes replay failure',
      passed: replayResult.success === false,
    });
  }

  // Test 3.4: Tampering multiplier causes failure
  {
    const record = createScoringAuditRecord(
      'match-audit-001', adminConfig, assignments, playerStats,
      GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
    );
    const tamperedMultipliers = { ...record.resolvedSlotMultipliers };
    tamperedMultipliers[1] = 99; // Tamper!
    const tamperedRecord = {
      ...record,
      resolvedSlotMultipliers: tamperedMultipliers,
    };
    const replayResult = replayScoringRun(tamperedRecord, GOLDEN_RULE_VERSION);
    
    results.push({
      testId: 'AL-024',
      description: 'Tampering multiplier causes replay failure',
      passed: replayResult.success === false,
    });

    results.push({
      testId: 'AL-025',
      description: 'Tampering multiplier produces multiplier discrepancy',
      passed: replayResult.discrepancies.some(d => d.field === 'resolvedSlotMultipliers'),
    });
  }

  // Test 3.5: Tampering slot assignment causes failure
  {
    const record = createScoringAuditRecord(
      'match-audit-001', adminConfig, assignments, playerStats,
      GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
    );
    const tamperedAssignments = { ...record.resolvedSlotAssignments };
    tamperedAssignments[1] = 'player-FAKE'; // Tamper!
    const tamperedRecord = {
      ...record,
      resolvedSlotAssignments: tamperedAssignments,
    };
    const replayResult = replayScoringRun(tamperedRecord, GOLDEN_RULE_VERSION);
    
    results.push({
      testId: 'AL-026',
      description: 'Tampering slot assignment causes replay failure',
      passed: replayResult.success === false,
    });
  }

  // Test 3.6: Discrepancies include slot index when applicable
  {
    const record = createScoringAuditRecord(
      'match-audit-001', adminConfig, assignments, playerStats,
      GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
    );
    const tamperedSlotResults = { ...record.slotResults };
    tamperedSlotResults[3] = {
      ...tamperedSlotResults[3],
      slotScore: tamperedSlotResults[3].slotScore + 100,
    };
    const tamperedRecord = {
      ...record,
      slotResults: tamperedSlotResults,
    };
    const replayResult = replayScoringRun(tamperedRecord, GOLDEN_RULE_VERSION);
    
    const slotDiscrepancy = replayResult.discrepancies.find(
      d => d.field === 'slotResults.slotScore' && d.slotIndex === 3
    );
    results.push({
      testId: 'AL-027',
      description: 'Discrepancy includes correct slot index',
      passed: slotDiscrepancy !== undefined,
    });
  }

  return results;
}

// =============================================================================
// TEST 4: SERIALIZATION ROUND-TRIP
// =============================================================================

function testSerializationRoundTrip(): TestResult[] {
  const results: TestResult[] = [];

  const adminConfig = createTestAdminConfig();
  const playerStats = createTestPlayerStats();
  const assignments = createTestAssignments();

  const record = createScoringAuditRecord(
    'match-audit-001', adminConfig, assignments, playerStats,
    GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
  );

  // Test 4.1: Serialize produces valid JSON
  let serialized: string;
  let serializeSuccess = true;
  try {
    serialized = serializeAuditRecord(record);
    JSON.parse(serialized); // Verify it's valid JSON
  } catch {
    serializeSuccess = false;
    serialized = '';
  }
  results.push({
    testId: 'AL-028',
    description: 'Serialize produces valid JSON',
    passed: serializeSuccess,
  });

  // Test 4.2: Deserialize recovers record
  let deserialized: ScoringAuditRecord;
  let deserializeSuccess = true;
  try {
    deserialized = deserializeAuditRecord(serialized);
  } catch {
    deserializeSuccess = false;
    deserialized = record; // Fallback for subsequent tests
  }
  results.push({
    testId: 'AL-029',
    description: 'Deserialize recovers record',
    passed: deserializeSuccess,
  });

  // Test 4.3: Round-trip preserves audit ID
  results.push({
    testId: 'AL-030',
    description: 'Round-trip preserves audit ID',
    passed: deserialized.auditId === record.auditId,
  });

  // Test 4.4: Round-trip preserves total score
  results.push({
    testId: 'AL-031',
    description: 'Round-trip preserves total score',
    passed: deserialized.totalScore === record.totalScore,
  });

  // Test 4.5: Round-trip record passes replay
  const replayResult = replayScoringRun(deserialized, GOLDEN_RULE_VERSION);
  results.push({
    testId: 'AL-032',
    description: 'Deserialized record passes replay',
    passed: replayResult.success,
    error: replayResult.success ? undefined : `Discrepancies: ${replayResult.discrepancies.length}`,
  });

  // Test 4.6: Deserialize throws on invalid JSON
  let threwOnInvalid = false;
  try {
    deserializeAuditRecord('{ invalid json }');
  } catch {
    threwOnInvalid = true;
  }
  results.push({
    testId: 'AL-033',
    description: 'Deserialize throws on invalid JSON',
    passed: threwOnInvalid,
  });

  // Test 4.7: Deserialize throws on missing fields
  let threwOnMissing = false;
  try {
    deserializeAuditRecord('{ "auditId": "test" }');
  } catch {
    threwOnMissing = true;
  }
  results.push({
    testId: 'AL-034',
    description: 'Deserialize throws on missing required fields',
    passed: threwOnMissing,
  });

  return results;
}

// =============================================================================
// TEST 5: HASH INTEGRITY
// =============================================================================

function testHashIntegrity(): TestResult[] {
  const results: TestResult[] = [];

  const adminConfig = createTestAdminConfig();
  const playerStats = createTestPlayerStats();
  const assignments = createTestAssignments();

  const record = createScoringAuditRecord(
    'match-audit-001', adminConfig, assignments, playerStats,
    GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
  );

  // Test 5.1: Hash is non-empty string
  const hash1 = computeAuditHash(record);
  results.push({
    testId: 'AL-035',
    description: 'Hash is non-empty string',
    passed: typeof hash1 === 'string' && hash1.length > 0,
  });

  // Test 5.2: Same record produces same hash
  const hash2 = computeAuditHash(record);
  results.push({
    testId: 'AL-036',
    description: 'Same record produces same hash',
    passed: hash1 === hash2,
  });

  // Test 5.3: Tampered record produces different hash
  const tamperedRecord = {
    ...record,
    totalScore: record.totalScore + 1,
  };
  const hash3 = computeAuditHash(tamperedRecord);
  results.push({
    testId: 'AL-037',
    description: 'Tampered record produces different hash',
    passed: hash1 !== hash3,
  });

  // Test 5.4: Different records produce different hashes
  const record2 = createScoringAuditRecord(
    'match-audit-002', adminConfig, assignments, playerStats,
    GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
  );
  const hash4 = computeAuditHash(record2);
  results.push({
    testId: 'AL-038',
    description: 'Different match ID produces different hash',
    passed: hash1 !== hash4,
  });

  return results;
}

// =============================================================================
// TEST 6: DETERMINISM GUARANTEES
// =============================================================================

function testDeterminism(): TestResult[] {
  const results: TestResult[] = [];

  const adminConfig = createTestAdminConfig();
  const playerStats = createTestPlayerStats();
  const assignments = createTestAssignments();

  // Test 6.1: Multiple creations with same timestamp produce identical totalScore
  const record1 = createScoringAuditRecord(
    'match-audit-001', adminConfig, assignments, playerStats,
    GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
  );
  const record2 = createScoringAuditRecord(
    'match-audit-001', adminConfig, assignments, playerStats,
    GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
  );
  
  results.push({
    testId: 'AL-039',
    description: 'Multiple creations produce identical total scores',
    passed: record1.totalScore === record2.totalScore,
  });

  // Test 6.2: Slot results are identical
  let slotResultsMatch = true;
  for (let i = 1; i <= 11; i++) {
    const slot = i as SlotIndex;
    if (record1.slotResults[slot].slotScore !== record2.slotResults[slot].slotScore) {
      slotResultsMatch = false;
      break;
    }
  }
  results.push({
    testId: 'AL-040',
    description: 'Multiple creations produce identical slot scores',
    passed: slotResultsMatch,
  });

  // Test 6.3: Resolved multipliers are identical
  let multipliersMatch = true;
  for (let i = 1; i <= 11; i++) {
    const slot = i as SlotIndex;
    if (record1.resolvedSlotMultipliers[slot] !== record2.resolvedSlotMultipliers[slot]) {
      multipliersMatch = false;
      break;
    }
  }
  results.push({
    testId: 'AL-041',
    description: 'Multiple creations produce identical multipliers',
    passed: multipliersMatch,
  });

  // Test 6.4: Multiple replays produce identical results
  const replay1 = replayScoringRun(record1, GOLDEN_RULE_VERSION);
  const replay2 = replayScoringRun(record1, GOLDEN_RULE_VERSION);
  results.push({
    testId: 'AL-042',
    description: 'Multiple replays produce identical results',
    passed: replay1.recomputedTotalScore === replay2.recomputedTotalScore,
  });

  return results;
}

// =============================================================================
// TEST 7: VALIDATION HELPERS
// =============================================================================

function testValidationHelpers(): TestResult[] {
  const results: TestResult[] = [];

  const adminConfig = createTestAdminConfig();
  const playerStats = createTestPlayerStats();
  const assignments = createTestAssignments();

  const record = createScoringAuditRecord(
    'match-audit-001', adminConfig, assignments, playerStats,
    GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
  );

  // Test 7.1: validateAuditRecord returns true for valid record
  results.push({
    testId: 'AL-043',
    description: 'validateAuditRecord returns true for valid record',
    passed: validateAuditRecord(record) === true,
  });

  // Test 7.2: validateAuditRecord returns false for null
  results.push({
    testId: 'AL-044',
    description: 'validateAuditRecord returns false for null',
    passed: validateAuditRecord(null) === false,
  });

  // Test 7.3: validateAuditRecord returns false for empty object
  results.push({
    testId: 'AL-045',
    description: 'validateAuditRecord returns false for empty object',
    passed: validateAuditRecord({}) === false,
  });

  // Test 7.4: validateAuditRecord returns false for missing auditId
  results.push({
    testId: 'AL-046',
    description: 'validateAuditRecord returns false for missing auditId',
    passed: validateAuditRecord({ ...record, auditId: '' }) === false,
  });

  // Test 7.5: cloneAuditRecord creates deep copy
  const cloned = cloneAuditRecord(record);
  results.push({
    testId: 'AL-047',
    description: 'cloneAuditRecord creates separate object',
    passed: cloned !== record,
  });

  // Test 7.6: cloned record has identical values
  results.push({
    testId: 'AL-048',
    description: 'Cloned record has identical totalScore',
    passed: cloned.totalScore === record.totalScore,
  });

  // Test 7.7: Modifying clone doesn't affect original
  const originalScore = record.totalScore;
  (cloned as any).totalScore = 99999;
  results.push({
    testId: 'AL-049',
    description: 'Modifying clone does not affect original',
    passed: record.totalScore === originalScore,
  });

  return results;
}

// =============================================================================
// TEST 8: CONFLICT HANDLING IN AUDIT
// =============================================================================

function testConflictHandlingInAudit(): TestResult[] {
  const results: TestResult[] = [];

  const adminConfig = createTestAdminConfig();
  const playerStats = createTestPlayerStats();
  
  // Create assignments with conflicts
  const conflictingAssignments: Partial<Record<SlotIndex, string | null>> = {
    1: 'player-A',
    2: 'player-A', // Conflict! Same as slot 1
    3: 'player-B',
    4: 'player-B', // Conflict! Same as slot 3
    5: 'player-C',
  };

  const record = createScoringAuditRecord(
    'match-conflict-001', adminConfig, conflictingAssignments, playerStats,
    GOLDEN_RULE_VERSION, FIXED_TIMESTAMP
  );

  // Test 8.1: Conflicts are detected
  results.push({
    testId: 'AL-050',
    description: 'hadConflicts is true when conflicts exist',
    passed: record.hadConflicts === true,
  });

  // Test 8.2: Correct number of slots cleared
  results.push({
    testId: 'AL-051',
    description: 'conflictsClearedCount is 2 (slots 2 and 4)',
    passed: record.conflictsClearedCount === 2,
    error: record.conflictsClearedCount === 2 ? undefined : `Got: ${record.conflictsClearedCount}`,
  });

  // Test 8.3: Resolved assignments have conflicts removed
  results.push({
    testId: 'AL-052',
    description: 'Slot 1 keeps player-A',
    passed: record.resolvedSlotAssignments[1] === 'player-A',
  });

  results.push({
    testId: 'AL-053',
    description: 'Slot 2 is cleared (was duplicate)',
    passed: record.resolvedSlotAssignments[2] === null,
  });

  results.push({
    testId: 'AL-054',
    description: 'Slot 3 keeps player-B',
    passed: record.resolvedSlotAssignments[3] === 'player-B',
  });

  results.push({
    testId: 'AL-055',
    description: 'Slot 4 is cleared (was duplicate)',
    passed: record.resolvedSlotAssignments[4] === null,
  });

  // Test 8.4: Replay succeeds even with conflicts
  const replayResult = replayScoringRun(record, GOLDEN_RULE_VERSION);
  results.push({
    testId: 'AL-056',
    description: 'Replay succeeds for record with conflicts',
    passed: replayResult.success === true,
  });

  return results;
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

export interface AuditLogTestSuiteResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: TestResult[];
  readonly executionTimeMs: number;
}

export function runAuditLogTests(): AuditLogTestSuiteResult {
  const startTime = performance.now();

  const allResults: TestResult[] = [
    ...testAuditRecordCreation(),
    ...testSuccessfulReplay(),
    ...testReplayFailureOnTampering(),
    ...testSerializationRoundTrip(),
    ...testHashIntegrity(),
    ...testDeterminism(),
    ...testValidationHelpers(),
    ...testConflictHandlingInAudit(),
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

function printAuditLogTestResults(
  suiteResult: AuditLogTestSuiteResult
): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — AUDIT LOG & REPLAY UNIT TESTS');
  console.log('Authority: Constitution.md v1.0, Section 15.2 (Auditability)');
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
    console.log('Audit log and replay guarantees are properly implemented');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runAuditLogTests();
  printAuditLogTestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printAuditLogTestResults };
