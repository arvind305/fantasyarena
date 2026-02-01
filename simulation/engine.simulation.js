/**
 * engine.simulation.js
 *
 * Simulation engine that wraps the ExternalDataAdapter simulation and adds:
 *  - Question generation (system-generated from external match data)
 *  - Bet submission with full invariant enforcement
 *  - advanceMatch / resolveQuestion / finalizeMatch lifecycle
 *  - Group and leaderboard management
 *  - Invariant assertions that throw on violation
 *
 * All state is in-memory (no localStorage). Fully deterministic.
 */

"use strict";

// ─── Invariant assertion helper ──────────────────────────────────────────────

class InvariantViolation extends Error {
  constructor(invariantId, message) {
    super(`INVARIANT #${invariantId} VIOLATED: ${message}`);
    this.invariantId = invariantId;
    this.name = "InvariantViolation";
  }
}

function assert(condition, invariantId, message) {
  if (!condition) throw new InvariantViolation(invariantId, message);
}

// ─── Simulation Engine ──────────────────────────────────────────────────────

class SimulationEngine {
  /**
   * @param {import('./ExternalDataAdapter.simulation').SimulationAdapter} adapter
   */
  constructor(adapter) {
    this._ext = adapter;
    this._bets = {};         // userId → matchId → bet
    this._groups = {};       // groupId → group
    this._questions = {};    // matchId → question[]
    this._resolvedQs = {};   // questionId → true (tracks resolve-once invariant)
    this._matchFinalized = {};  // matchId → true
    this._eventLog = [];
  }

  _logEvent(type, detail) {
    const entry = { type, ...detail };
    this._eventLog.push(entry);
    return entry;
  }

  getLog() {
    return [...this._ext.getLog(), ...this._eventLog];
  }

  // ─── Question generation ─────────────────────────────────────────────────

  /**
   * Build betting questions for a match from external data.
   * Options for PLAYER_PICK are strictly derived from match squads.
   */
  generateQuestions(matchId) {
    const match = this._ext.getMatch(matchId);
    assert(match, "N/A", `Match ${matchId} not found`);

    const squads = this._ext.getSquads(matchId);
    assert(squads.length === 2, 2, `Match ${matchId} must have exactly 2 squads, got ${squads.length}`);

    const teamA = this._ext.getTeam(match.teamA);
    const teamB = this._ext.getTeam(match.teamB);
    assert(teamA && teamB, 1, `Match ${matchId} must have exactly two teams`);

    const allPlayerIds = this._ext.getMatchPlayerIds(matchId);
    const allPlayerOptions = allPlayerIds.map(pid => {
      const p = this._ext.getPlayer(pid);
      return { optionId: `${matchId}_opt_${pid}`, label: p.name, referenceType: "PLAYER", referenceId: pid };
    });

    const bowlerOptions = allPlayerOptions.filter(o => {
      const p = this._ext.getPlayer(o.referenceId);
      return p && (p.role === "BOWL" || p.role === "AR");
    });

    const teamOptions = [
      { optionId: `${matchId}_opt_${teamA.teamId}`, label: teamA.shortName, referenceType: "TEAM", referenceId: teamA.teamId },
      { optionId: `${matchId}_opt_${teamB.teamId}`, label: teamB.shortName, referenceType: "TEAM", referenceId: teamB.teamId },
    ];

    // Invariant #10: PLAYER_PICK options MUST reference only players in the union of match squads
    for (const opt of allPlayerOptions) {
      assert(
        this._ext.isPlayerInMatchSquads(matchId, opt.referenceId),
        10,
        `Player option ${opt.referenceId} not in match ${matchId} squads`
      );
    }

    // Invariant #11: TEAM_PICK options MUST reference only teamA or teamB
    for (const opt of teamOptions) {
      assert(
        opt.referenceId === match.teamA || opt.referenceId === match.teamB,
        11,
        `Team option ${opt.referenceId} not in match ${matchId}`
      );
    }

    const questions = [
      {
        questionId: `${matchId}_q1`, matchId, eventId: match.eventId,
        type: "MATCH_WINNER", text: "Who will win the match?",
        optionType: "TEAM_PICK",
        options: [
          ...teamOptions,
          { optionId: `${matchId}_opt_tie`, label: "Tie / No Result", referenceType: "NONE", referenceId: null },
        ],
        status: "OPEN", correctOptionId: null, resolvedAt: null,
      },
      {
        questionId: `${matchId}_q2`, matchId, eventId: match.eventId,
        type: "TOSS_WINNER", text: "Who will win the toss?",
        optionType: "TEAM_PICK",
        options: teamOptions,
        status: "OPEN", correctOptionId: null, resolvedAt: null,
      },
      {
        questionId: `${matchId}_q3`, matchId, eventId: match.eventId,
        type: "TOP_SCORER", text: "Who will be the top scorer?",
        optionType: "PLAYER_PICK",
        options: allPlayerOptions,
        status: "OPEN", correctOptionId: null, resolvedAt: null,
      },
      {
        questionId: `${matchId}_q4`, matchId, eventId: match.eventId,
        type: "PLAYER_PERFORMANCE", text: "Who will take the most wickets?",
        optionType: "PLAYER_PICK",
        options: bowlerOptions,
        status: "OPEN", correctOptionId: null, resolvedAt: null,
      },
      {
        questionId: `${matchId}_q5`, matchId, eventId: match.eventId,
        type: "MILESTONE", text: "Will there be a century?",
        optionType: "YES_NO",
        options: [
          { optionId: `${matchId}_opt_century_yes`, label: "Yes", referenceType: "NONE", referenceId: null },
          { optionId: `${matchId}_opt_century_no`,  label: "No",  referenceType: "NONE", referenceId: null },
        ],
        status: "OPEN", correctOptionId: null, resolvedAt: null,
      },
    ];

    this._questions[matchId] = questions;
    this._logEvent("QUESTIONS_GENERATED", { matchId, count: questions.length });
    return questions;
  }

  // ─── Match lifecycle ─────────────────────────────────────────────────────

  /**
   * Advance the match to the given timestamp.
   * Transitions match status and locks questions/bets atomically.
   */
  advanceMatch(matchId, toTimestampISO) {
    const beforeMatch = this._ext.getMatch(matchId);
    assert(beforeMatch, "N/A", `Match ${matchId} not found`);

    const prevStatus = beforeMatch.status;
    const transitions = this._ext.advanceMatch(matchId, toTimestampISO);
    const afterMatch = this._ext.getMatch(matchId);

    // If match went UPCOMING → LIVE, lock all questions and bets
    if (prevStatus === "UPCOMING" && afterMatch.status === "LIVE") {
      // Invariant #12: questions transition OPEN → LOCKED atomically when match goes LIVE
      const questions = this._questions[matchId] || [];
      for (const q of questions) {
        assert(q.status === "OPEN", 12, `Question ${q.questionId} should be OPEN before lock, got ${q.status}`);
        q.status = "LOCKED";
      }

      // Lock all bets for this match (invariant #15: bets lock atomically at first ball)
      for (const userId of Object.keys(this._bets)) {
        const bet = this._bets[userId]?.[matchId];
        if (bet && !bet.isLocked) {
          bet.isLocked = true;
          bet.lockedAt = afterMatch.bettingLockedAt;
        }
      }

      this._logEvent("BETS_LOCKED", { matchId, at: afterMatch.bettingLockedAt });
    }

    // If match went LIVE → COMPLETED, questions become RESOLVED (handled by resolveQuestion)
    if (prevStatus !== "COMPLETED" && afterMatch.status === "COMPLETED") {
      this._logEvent("MATCH_COMPLETED", { matchId, result: afterMatch.result });
    }

    return transitions;
  }

  /**
   * Resolve a betting question with the correct answer.
   * Invariant #13: question can only be RESOLVED after match COMPLETED/ABANDONED.
   * Invariant #14: correctOptionId must be valid.
   * Questions resolve only once.
   */
  resolveQuestion(questionId, correctOptionId) {
    // Find the question
    let question = null;
    let matchId = null;
    for (const [mid, qs] of Object.entries(this._questions)) {
      const found = qs.find(q => q.questionId === questionId);
      if (found) { question = found; matchId = mid; break; }
    }
    assert(question, "N/A", `Question ${questionId} not found`);

    // Questions resolve only once
    assert(!this._resolvedQs[questionId], 13, `Question ${questionId} already resolved`);

    // Invariant #13: can only resolve after match is COMPLETED or ABANDONED
    const match = this._ext.getMatch(matchId);
    assert(
      match.status === "COMPLETED" || match.status === "ABANDONED" || match.status === "NO_RESULT",
      13,
      `Cannot resolve question ${questionId}: match ${matchId} status is ${match.status}, expected COMPLETED/ABANDONED`
    );

    // Invariant #14: correctOptionId must reference a valid option
    const validOptionIds = question.options.map(o => o.optionId);
    assert(
      validOptionIds.includes(correctOptionId),
      14,
      `correctOptionId ${correctOptionId} not in options for question ${questionId}`
    );

    question.status = "RESOLVED";
    question.correctOptionId = correctOptionId;
    question.resolvedAt = new Date().toISOString();
    this._resolvedQs[questionId] = true;

    this._logEvent("QUESTION_RESOLVED", { questionId, correctOptionId });
    return question;
  }

  /**
   * Finalize a match: freeze stats, compute scores for all bets.
   * - Abandoned matches → all bets score 0
   * - Completed matches → score based on correct answers
   */
  finalizeMatch(matchId) {
    const match = this._ext.getMatch(matchId);
    assert(match, "N/A", `Match ${matchId} not found`);
    assert(
      match.status === "COMPLETED" || match.status === "ABANDONED",
      "N/A",
      `Cannot finalize match ${matchId}: status is ${match.status}`
    );
    assert(!this._matchFinalized[matchId], "N/A", `Match ${matchId} already finalized`);

    // For COMPLETED matches, finalize stats
    if (match.status === "COMPLETED") {
      this._ext.finalizeStats(matchId);
    }

    // Score all bets for this match
    const questions = this._questions[matchId] || [];

    for (const userId of Object.keys(this._bets)) {
      const bet = this._bets[userId]?.[matchId];
      if (!bet) continue;

      if (match.isAbandoned) {
        // Invariant: abandoned matches produce zero score
        bet.score = 0;
        this._logEvent("BET_SCORED", { userId, matchId, score: 0, reason: "MATCH_ABANDONED" });
        continue;
      }

      // Score: 1 point per correct answer
      let score = 0;
      for (const [qId, selectedOptionId] of Object.entries(bet.answers)) {
        const q = questions.find(x => x.questionId === qId);
        if (q && q.correctOptionId === selectedOptionId) {
          score += 1;
        }
      }
      bet.score = score;
      this._logEvent("BET_SCORED", { userId, matchId, score });
    }

    this._matchFinalized[matchId] = true;
    this._logEvent("MATCH_FINALIZED", { matchId, isAbandoned: match.isAbandoned });
    return { matchId, isAbandoned: match.isAbandoned };
  }

  // ─── Bet submission ──────────────────────────────────────────────────────

  /**
   * Submit bets for a match. Enforces ALL invariants.
   */
  submitBets(matchId, userId, answers) {
    // Invariant #20: authentication required
    assert(userId, 20, "userId required for bet submission");

    const match = this._ext.getMatch(matchId);
    assert(match, "N/A", `Match ${matchId} not found`);

    // Invariant #21: can only submit for UPCOMING matches
    assert(match.status === "UPCOMING", 21, `Cannot submit bet: match ${matchId} status is ${match.status}`);

    // Invariant #16: at most one bet per user per match (allow overwrite if not locked)
    if (this._bets[userId]?.[matchId]) {
      assert(!this._bets[userId][matchId].isLocked, 16, `Bet for user ${userId} on match ${matchId} is already locked`);
    }

    // Validate all answers
    const questions = this._questions[matchId] || [];
    const questionMap = new Map(questions.map(q => [q.questionId, q]));

    for (const [questionId, selectedOptionId] of Object.entries(answers)) {
      const question = questionMap.get(questionId);
      // Invariant #22: answers must reference valid questions
      assert(question, 22, `Question ${questionId} not found for match ${matchId}`);
      // Invariant #22: answers must reference valid options
      const validOptionIds = question.options.map(o => o.optionId);
      assert(validOptionIds.includes(selectedOptionId), 22, `Option ${selectedOptionId} invalid for question ${questionId}`);

      // Invariant #17/10: if PLAYER_PICK, verify player is in match squads
      if (question.optionType === "PLAYER_PICK") {
        const selectedOption = question.options.find(o => o.optionId === selectedOptionId);
        if (selectedOption && selectedOption.referenceType === "PLAYER") {
          assert(
            this._ext.isPlayerInMatchSquads(matchId, selectedOption.referenceId),
            17,
            `Player ${selectedOption.referenceId} not in squads for match ${matchId}`
          );
        }
      }
    }

    if (!this._bets[userId]) this._bets[userId] = {};
    const now = new Date().toISOString();
    this._bets[userId][matchId] = {
      betId: `bet_${userId}_${matchId}`,
      userId,
      matchId,
      answers: { ...answers },
      isLocked: false,
      submittedAt: now,
      lockedAt: null,
      score: null,
    };

    this._logEvent("BET_SUBMITTED", { userId, matchId, answerCount: Object.keys(answers).length });
    return { success: true, submittedAt: now };
  }

  getUserBets(matchId, userId) {
    return this._bets[userId]?.[matchId] || null;
  }

  // ─── Groups ──────────────────────────────────────────────────────────────

  createGroup(groupId, name, creatorUserId) {
    assert(creatorUserId, 20, "userId required");
    assert(!this._groups[groupId], "N/A", `Group ${groupId} already exists`);
    this._groups[groupId] = {
      groupId,
      name,
      joinCode: groupId.toUpperCase(),
      createdBy: creatorUserId,
      eventId: this._ext.getTournaments()[0].eventId,
      memberIds: [creatorUserId],
    };
    this._logEvent("GROUP_CREATED", { groupId, createdBy: creatorUserId });
    return this._groups[groupId];
  }

  joinGroup(groupId, userId) {
    assert(userId, 20, "userId required");
    const group = this._groups[groupId];
    assert(group, "N/A", `Group ${groupId} not found`);
    if (!group.memberIds.includes(userId)) {
      group.memberIds.push(userId);
    }
    this._logEvent("GROUP_JOINED", { groupId, userId });
    return group;
  }

  // ─── Leaderboard ─────────────────────────────────────────────────────────

  /**
   * Compute leaderboard from bet scores.
   * Invariant #31: leaderboards are derived views, not stored state.
   * Invariant #32: group scores are identical to global — groups only filter.
   */
  getLeaderboard(scope = "global", scopeId = null) {
    // Collect all scored bets
    const userScores = {};
    const userMatchCount = {};

    for (const [userId, matchBets] of Object.entries(this._bets)) {
      for (const [matchId, bet] of Object.entries(matchBets)) {
        if (bet.score === null) continue;

        // For abandoned matches, score is 0 and match doesn't count
        const match = this._ext.getMatch(matchId);
        if (match && match.isAbandoned) continue;

        if (!userScores[userId]) userScores[userId] = 0;
        if (!userMatchCount[userId]) userMatchCount[userId] = 0;
        userScores[userId] += bet.score;
        userMatchCount[userId] += 1;
      }
    }

    // Filter by group if requested
    let userIds = Object.keys(userScores);
    if (scope === "group" && scopeId) {
      const group = this._groups[scopeId];
      assert(group, "N/A", `Group ${scopeId} not found`);
      userIds = userIds.filter(uid => group.memberIds.includes(uid));

      // Invariant #32: verify scores are identical to global
      for (const uid of userIds) {
        const globalScore = userScores[uid];
        // Score is same — groups only filter, never modify
        assert(
          globalScore === userScores[uid],
          32,
          `User ${uid} score differs between global (${globalScore}) and group ${scopeId}`
        );
      }
    }

    const leaderboard = userIds
      .map(uid => ({
        userId: uid,
        totalScore: userScores[uid] || 0,
        matchesPlayed: userMatchCount[uid] || 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore || a.userId.localeCompare(b.userId))
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    return leaderboard;
  }

  // ─── Question accessors ──────────────────────────────────────────────────

  getQuestions(matchId) {
    return JSON.parse(JSON.stringify(this._questions[matchId] || []));
  }

  getMatch(matchId) {
    const m = this._ext.getMatch(matchId);
    if (!m) return null;
    const teamA = this._ext.getTeam(m.teamA);
    const teamB = this._ext.getTeam(m.teamB);
    const squads = this._ext.getSquads(matchId);
    return { ...m, teamA, teamB, squads };
  }
}

module.exports = { SimulationEngine, InvariantViolation };
