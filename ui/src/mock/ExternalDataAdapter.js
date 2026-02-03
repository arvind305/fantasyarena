/**
 * ExternalDataAdapter.js — Abstraction over externally-owned data.
 *
 * In shadow/simulation mode, data comes from static JSON files in /public/data/.
 * The adapter owns: Tournaments, Teams, Players, Matches, Squads, PlayerMatchStats.
 * Nothing in the UI or engine may create, modify, or delete these entities.
 *
 * IMPORTANT: This adapter must be initialized before use.
 * Call `await initializeAdapter()` at app startup.
 */

import {
  loadStaticData,
  TEAM_CODE_TO_ID,
  TEAM_ID_TO_CODE,
  TEAM_NAMES,
  TEAM_COLORS,
} from "./staticDataLoader";

// ─── Internal state (populated by initializeAdapter) ──────────────────────────

let _initialized = false;
let _tournament = null;
let _matches = [];
let _players = [];
let _squads = {};
let _teams = [];

// ─── Initialization ───────────────────────────────────────────────────────────

/**
 * Initialize the adapter by loading static JSON data.
 * Must be called before any other adapter function.
 * Safe to call multiple times (no-op after first call).
 */
export async function initializeAdapter() {
  if (_initialized) return;

  const data = await loadStaticData();

  _tournament = data.tournament;
  _matches = data.matches;
  _players = data.players;
  _squads = data.squads;

  // Build teams from unique team codes in matches + squads
  const teamIds = new Set();

  // Add teams from squads (these are the full teamIds like 'india')
  Object.keys(data.squads).forEach((tid) => teamIds.add(tid));

  // Build team objects
  _teams = Array.from(teamIds).map((teamId) => ({
    teamId,
    name: TEAM_NAMES[teamId] || teamId,
    shortName: TEAM_ID_TO_CODE[teamId] || teamId.toUpperCase(),
    sport: "cricket",
    logoUrl: null,
    color: TEAM_COLORS[teamId] || "#888888",
  }));

  _initialized = true;
}

/**
 * Ensure the adapter is initialized. Call this before any read operation.
 */
function ensureInitialized() {
  if (!_initialized) {
    throw new Error(
      "ExternalDataAdapter not initialized. Call initializeAdapter() first."
    );
  }
}

// ─── Helper to resolve team codes ─────────────────────────────────────────────

/**
 * Resolve a team code (PAK) or teamId (pakistan) to a teamId.
 */
function resolveTeamId(codeOrId) {
  if (!codeOrId) return null;
  // If it's already a full teamId
  if (TEAM_NAMES[codeOrId]) return codeOrId;
  // If it's a short code
  return TEAM_CODE_TO_ID[codeOrId] || codeOrId.toLowerCase();
}

// ─── Public API (read-only) ──────────────────────────────────────────────────

/**
 * Returns all tournaments.
 */
export function getTournaments() {
  ensureInitialized();
  return [structuredClone(_tournament)];
}

/**
 * Returns a single tournament by eventId, or null.
 */
export function getTournament(eventId) {
  ensureInitialized();
  if (_tournament.eventId === eventId) {
    return structuredClone(_tournament);
  }
  return null;
}

/**
 * Returns all teams, optionally filtered by sport.
 */
export function getTeams(sport) {
  ensureInitialized();
  const list = sport ? _teams.filter((t) => t.sport === sport) : _teams;
  return structuredClone(list);
}

/**
 * Returns a single team by teamId (or short code), or null.
 */
export function getTeam(teamIdOrCode) {
  ensureInitialized();
  const teamId = resolveTeamId(teamIdOrCode);
  const t = _teams.find((x) => x.teamId === teamId);
  return t ? structuredClone(t) : null;
}

/**
 * Returns all players, optionally filtered.
 */
export function getPlayers(filters = {}) {
  ensureInitialized();
  let list = [..._players];
  if (filters.teamId) {
    const tid = resolveTeamId(filters.teamId);
    list = list.filter((p) => p.teamId === tid);
  }
  if (filters.role) {
    list = list.filter((p) => p.role === filters.role);
  }
  return structuredClone(list);
}

/**
 * Returns a single player by playerId, or null.
 */
export function getPlayer(playerId) {
  ensureInitialized();
  const p = _players.find((x) => x.playerId === playerId);
  return p ? structuredClone(p) : null;
}

/**
 * Returns all matches, optionally filtered.
 */
export function getMatches(filters = {}) {
  ensureInitialized();
  let list = [..._matches];
  if (filters.status) {
    list = list.filter((m) => m.status === filters.status);
  }
  if (filters.eventId) {
    list = list.filter((m) => m.eventId === filters.eventId);
  }
  return structuredClone(list);
}

/**
 * Returns a single match by matchId, or null.
 */
export function getMatch(matchId) {
  ensureInitialized();
  const m = _matches.find((x) => x.matchId === matchId);
  return m ? structuredClone(m) : null;
}

/**
 * Returns squads for a given match. Always returns an array (possibly empty).
 * For T20WC, we use the team squads since per-match squads aren't available yet.
 */
export function getSquads(matchId) {
  ensureInitialized();
  const match = _matches.find((m) => m.matchId === matchId);
  if (!match) return [];

  const teamAId = resolveTeamId(match.teamA);
  const teamBId = resolveTeamId(match.teamB);

  const result = [];
  const now = new Date().toISOString();

  if (teamAId && _squads[teamAId]) {
    result.push({
      matchId,
      teamId: teamAId,
      playerIds: _squads[teamAId],
      playingXI: _squads[teamAId].slice(0, 11),
      isFinal: match.status !== "UPCOMING",
      lastUpdatedAt: now,
    });
  }

  if (teamBId && _squads[teamBId]) {
    result.push({
      matchId,
      teamId: teamBId,
      playerIds: _squads[teamBId],
      playingXI: _squads[teamBId].slice(0, 11),
      isFinal: match.status !== "UPCOMING",
      lastUpdatedAt: now,
    });
  }

  return structuredClone(result);
}

/**
 * Returns the union of all playerIds across both squads for a match.
 */
export function getMatchPlayerIds(matchId) {
  ensureInitialized();
  const squads = getSquads(matchId);
  const ids = new Set();
  for (const s of squads) {
    for (const pid of s.playerIds) ids.add(pid);
  }
  return [...ids];
}

/**
 * Returns player match stats for a completed match. Null if not available.
 * Note: Stats are not available in static data, returns null.
 */
export function getPlayerMatchStats(matchId) {
  ensureInitialized();
  // Static data doesn't include match stats
  return null;
}

/**
 * Checks whether a player is in one of the match's squads.
 */
export function isPlayerInMatchSquads(matchId, playerId) {
  ensureInitialized();
  const squads = getSquads(matchId);
  return squads.some((s) => s.playerIds.includes(playerId));
}

// Export the team mappings for use elsewhere
export { TEAM_CODE_TO_ID, TEAM_ID_TO_CODE, TEAM_NAMES, TEAM_COLORS };
