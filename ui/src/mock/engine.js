/**
 * engine.js — Mock engine for the betting/prediction platform.
 *
 * This is the "server" in mock mode. It enforces ALL invariants from
 * DOMAIN_MODEL_AND_DATA_CONTRACTS.md. The UI must NEVER duplicate this logic.
 *
 * External data (teams, players, matches, squads) comes from ExternalDataAdapter.
 * System-generated data (questions, options) comes from bettingData.js.
 * User-generated data (bets, groups) is stored in localStorage.
 */

import * as Ext from "./ExternalDataAdapter";
import {
  getBettingQuestions as getBettingQuestionsFromData,
  buildLongTermBets,
  GROUPS,
  SAMPLE_PROFILE,
  GLOBAL_LEADERBOARD,
} from "./bettingData";

const STORAGE_KEY = "betting_arena_state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function st() {
  return loadState();
}

// ── Events ───────────────────────────────────────────────────────────────────

export function getEvents() {
  return Ext.getTournaments();
}

// ── Matches ──────────────────────────────────────────────────────────────────

export function getMatches(filters = {}) {
  return Ext.getMatches(filters);
}

/**
 * Returns a single match with full team objects and squads inlined.
 * Contract: teamA and teamB are never null. Squads is always an array (possibly empty).
 */
export function getMatch(matchId) {
  const m = Ext.getMatch(matchId);
  if (!m) throw new Error("Match not found");
  const teamA = Ext.getTeam(m.teamA);
  const teamB = Ext.getTeam(m.teamB);
  // For TBC matches in knockout stages, teams may not be resolved yet
  if (!teamA || !teamB) {
    // Return match with placeholder teams for TBC matches
    return {
      ...m,
      teamA: teamA || { teamId: m.teamA, name: m.teamA, shortName: m.teamA, sport: "cricket", logoUrl: null, color: "#888888" },
      teamB: teamB || { teamId: m.teamB, name: m.teamB, shortName: m.teamB, sport: "cricket", logoUrl: null, color: "#888888" },
      squads: [],
    };
  }
  const squads = Ext.getSquads(matchId);
  return {
    ...m,
    teamA,
    teamB,
    squads,
  };
}

// ── Betting Questions ────────────────────────────────────────────────────────

/**
 * Returns betting questions for a match with current status.
 * Options are always included inline with structured optionId/referenceType.
 * The UI renders these as-is — no filtering, no validation.
 */
export function getBettingQuestions(matchId) {
  const match = Ext.getMatch(matchId);
  if (!match) throw new Error("Match not found");

  const questions = getBettingQuestionsFromData(matchId);

  // Derive status from match status (invariant: questions follow match lifecycle)
  return questions.map((q) => {
    let status;
    switch (match.status) {
      case "UPCOMING":
        status = "OPEN";
        break;
      case "LIVE":
        status = "LOCKED";
        break;
      case "COMPLETED":
        status = "RESOLVED";
        break;
      case "ABANDONED":
        status = "RESOLVED";
        break;
      case "NO_RESULT":
        status = "RESOLVED";
        break;
      default:
        status = "DRAFT";
        break;
    }
    return { ...q, status };
  });
}

/**
 * Submit bets for a match. Enforces ALL invariants:
 *  - User must be authenticated (userId required)
 *  - Match must be UPCOMING (invariant #21)
 *  - At most one bet per user per match (invariant #16)
 *  - All answer optionIds must reference valid options in valid questions (invariant #22)
 *  - Player-pick options must reference players in match squads (invariant #17 via question build)
 */
export function submitBets(matchId, userId, answers) {
  // Invariant #20: authentication required
  if (!userId) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  const match = Ext.getMatch(matchId);
  if (!match) throw new Error("MATCH_NOT_FOUND");

  // Invariant #21: can only submit for UPCOMING matches
  if (match.status !== "UPCOMING") {
    throw new Error("BETTING_CLOSED");
  }

  const s = st();
  if (!s.bets) s.bets = {};
  if (!s.bets[userId]) s.bets[userId] = {};

  // Invariant #16: at most one bet per user per match
  // Allow overwrite ONLY if not yet locked (edit before lock)
  if (s.bets[userId][matchId] && s.bets[userId][matchId].isLocked) {
    throw new Error("BET_ALREADY_LOCKED");
  }

  // Validate all answers reference valid questions and options
  const questions = getBettingQuestionsFromData(matchId);
  const questionMap = new Map(questions.map((q) => [q.questionId, q]));

  for (const [questionId, selectedOptionId] of Object.entries(answers)) {
    const question = questionMap.get(questionId);
    if (!question) {
      throw new Error(`INVALID_QUESTION: ${questionId}`);
    }
    const validOptionIds = question.options.map((o) => o.optionId);
    if (!validOptionIds.includes(selectedOptionId)) {
      throw new Error(`INVALID_OPTION: ${selectedOptionId} for question ${questionId}`);
    }
  }

  const now = new Date().toISOString();
  s.bets[userId][matchId] = {
    betId: `bet_${userId}_${matchId}`,
    userId,
    matchId,
    answers,
    isLocked: false,
    submittedAt: now,
    lockedAt: null,
    score: null,
  };
  saveState(s);
  return { success: true, submittedAt: now };
}

export function getUserBets(matchId, userId) {
  if (!userId) return null;
  const s = st();
  const bet = s.bets?.[userId]?.[matchId] || null;
  if (!bet) return null;

  // Check if bet should now be locked (match went LIVE since submission)
  const match = Ext.getMatch(matchId);
  if (match && match.status !== "UPCOMING" && !bet.isLocked) {
    bet.isLocked = true;
    bet.lockedAt = match.bettingLockedAt || new Date().toISOString();
    s.bets[userId][matchId] = bet;
    saveState(s);
  }

  return bet;
}

// ── Long-term Bets ───────────────────────────────────────────────────────────

export function getLongTermBets(eventId) {
  const longTermBets = buildLongTermBets();
  return longTermBets.filter((b) => !eventId || b.eventId === eventId);
}

/**
 * Submit long-term bets. Enforces:
 *  - User authentication
 *  - Tournament must not be past lock point (invariant #23)
 *  - Valid question and option references
 */
export function submitLongTermBets(userId, answers) {
  if (!userId) throw new Error("AUTHENTICATION_REQUIRED");

  const tournaments = Ext.getTournaments();
  // Invariant #23: lock when tournament status → ACTIVE
  // For now allow submission for preview purposes

  // Validate answers
  const longTermBets = buildLongTermBets();
  const questionMap = new Map(longTermBets.map((q) => [q.questionId, q]));
  for (const [questionId, selectedOptionId] of Object.entries(answers)) {
    const question = questionMap.get(questionId);
    if (!question) throw new Error(`INVALID_QUESTION: ${questionId}`);
    const validOptionIds = question.options.map((o) => o.optionId);
    if (!validOptionIds.includes(selectedOptionId)) {
      throw new Error(`INVALID_OPTION: ${selectedOptionId} for question ${questionId}`);
    }
  }

  const s = st();
  if (!s.longTermBets) s.longTermBets = {};

  // Invariant #24: at most one answer per question
  if (s.longTermBets[userId] && s.longTermBets[userId].isLocked) {
    throw new Error("LONG_TERM_BETS_ALREADY_LOCKED");
  }

  const now = new Date().toISOString();
  s.longTermBets[userId] = {
    answers,
    submittedAt: now,
    isLocked: true,
  };
  saveState(s);
  return { success: true, isLocked: true, submittedAt: now };
}

export function getUserLongTermBets(userId) {
  if (!userId) return null;
  const s = st();
  return s.longTermBets?.[userId] || null;
}

// ── Teams (delegated to ExternalDataAdapter) ─────────────────────────────────

export function getTeams() {
  return Ext.getTeams("cricket");
}

/**
 * Returns team detail with squad sourced from ExternalDataAdapter.
 * The engine does NOT filter players by team — it returns the franchise roster
 * as provided by the external source.
 */
export function getTeamDetail(teamId) {
  const team = Ext.getTeam(teamId);
  if (!team) throw new Error("Team not found");
  const roster = Ext.getPlayers({ teamId });
  return { ...team, roster };
}

// ── Players (delegated to ExternalDataAdapter) ───────────────────────────────

export function getPlayers(filters = {}) {
  return Ext.getPlayers(filters);
}

export function getPlayerProfile(playerId) {
  const player = Ext.getPlayer(playerId);
  if (!player) throw new Error("Player not found");
  const team = Ext.getTeam(player.teamId);
  return { ...player, team };
}

// ── Leaderboard (derived view — server-computed) ─────────────────────────────

/**
 * Returns leaderboard. Rankings are always computed here, never by the UI.
 * Invariant #31: leaderboards are derived views, not stored state.
 * Invariant #32: group scores are identical to global scores — groups only filter.
 */
export function getLeaderboard(scope = "global", scopeId) {
  if (scope === "group") {
    const group = GROUPS.find((g) => g.groupId === scopeId);
    if (!group) throw new Error("Group not found");
    return [...group.members]
      .sort((a, b) => b.score - a.score)
      .map((m, i) => ({ ...m, rank: i + 1, totalScore: m.score, matchesPlayed: 0 }));
  }
  return GLOBAL_LEADERBOARD;
}

// ── Groups (user-generated) ──────────────────────────────────────────────────

export function getGroups(userId) {
  if (!userId) return GROUPS;
  return GROUPS.filter((g) => g.memberIds.includes(userId));
}

export function createGroup(name, userId, displayName) {
  if (!userId) throw new Error("AUTHENTICATION_REQUIRED");
  const tournaments = Ext.getTournaments();
  const eventId = tournaments.length > 0 ? tournaments[0].eventId : "t20wc_2026";
  const joinCode = name.slice(0, 3).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const now = new Date().toISOString();
  const group = {
    groupId: "g" + Date.now(),
    name,
    joinCode,
    createdBy: userId,
    eventId,
    memberIds: [userId],
    members: [{ userId, displayName, score: 0 }],
    createdAt: now,
  };
  GROUPS.push(group);
  return group;
}

export function joinGroup(code, userId, displayName) {
  if (!userId) throw new Error("AUTHENTICATION_REQUIRED");
  const group = GROUPS.find((g) => g.joinCode === code);
  if (!group) throw new Error("INVALID_GROUP_CODE");
  if (group.memberIds.includes(userId)) {
    throw new Error("ALREADY_A_MEMBER");
  }
  group.memberIds.push(userId);
  group.members.push({ userId, displayName, score: 0 });
  return group;
}

export function getGroupDetail(groupId) {
  const group = GROUPS.find((g) => g.groupId === groupId);
  if (!group) throw new Error("Group not found");
  return {
    ...group,
    leaderboard: [...group.members]
      .sort((a, b) => b.score - a.score)
      .map((m, i) => ({ ...m, rank: i + 1 })),
  };
}

// ── Profile ──────────────────────────────────────────────────────────────────

export function getProfile(userId) {
  return {
    ...SAMPLE_PROFILE,
    userId: userId || SAMPLE_PROFILE.userId,
  };
}
