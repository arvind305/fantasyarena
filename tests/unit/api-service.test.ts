/**
 * IPL Friends Betting Game — API Service Unit Tests
 * 
 * Authority: Constitution.md v1.0
 * 
 * PURPOSE:
 * These tests validate the UI-ready API service layer functionality,
 * ensuring proper integration with the scoring engine.
 * 
 * TEST COVERAGE:
 * 1. Successful end-to-end API flows
 * 2. Multiple users in the same match
 * 3. Leaderboard ordering correctness
 * 4. Error handling for edge cases
 * 5. Audit record generation and retrieval
 */

import {
  createMatch,
  submitTeam,
  ingestPlayerStats,
  computeMatchScores,
  getLeaderboard,
  getAuditRecord,
  clearAllMatches,
  matchExists,
  getMatchCount,
  ApiErrorCode,
  type CreateMatchResponse,
  type SubmitTeamResponse,
  type ComputeScoresResponse,
  type LeaderboardResponse,
  type AuditRecordResponse,
  type ApiErrorResponse,
} from '../src/api/match-service';

import { CONSTITUTION_VERSION } from '../src/domain/constitution-version';
import type { AdminSlotMultiplierConfig } from '../src/domain/admin-config';
import type { SlotIndex } from '../src/domain/slot-assignment';
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

function createTestAdminConfig(matchId: string): AdminSlotMultiplierConfig {
  return {
    matchId,
    multipliers: {
      1: 20, 2: 18, 3: 16, 4: 14, 5: 12,
      6: 10, 7: 8, 8: 6, 9: 4, 10: 2, 11: 1,
    },
    configuredAt: new Date('2025-01-20T10:00:00Z'),
    configuredBy: 'admin-test',
  };
}

function createTestPlayerStats(matchId: string): Record<string, PlayerMatchStats> {
  return {
    'kohli': {
      playerId: 'kohli',
      matchId,
      runs: 82,
      ballsFaced: 53,
      fours: 9,
      sixes: 2,
      wickets: 0,
      oversBowled: 0,
      runsConceded: 0,
      hasTakenHatTrick: false,
      catches: 1,
      runOuts: 0,
      stumpings: 0,
      isManOfTheMatch: true,
    },
    'bumrah': {
      playerId: 'bumrah',
      matchId,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      wickets: 4,
      oversBowled: 4,
      runsConceded: 22,
      hasTakenHatTrick: false,
      catches: 0,
      runOuts: 0,
      stumpings: 0,
      isManOfTheMatch: false,
    },
    'jadeja': {
      playerId: 'jadeja',
      matchId,
      runs: 35,
      ballsFaced: 22,
      fours: 3,
      sixes: 1,
      wickets: 2,
      oversBowled: 4,
      runsConceded: 28,
      hasTakenHatTrick: false,
      catches: 2,
      runOuts: 1,
      stumpings: 0,
      isManOfTheMatch: false,
    },
    'dhoni': {
      playerId: 'dhoni',
      matchId,
      runs: 25,
      ballsFaced: 18,
      fours: 2,
      sixes: 1,
      wickets: 0,
      oversBowled: 0,
      runsConceded: 0,
      hasTakenHatTrick: false,
      catches: 1,
      runOuts: 0,
      stumpings: 2,
      isManOfTheMatch: false,
    },
    'rohit': {
      playerId: 'rohit',
      matchId,
      runs: 45,
      ballsFaced: 32,
      fours: 5,
      sixes: 2,
      wickets: 0,
      oversBowled: 0,
      runsConceded: 0,
      hasTakenHatTrick: false,
      catches: 0,
      runOuts: 0,
      stumpings: 0,
      isManOfTheMatch: false,
    },
  };
}

// =============================================================================
// TEST 1: CREATE MATCH
// =============================================================================

function testCreateMatch(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  // Test 1.1: Successful match creation
  {
    const config = createTestAdminConfig('match-api-001');
    const response = createMatch('match-api-001', config);

    results.push({
      testId: 'API-001',
      description: 'createMatch succeeds with valid config',
      passed: response.success === true,
    });

    if (response.success) {
      results.push({
        testId: 'API-002',
        description: 'createMatch response includes constitutionVersion',
        passed: response.constitutionVersion === CONSTITUTION_VERSION,
      });

      results.push({
        testId: 'API-003',
        description: 'createMatch response includes matchId',
        passed: response.matchId === 'match-api-001',
      });

      results.push({
        testId: 'API-004',
        description: 'createMatch response includes resolvedMultipliers',
        passed: Object.keys(response.resolvedMultipliers).length === 11,
      });

      results.push({
        testId: 'API-005',
        description: 'createMatch stores match in memory',
        passed: matchExists('match-api-001'),
      });
    }
  }

  // Test 1.2: Duplicate match creation fails
  {
    const config = createTestAdminConfig('match-api-001');
    const response = createMatch('match-api-001', config);

    results.push({
      testId: 'API-006',
      description: 'createMatch fails for duplicate matchId',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.MATCH_ALREADY_EXISTS,
    });
  }

  // Test 1.3: Invalid admin config fails
  {
    const invalidConfig = {
      matchId: 'match-invalid',
      multipliers: { 1: -5 }, // Negative multiplier
      configuredAt: new Date(),
      configuredBy: 'admin',
    };
    const response = createMatch('match-invalid', invalidConfig);

    results.push({
      testId: 'API-007',
      description: 'createMatch fails with invalid admin config',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.INVALID_ADMIN_CONFIG,
    });
  }

  return results;
}

// =============================================================================
// TEST 2: SUBMIT TEAM
// =============================================================================

function testSubmitTeam(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  // Setup match
  const config = createTestAdminConfig('match-submit-001');
  createMatch('match-submit-001', config);

  // Test 2.1: Successful team submission
  {
    const assignments: Partial<Record<SlotIndex, string | null>> = {
      1: 'kohli',
      2: 'bumrah',
      3: 'jadeja',
    };
    const response = submitTeam('match-submit-001', 'user-A', assignments);

    results.push({
      testId: 'API-008',
      description: 'submitTeam succeeds with valid assignments',
      passed: response.success === true,
    });

    if (response.success) {
      results.push({
        testId: 'API-009',
        description: 'submitTeam response includes userId',
        passed: response.userId === 'user-A',
      });

      results.push({
        testId: 'API-010',
        description: 'submitTeam resolves all 11 slots',
        passed: Object.keys(response.resolvedAssignments).length === 11,
      });

      results.push({
        testId: 'API-011',
        description: 'submitTeam preserves assigned players',
        passed: response.resolvedAssignments[1] === 'kohli' &&
                response.resolvedAssignments[2] === 'bumrah',
      });
    }
  }

  // Test 2.2: Team submission with conflicts
  {
    const conflictingAssignments: Partial<Record<SlotIndex, string | null>> = {
      1: 'kohli',
      2: 'kohli', // Duplicate!
      3: 'jadeja',
    };
    const response = submitTeam('match-submit-001', 'user-B', conflictingAssignments);

    results.push({
      testId: 'API-012',
      description: 'submitTeam handles conflicts',
      passed: response.success === true,
    });

    if (response.success) {
      results.push({
        testId: 'API-013',
        description: 'submitTeam reports hadConflicts=true for duplicates',
        passed: response.hadConflicts === true,
      });

      results.push({
        testId: 'API-014',
        description: 'submitTeam reports conflictsClearedCount=1',
        passed: response.conflictsClearedCount === 1,
      });

      results.push({
        testId: 'API-015',
        description: 'submitTeam keeps first occurrence (slot 1)',
        passed: response.resolvedAssignments[1] === 'kohli',
      });

      results.push({
        testId: 'API-016',
        description: 'submitTeam clears duplicate (slot 2)',
        passed: response.resolvedAssignments[2] === null,
      });
    }
  }

  // Test 2.3: Team submission for non-existent match
  {
    const response = submitTeam('match-nonexistent', 'user-A', { 1: 'kohli' });

    results.push({
      testId: 'API-017',
      description: 'submitTeam fails for non-existent match',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.MATCH_NOT_FOUND,
    });
  }

  return results;
}

// =============================================================================
// TEST 3: INGEST PLAYER STATS
// =============================================================================

function testIngestPlayerStats(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  // Setup match
  const config = createTestAdminConfig('match-stats-001');
  createMatch('match-stats-001', config);

  // Test 3.1: Successful stats ingestion
  {
    const stats = createTestPlayerStats('match-stats-001');
    const response = ingestPlayerStats('match-stats-001', stats);

    results.push({
      testId: 'API-018',
      description: 'ingestPlayerStats succeeds with valid stats',
      passed: response.success === true,
    });

    if (response.success) {
      results.push({
        testId: 'API-019',
        description: 'ingestPlayerStats reports correct count',
        passed: response.playersIngested === 5,
      });

      results.push({
        testId: 'API-020',
        description: 'ingestPlayerStats includes playerIds',
        passed: response.playerIds.includes('kohli') && response.playerIds.includes('bumrah'),
      });
    }
  }

  // Test 3.2: Stats ingestion for non-existent match
  {
    const response = ingestPlayerStats('match-nonexistent', {});

    results.push({
      testId: 'API-021',
      description: 'ingestPlayerStats fails for non-existent match',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.MATCH_NOT_FOUND,
    });
  }

  return results;
}

// =============================================================================
// TEST 4: COMPUTE MATCH SCORES
// =============================================================================

function testComputeMatchScores(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  // Setup match with teams and stats
  const config = createTestAdminConfig('match-score-001');
  createMatch('match-score-001', config);

  submitTeam('match-score-001', 'user-A', { 1: 'kohli', 2: 'bumrah', 3: 'jadeja' });
  submitTeam('match-score-001', 'user-B', { 1: 'rohit', 2: 'dhoni', 3: 'jadeja' });

  ingestPlayerStats('match-score-001', createTestPlayerStats('match-score-001'));

  // Test 4.1: Successful scoring
  {
    const response = computeMatchScores('match-score-001');

    results.push({
      testId: 'API-022',
      description: 'computeMatchScores succeeds',
      passed: response.success === true,
    });

    if (response.success) {
      results.push({
        testId: 'API-023',
        description: 'computeMatchScores scores correct number of users',
        passed: response.usersScored === 2,
      });

      results.push({
        testId: 'API-024',
        description: 'computeMatchScores includes user-A scores',
        passed: 'user-A' in response.scores,
      });

      results.push({
        testId: 'API-025',
        description: 'computeMatchScores includes user-B scores',
        passed: 'user-B' in response.scores,
      });

      results.push({
        testId: 'API-026',
        description: 'computeMatchScores assigns ranks',
        passed: response.scores['user-A'].rank >= 1 && response.scores['user-B'].rank >= 1,
      });

      results.push({
        testId: 'API-027',
        description: 'computeMatchScores includes slot scores',
        passed: Object.keys(response.scores['user-A'].slotScores).length === 11,
      });
    }
  }

  // Test 4.2: Scoring without stats fails
  {
    clearAllMatches();
    createMatch('match-no-stats', createTestAdminConfig('match-no-stats'));
    submitTeam('match-no-stats', 'user-A', { 1: 'kohli' });
    
    const response = computeMatchScores('match-no-stats');

    results.push({
      testId: 'API-028',
      description: 'computeMatchScores fails without player stats',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.NO_PLAYER_STATS,
    });
  }

  // Test 4.3: Scoring without teams fails
  {
    clearAllMatches();
    createMatch('match-no-teams', createTestAdminConfig('match-no-teams'));
    ingestPlayerStats('match-no-teams', createTestPlayerStats('match-no-teams'));
    
    const response = computeMatchScores('match-no-teams');

    results.push({
      testId: 'API-029',
      description: 'computeMatchScores fails without teams',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.NO_TEAMS_SUBMITTED,
    });
  }

  return results;
}

// =============================================================================
// TEST 5: LEADERBOARD
// =============================================================================

function testLeaderboard(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  // Setup match with multiple users
  const config = createTestAdminConfig('match-lb-001');
  createMatch('match-lb-001', config);

  // User A: High scorer (kohli in slot 1)
  submitTeam('match-lb-001', 'user-high', { 1: 'kohli', 2: 'bumrah' });
  
  // User B: Medium scorer (jadeja in slot 1)
  submitTeam('match-lb-001', 'user-mid', { 1: 'jadeja', 2: 'dhoni' });
  
  // User C: Lower scorer (dhoni in slot 1)
  submitTeam('match-lb-001', 'user-low', { 1: 'dhoni', 2: 'rohit' });

  ingestPlayerStats('match-lb-001', createTestPlayerStats('match-lb-001'));
  computeMatchScores('match-lb-001');

  // Test 5.1: Get leaderboard
  {
    const response = getLeaderboard('match-lb-001');

    results.push({
      testId: 'API-030',
      description: 'getLeaderboard succeeds after scoring',
      passed: response.success === true,
    });

    if (response.success) {
      results.push({
        testId: 'API-031',
        description: 'getLeaderboard includes all participants',
        passed: response.totalParticipants === 3,
      });

      results.push({
        testId: 'API-032',
        description: 'getLeaderboard is sorted by rank',
        passed: response.leaderboard[0].rank <= response.leaderboard[1].rank &&
                response.leaderboard[1].rank <= response.leaderboard[2].rank,
      });

      // Kohli has highest stats, so user-high should be rank 1
      results.push({
        testId: 'API-033',
        description: 'getLeaderboard rank 1 has highest score',
        passed: response.leaderboard[0].totalScore >= response.leaderboard[1].totalScore,
      });

      results.push({
        testId: 'API-034',
        description: 'getLeaderboard rank 1 is user-high (kohli)',
        passed: response.leaderboard[0].userId === 'user-high',
      });
    }
  }

  // Test 5.2: Leaderboard before scoring fails
  {
    clearAllMatches();
    createMatch('match-unscored', createTestAdminConfig('match-unscored'));
    submitTeam('match-unscored', 'user-A', { 1: 'kohli' });
    ingestPlayerStats('match-unscored', createTestPlayerStats('match-unscored'));
    
    const response = getLeaderboard('match-unscored');

    results.push({
      testId: 'API-035',
      description: 'getLeaderboard fails before scoring',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.MATCH_NOT_SCORED,
    });
  }

  return results;
}

// =============================================================================
// TEST 6: TIED RANKINGS
// =============================================================================

function testTiedRankings(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  // Setup match where two users have same team (same score)
  const config = createTestAdminConfig('match-tie-001');
  createMatch('match-tie-001', config);

  // Both users pick exactly the same team
  submitTeam('match-tie-001', 'user-tie-1', { 1: 'kohli', 2: 'bumrah' });
  submitTeam('match-tie-001', 'user-tie-2', { 1: 'kohli', 2: 'bumrah' });
  submitTeam('match-tie-001', 'user-lower', { 1: 'dhoni', 2: 'rohit' });

  ingestPlayerStats('match-tie-001', createTestPlayerStats('match-tie-001'));
  computeMatchScores('match-tie-001');

  const response = getLeaderboard('match-tie-001');

  if (response.success) {
    // Find tied users
    const tiedUsers = response.leaderboard.filter(e => 
      e.userId === 'user-tie-1' || e.userId === 'user-tie-2'
    );

    results.push({
      testId: 'API-036',
      description: 'Tied users have same score',
      passed: tiedUsers[0].totalScore === tiedUsers[1].totalScore,
    });

    results.push({
      testId: 'API-037',
      description: 'Tied users have same rank',
      passed: tiedUsers[0].rank === tiedUsers[1].rank,
    });

    results.push({
      testId: 'API-038',
      description: 'Tied users are rank 1',
      passed: tiedUsers[0].rank === 1,
    });

    // Lower user should be rank 3 (since 2 tied at 1)
    const lowerUser = response.leaderboard.find(e => e.userId === 'user-lower');
    results.push({
      testId: 'API-039',
      description: 'Third place user has correct rank (3, not 2)',
      passed: lowerUser?.rank === 3,
      error: lowerUser ? `Got rank ${lowerUser.rank}` : 'User not found',
    });
  } else {
    results.push({
      testId: 'API-036',
      description: 'Tied users have same score',
      passed: false,
      error: 'Leaderboard request failed',
    });
  }

  return results;
}

// =============================================================================
// TEST 7: AUDIT RECORDS
// =============================================================================

function testAuditRecords(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  // Setup and score match
  const config = createTestAdminConfig('match-audit-001');
  createMatch('match-audit-001', config);
  submitTeam('match-audit-001', 'user-audit', { 1: 'kohli', 2: 'bumrah', 3: 'jadeja' });
  ingestPlayerStats('match-audit-001', createTestPlayerStats('match-audit-001'));
  computeMatchScores('match-audit-001');

  // Test 7.1: Get audit record
  {
    const response = getAuditRecord('match-audit-001', 'user-audit');

    results.push({
      testId: 'API-040',
      description: 'getAuditRecord succeeds',
      passed: response.success === true,
    });

    if (response.success) {
      results.push({
        testId: 'API-041',
        description: 'Audit record includes matchId',
        passed: response.auditRecord.matchId === 'match-audit-001',
      });

      results.push({
        testId: 'API-042',
        description: 'Audit record includes constitutionVersion',
        passed: response.auditRecord.constitutionVersion === CONSTITUTION_VERSION,
      });

      results.push({
        testId: 'API-043',
        description: 'Audit record includes slotResults',
        passed: Object.keys(response.auditRecord.slotResults).length === 11,
      });

      results.push({
        testId: 'API-044',
        description: 'Audit record includes totalScore',
        passed: typeof response.auditRecord.totalScore === 'number',
      });

      results.push({
        testId: 'API-045',
        description: 'Audit record preserves adminConfig',
        passed: response.auditRecord.adminConfig.matchId === 'match-audit-001',
      });
    }
  }

  // Test 7.2: Audit record for non-existent user
  {
    const response = getAuditRecord('match-audit-001', 'user-nonexistent');

    results.push({
      testId: 'API-046',
      description: 'getAuditRecord fails for non-existent user',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.USER_NOT_FOUND,
    });
  }

  // Test 7.3: Audit record before scoring
  {
    clearAllMatches();
    createMatch('match-unscored-audit', createTestAdminConfig('match-unscored-audit'));
    submitTeam('match-unscored-audit', 'user-A', { 1: 'kohli' });
    
    const response = getAuditRecord('match-unscored-audit', 'user-A');

    results.push({
      testId: 'API-047',
      description: 'getAuditRecord fails before scoring',
      passed: response.success === false && (response as ApiErrorResponse).errorCode === ApiErrorCode.MATCH_NOT_SCORED,
    });
  }

  return results;
}

// =============================================================================
// TEST 8: END-TO-END FLOW
// =============================================================================

function testEndToEndFlow(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  const matchId = 'match-e2e-001';

  // Step 1: Create match
  const createResponse = createMatch(matchId, createTestAdminConfig(matchId));
  results.push({
    testId: 'API-048',
    description: 'E2E: Match created successfully',
    passed: createResponse.success === true,
  });

  // Step 2: Submit teams for 3 users
  const team1Response = submitTeam(matchId, 'alice', { 1: 'kohli', 2: 'bumrah', 3: 'jadeja', 4: 'dhoni', 5: 'rohit' });
  const team2Response = submitTeam(matchId, 'bob', { 1: 'bumrah', 2: 'kohli', 3: 'rohit' });
  const team3Response = submitTeam(matchId, 'charlie', { 1: 'jadeja', 2: 'jadeja', 3: 'dhoni' }); // With conflict

  results.push({
    testId: 'API-049',
    description: 'E2E: All teams submitted',
    passed: team1Response.success && team2Response.success && team3Response.success,
  });

  if (team3Response.success) {
    results.push({
      testId: 'API-050',
      description: 'E2E: Conflicts detected for charlie',
      passed: team3Response.hadConflicts === true,
    });
  }

  // Step 3: Ingest player stats
  const statsResponse = ingestPlayerStats(matchId, createTestPlayerStats(matchId));
  results.push({
    testId: 'API-051',
    description: 'E2E: Player stats ingested',
    passed: statsResponse.success === true,
  });

  // Step 4: Compute scores
  const scoreResponse = computeMatchScores(matchId);
  results.push({
    testId: 'API-052',
    description: 'E2E: Scores computed',
    passed: scoreResponse.success === true,
  });

  if (scoreResponse.success) {
    results.push({
      testId: 'API-053',
      description: 'E2E: All 3 users scored',
      passed: scoreResponse.usersScored === 3,
    });
  }

  // Step 5: Get leaderboard
  const lbResponse = getLeaderboard(matchId);
  results.push({
    testId: 'API-054',
    description: 'E2E: Leaderboard retrieved',
    passed: lbResponse.success === true,
  });

  if (lbResponse.success) {
    results.push({
      testId: 'API-055',
      description: 'E2E: Leaderboard has 3 entries',
      passed: lbResponse.leaderboard.length === 3,
    });

    // Alice should have highest score (kohli in slot 1 = 20× multiplier)
    results.push({
      testId: 'API-056',
      description: 'E2E: Alice is rank 1 (kohli in slot 1)',
      passed: lbResponse.leaderboard[0].userId === 'alice',
      error: lbResponse.leaderboard[0].userId === 'alice' ? undefined : `Got ${lbResponse.leaderboard[0].userId}`,
    });
  }

  // Step 6: Get audit records
  const aliceAudit = getAuditRecord(matchId, 'alice');
  const charlieAudit = getAuditRecord(matchId, 'charlie');

  results.push({
    testId: 'API-057',
    description: 'E2E: Audit record retrieved for alice',
    passed: aliceAudit.success === true,
  });

  results.push({
    testId: 'API-058',
    description: 'E2E: Audit record retrieved for charlie',
    passed: charlieAudit.success === true,
  });

  // Verify determinism: scores in leaderboard match audit records
  if (lbResponse.success && aliceAudit.success) {
    const aliceFromLB = lbResponse.leaderboard.find(e => e.userId === 'alice');
    results.push({
      testId: 'API-059',
      description: 'E2E: Leaderboard score matches audit record',
      passed: aliceFromLB?.totalScore === aliceAudit.auditRecord.totalScore,
    });
  }

  return results;
}

// =============================================================================
// TEST 9: RESPONSE STRUCTURE VALIDATION
// =============================================================================

function testResponseStructure(): TestResult[] {
  const results: TestResult[] = [];
  clearAllMatches();

  // All API responses must include constitutionVersion, matchId, timestamp

  const config = createTestAdminConfig('match-struct-001');
  const createResponse = createMatch('match-struct-001', config);

  results.push({
    testId: 'API-060',
    description: 'All responses have constitutionVersion',
    passed: createResponse.constitutionVersion === CONSTITUTION_VERSION,
  });

  results.push({
    testId: 'API-061',
    description: 'All responses have matchId',
    passed: createResponse.matchId === 'match-struct-001',
  });

  results.push({
    testId: 'API-062',
    description: 'All responses have timestamp (ISO format)',
    passed: typeof createResponse.timestamp === 'string' && createResponse.timestamp.includes('T'),
  });

  // Error responses also include these
  const errorResponse = createMatch('match-struct-001', config) as ApiErrorResponse;

  results.push({
    testId: 'API-063',
    description: 'Error responses have constitutionVersion',
    passed: errorResponse.constitutionVersion === CONSTITUTION_VERSION,
  });

  results.push({
    testId: 'API-064',
    description: 'Error responses have errorCode',
    passed: typeof errorResponse.errorCode === 'string',
  });

  results.push({
    testId: 'API-065',
    description: 'Error responses have errorMessage',
    passed: typeof errorResponse.errorMessage === 'string',
  });

  return results;
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

export interface ApiServiceTestSuiteResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: TestResult[];
  readonly executionTimeMs: number;
}

export function runApiServiceTests(): ApiServiceTestSuiteResult {
  const startTime = performance.now();

  // Clear state before running tests
  clearAllMatches();

  const allResults: TestResult[] = [
    ...testCreateMatch(),
    ...testSubmitTeam(),
    ...testIngestPlayerStats(),
    ...testComputeMatchScores(),
    ...testLeaderboard(),
    ...testTiedRankings(),
    ...testAuditRecords(),
    ...testEndToEndFlow(),
    ...testResponseStructure(),
  ];

  // Clean up after tests
  clearAllMatches();

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

function printApiServiceTestResults(
  suiteResult: ApiServiceTestSuiteResult
): void {
  console.log('\n' + '='.repeat(70));
  console.log('IPL BETTING GAME — API SERVICE UNIT TESTS');
  console.log('Authority: Constitution.md v1.0');
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
    console.log('API service layer is UI-ready');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

if (require.main === module) {
  const result = runApiServiceTests();
  printApiServiceTestResults(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

export { printApiServiceTestResults };
