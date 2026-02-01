/**
 * api.js — Centralised API layer with mode-based routing.
 *
 * Modes (see config.js for full documentation):
 *   simulation — in-browser mock engine, full read/write
 *   shadow     — in-browser mock engine for reads, writes BLOCKED
 *   live       — real backend API for all operations
 *
 * The shadow guard is enforced here at the API boundary so that
 * no UI component needs to know about modes. Components call
 * apiSubmitBets() and get either a result or a clear error.
 */

import * as engine from "./mock/engine";
import { USE_LOCAL_ENGINE, IS_SHADOW_MODE, API_BASE_URL } from "./config";

// ── Transport helpers ──────────────────────────────────────────────────────

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function realPost(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function realGet(path) {
  const res = await fetch(apiUrl(path));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function mock(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(fn()); } catch (err) { reject(err); }
    }, 150 + Math.random() * 200);
  });
}

// ── Shadow guard ───────────────────────────────────────────────────────────

/**
 * Rejects mutation calls in shadow mode with a clear, user-facing message.
 * This is the single safeguard: if IS_SHADOW_MODE is true, no bet or
 * long-term prediction submission will succeed, regardless of engine state.
 */
function shadowGuard(operationName) {
  if (IS_SHADOW_MODE) {
    return Promise.reject(
      new Error(`[SHADOW MODE] ${operationName} is disabled. The platform is running in observation mode — no predictions are accepted.`)
    );
  }
  return null; // not blocked
}

// ── Events / Matches ───────────────────────────────────────────────────────

export function apiGetEvents() {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getEvents());
  return realGet("/events");
}

export function apiGetMatches(filters) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getMatches(filters));
  return realGet("/matches");
}

/**
 * Returns a match with teamA, teamB (full objects) and squads array.
 * Contract: teamA and teamB are never null. squads is always an array.
 */
export function apiGetMatch(matchId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getMatch(matchId));
  return realGet(`/match/${matchId}`);
}

// ── Betting ────────────────────────────────────────────────────────────────

export function apiGetBettingQuestions(matchId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getBettingQuestions(matchId));
  return realGet(`/match/${matchId}/questions`);
}

export function apiSubmitBets(matchId, userId, answers) {
  const blocked = shadowGuard("Bet submission");
  if (blocked) return blocked;

  if (USE_LOCAL_ENGINE) return mock(() => engine.submitBets(matchId, userId, answers));
  return realPost(`/match/${matchId}/bets`, { userId, answers });
}

export function apiGetUserBets(matchId, userId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getUserBets(matchId, userId));
  return realGet(`/match/${matchId}/bets/${userId}`);
}

// ── Long-term Bets ─────────────────────────────────────────────────────────

export function apiGetLongTermBets(eventId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getLongTermBets(eventId));
  return realGet(`/events/${eventId}/long-term-bets`);
}

export function apiSubmitLongTermBets(userId, answers) {
  const blocked = shadowGuard("Long-term prediction submission");
  if (blocked) return blocked;

  if (USE_LOCAL_ENGINE) return mock(() => engine.submitLongTermBets(userId, answers));
  return realPost("/long-term-bets", { userId, answers });
}

export function apiGetUserLongTermBets(userId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getUserLongTermBets(userId));
  return realGet(`/long-term-bets/${userId}`);
}

// ── Teams ──────────────────────────────────────────────────────────────────

export function apiGetTeams() {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getTeams());
  return realGet("/teams");
}

export function apiGetTeamDetail(teamId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getTeamDetail(teamId));
  return realGet(`/teams/${teamId}`);
}

// ── Players ────────────────────────────────────────────────────────────────

export function apiGetPlayers(filters) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getPlayers(filters));
  return realGet("/players");
}

export function apiGetPlayerProfile(playerId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getPlayerProfile(playerId));
  return realGet(`/players/${playerId}`);
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export function apiGetLeaderboard(scope, scopeId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getLeaderboard(scope, scopeId));
  return realGet(`/leaderboard?scope=${scope}&scopeId=${scopeId || ""}`);
}

// ── Groups ─────────────────────────────────────────────────────────────────

export function apiGetGroups(userId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getGroups(userId));
  return realGet(`/groups?userId=${userId || ""}`);
}

export function apiCreateGroup(name, userId, displayName) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.createGroup(name, userId, displayName));
  return realPost("/groups", { name, userId, displayName });
}

export function apiJoinGroup(joinCode, userId, displayName) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.joinGroup(joinCode, userId, displayName));
  return realPost("/groups/join", { joinCode, userId, displayName });
}

export function apiGetGroupDetail(groupId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getGroupDetail(groupId));
  return realGet(`/groups/${groupId}`);
}

// ── Profile ────────────────────────────────────────────────────────────────

export function apiGetProfile(userId) {
  if (USE_LOCAL_ENGINE) return mock(() => engine.getProfile(userId));
  return realGet(`/profile/${userId}`);
}
