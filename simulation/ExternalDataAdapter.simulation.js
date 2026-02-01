/**
 * ExternalDataAdapter.simulation.js
 *
 * Deterministic simulation of the external data source.
 * Uses a seeded PRNG for reproducible outputs.
 * Provides mutable timeline: matches advance through UPCOMING → LIVE → COMPLETED | ABANDONED.
 *
 * This module is the SOLE owner of: tournaments, teams, players, matches, squads, stats.
 * Nothing outside this module may create or modify these entities.
 */

"use strict";

// ─── Seeded PRNG (xorshift32) ────────────────────────────────────────────────

function createRng(seed) {
  let state = seed | 0 || 1;
  return function next() {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

// ─── Timeline constants (milliseconds) ──────────────────────────────────────

const HOUR = 3600000;
const MINUTE = 60000;

// ─── Data ───────────────────────────────────────────────────────────────────

const TOURNAMENT = {
  eventId: "sim_event_1",
  name: "Simulation Cup 2025",
  sport: "cricket",
  format: "t20",
  season: "2025",
  status: "ACTIVE",
  startDate: "2025-04-01T00:00:00Z",
  endDate: "2025-05-01T00:00:00Z",
  rulesetVersion: "constitution-v1.0",
};

const TEAMS = [
  { teamId: "team_alpha", name: "Alpha Lions",  shortName: "ALP", sport: "cricket", logoUrl: null, color: "#e63946" },
  { teamId: "team_beta",  name: "Beta Hawks",   shortName: "BET", sport: "cricket", logoUrl: null, color: "#457b9d" },
];

const PLAYERS = [
  // Alpha Lions (4 players for simulation)
  { playerId: "sp1", name: "Sim Player A1", role: "BAT",  nationality: "Country1", teamId: "team_alpha" },
  { playerId: "sp2", name: "Sim Player A2", role: "BOWL", nationality: "Country1", teamId: "team_alpha" },
  { playerId: "sp3", name: "Sim Player A3", role: "AR",   nationality: "Country2", teamId: "team_alpha" },
  { playerId: "sp4", name: "Sim Player A4", role: "WK",   nationality: "Country1", teamId: "team_alpha" },
  // Beta Hawks (4 players for simulation)
  { playerId: "sp5", name: "Sim Player B1", role: "BAT",  nationality: "Country3", teamId: "team_beta" },
  { playerId: "sp6", name: "Sim Player B2", role: "BOWL", nationality: "Country3", teamId: "team_beta" },
  { playerId: "sp7", name: "Sim Player B3", role: "AR",   nationality: "Country4", teamId: "team_beta" },
  { playerId: "sp8", name: "Sim Player B4", role: "WK",   nationality: "Country3", teamId: "team_beta" },
];

// ─── Simulation state (mutable, controlled only by this module) ──────────────

class SimulationAdapter {
  constructor(seed = 42) {
    this._rng = createRng(seed);
    this._seed = seed;

    // Deep clone base data
    this._tournament = JSON.parse(JSON.stringify(TOURNAMENT));
    this._teams = JSON.parse(JSON.stringify(TEAMS));
    this._players = JSON.parse(JSON.stringify(PLAYERS));
    this._matches = {};
    this._squads = {};
    this._stats = {};
    this._timeline = {};  // matchId → { bettingOpenAt, bettingLockedAt, checkpoints[], matchCompletedAt }
    this._log = [];
  }

  // ─── Logging ─────────────────────────────────────────────────────────────

  _logEvent(type, detail) {
    const entry = { type, ...detail, _ts: Date.now() };
    this._log.push(entry);
    return entry;
  }

  getLog() {
    return [...this._log];
  }

  // ─── Match creation (simulates external schedule ingestion) ───────────────

  createSimMatch(matchId, teamAId, teamBId, scheduledTimeISO) {
    if (this._matches[matchId]) throw new Error(`Match ${matchId} already exists`);
    const teamA = this._teams.find(t => t.teamId === teamAId);
    const teamB = this._teams.find(t => t.teamId === teamBId);
    if (!teamA) throw new Error(`Team ${teamAId} not found`);
    if (!teamB) throw new Error(`Team ${teamBId} not found`);
    if (teamAId === teamBId) throw new Error("A match must have two distinct teams");

    const scheduledTime = new Date(scheduledTimeISO).toISOString();

    this._matches[matchId] = {
      matchId,
      eventId: this._tournament.eventId,
      teamA: teamAId,
      teamB: teamBId,
      scheduledTime,
      venue: "Simulation Ground",
      status: "UPCOMING",
      isAbandoned: false,
      includesSuperOver: false,
      bettingLockedAt: null,
      result: null,
    };

    // Build timeline: deterministic from seed and scheduledTime
    const base = new Date(scheduledTimeISO).getTime();
    const bettingOpenAt = base - 2 * HOUR;
    const bettingLockedAt = base; // first ball = scheduled time

    // 8 checkpoints evenly spaced across ~3.5 hours of match
    const matchDuration = 3.5 * HOUR;
    const checkpoints = [];
    for (let i = 1; i <= 8; i++) {
      checkpoints.push(new Date(base + (matchDuration * i / 9)).toISOString());
    }
    const matchCompletedAt = new Date(base + matchDuration).toISOString();

    this._timeline[matchId] = {
      bettingOpenAt: new Date(bettingOpenAt).toISOString(),
      bettingLockedAt: new Date(bettingLockedAt).toISOString(),
      checkpoints,
      matchCompletedAt,
    };

    // Create squads (all players from both teams)
    const teamAPlayers = this._players.filter(p => p.teamId === teamAId).map(p => p.playerId);
    const teamBPlayers = this._players.filter(p => p.teamId === teamBId).map(p => p.playerId);

    this._squads[matchId] = [
      {
        matchId, teamId: teamAId,
        playerIds: [...teamAPlayers], playingXI: [...teamAPlayers],
        isFinal: false, lastUpdatedAt: new Date(bettingOpenAt).toISOString(),
      },
      {
        matchId, teamId: teamBId,
        playerIds: [...teamBPlayers], playingXI: [...teamBPlayers],
        isFinal: false, lastUpdatedAt: new Date(bettingOpenAt).toISOString(),
      },
    ];

    this._logEvent("MATCH_CREATED", { matchId, teamA: teamAId, teamB: teamBId, scheduledTime });
    return this._matches[matchId];
  }

  // ─── Match lifecycle (simulates external status transitions) ──────────────

  /**
   * Advance match to a given timestamp. Transitions status based on timeline.
   * Returns the match status transitions that occurred.
   */
  advanceMatch(matchId, toTimestampISO) {
    const match = this._matches[matchId];
    if (!match) throw new Error(`Match ${matchId} not found`);
    if (match.isAbandoned) return []; // no further transitions
    if (match.status === "COMPLETED") return []; // terminal

    const timeline = this._timeline[matchId];
    const toTs = new Date(toTimestampISO).getTime();
    const transitions = [];

    // UPCOMING → LIVE (at bettingLockedAt / first ball)
    if (match.status === "UPCOMING" && toTs >= new Date(timeline.bettingLockedAt).getTime()) {
      match.status = "LIVE";
      match.bettingLockedAt = timeline.bettingLockedAt;

      // Finalize squads at toss (invariant #4)
      for (const squad of this._squads[matchId]) {
        squad.isFinal = true;
        squad.lastUpdatedAt = timeline.bettingLockedAt;
      }

      transitions.push(this._logEvent("MATCH_STATUS_CHANGE", {
        matchId, from: "UPCOMING", to: "LIVE", at: timeline.bettingLockedAt,
      }));
    }

    // LIVE → COMPLETED (at matchCompletedAt)
    if (match.status === "LIVE" && toTs >= new Date(timeline.matchCompletedAt).getTime()) {
      match.status = "COMPLETED";
      match.result = this._generateResult(matchId);

      // Generate deterministic stats
      this._generateStats(matchId);

      transitions.push(this._logEvent("MATCH_STATUS_CHANGE", {
        matchId, from: "LIVE", to: "COMPLETED", at: timeline.matchCompletedAt,
      }));
    }

    return transitions;
  }

  /**
   * Mark a match as abandoned. Can happen at any point before COMPLETED.
   * Invariant: abandoned matches → all bets voided (score = 0).
   */
  abandonMatch(matchId, atTimestampISO) {
    const match = this._matches[matchId];
    if (!match) throw new Error(`Match ${matchId} not found`);
    if (match.status === "COMPLETED") throw new Error("Cannot abandon a completed match");
    if (match.isAbandoned) throw new Error("Match already abandoned");

    const prevStatus = match.status;
    match.status = "ABANDONED";
    match.isAbandoned = true;
    match.result = null;

    // Clear any stats
    delete this._stats[matchId];

    this._logEvent("MATCH_ABANDONED", { matchId, from: prevStatus, at: atTimestampISO });
    return match;
  }

  // ─── Deterministic stat generation ────────────────────────────────────────

  _generateResult(matchId) {
    const match = this._matches[matchId];
    const teamA = this._teams.find(t => t.teamId === match.teamA);
    const teamB = this._teams.find(t => t.teamId === match.teamB);
    const winner = this._rng() > 0.5 ? teamA : teamB;
    const margin = Math.floor(this._rng() * 80) + 1;
    const byWickets = this._rng() > 0.5;
    return `${winner.shortName} won by ${margin} ${byWickets ? "wickets" : "runs"}`;
  }

  _generateStats(matchId) {
    const squads = this._squads[matchId] || [];
    const stats = {};
    for (const squad of squads) {
      for (const pid of squad.playerIds) {
        const player = this._players.find(p => p.playerId === pid);
        const isBowler = player.role === "BOWL" || player.role === "AR";
        const isBatter = player.role === "BAT" || player.role === "AR" || player.role === "WK";

        stats[pid] = {
          runs: isBatter ? Math.floor(this._rng() * 100) : Math.floor(this._rng() * 15),
          ballsFaced: isBatter ? Math.floor(this._rng() * 60) + 5 : Math.floor(this._rng() * 10),
          fours: isBatter ? Math.floor(this._rng() * 10) : 0,
          sixes: isBatter ? Math.floor(this._rng() * 5) : 0,
          wickets: isBowler ? Math.floor(this._rng() * 5) : 0,
          oversBowled: isBowler ? Math.floor(this._rng() * 4) + 1 : 0,
          runsConceded: isBowler ? Math.floor(this._rng() * 50) : 0,
          catches: Math.floor(this._rng() * 3),
          runOuts: Math.floor(this._rng() * 2) > 0 ? 1 : 0,
          stumpings: player.role === "WK" ? (Math.floor(this._rng() * 2) > 0 ? 1 : 0) : 0,
          isManOfTheMatch: false,
          hasTakenHatTrick: false,
        };
      }
    }

    // Assign MoM to highest scorer deterministically
    let bestPid = null;
    let bestRuns = -1;
    for (const [pid, s] of Object.entries(stats)) {
      if (s.runs > bestRuns) { bestRuns = s.runs; bestPid = pid; }
    }
    if (bestPid) stats[bestPid].isManOfTheMatch = true;

    this._stats[matchId] = {
      data: stats,
      ingestedAt: this._timeline[matchId].matchCompletedAt,
      isFinal: false,
    };

    this._logEvent("STATS_INGESTED", { matchId, playerCount: Object.keys(stats).length });
  }

  /**
   * Finalize stats (simulates post-match 2-hour window expiry).
   */
  finalizeStats(matchId) {
    if (!this._stats[matchId]) throw new Error(`No stats for match ${matchId}`);
    if (this._stats[matchId].isFinal) throw new Error(`Stats for ${matchId} already finalized`);
    this._stats[matchId].isFinal = true;
    this._logEvent("STATS_FINALIZED", { matchId });
  }

  // ─── Read-only public API (mirrors ExternalDataAdapter.js) ────────────────

  getTournaments() {
    return [JSON.parse(JSON.stringify(this._tournament))];
  }

  getTournament(eventId) {
    if (this._tournament.eventId === eventId) return JSON.parse(JSON.stringify(this._tournament));
    return null;
  }

  getTeams(sport) {
    const list = sport ? this._teams.filter(t => t.sport === sport) : this._teams;
    return JSON.parse(JSON.stringify(list));
  }

  getTeam(teamId) {
    const t = this._teams.find(x => x.teamId === teamId);
    return t ? JSON.parse(JSON.stringify(t)) : null;
  }

  getPlayers(filters = {}) {
    let list = [...this._players];
    if (filters.teamId) list = list.filter(p => p.teamId === filters.teamId);
    if (filters.role) list = list.filter(p => p.role === filters.role);
    return JSON.parse(JSON.stringify(list));
  }

  getPlayer(playerId) {
    const p = this._players.find(x => x.playerId === playerId);
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  getMatches(filters = {}) {
    let list = Object.values(this._matches);
    if (filters.status) list = list.filter(m => m.status === filters.status);
    if (filters.eventId) list = list.filter(m => m.eventId === filters.eventId);
    return JSON.parse(JSON.stringify(list));
  }

  getMatch(matchId) {
    const m = this._matches[matchId];
    return m ? JSON.parse(JSON.stringify(m)) : null;
  }

  getSquads(matchId) {
    return JSON.parse(JSON.stringify(this._squads[matchId] || []));
  }

  getMatchPlayerIds(matchId) {
    const squads = this._squads[matchId] || [];
    const ids = new Set();
    for (const s of squads) {
      for (const pid of s.playerIds) ids.add(pid);
    }
    return [...ids];
  }

  getPlayerMatchStats(matchId) {
    const entry = this._stats[matchId];
    if (!entry) return null;
    return {
      stats: JSON.parse(JSON.stringify(entry.data)),
      isFinalized: entry.isFinal,
    };
  }

  isPlayerInMatchSquads(matchId, playerId) {
    const squads = this._squads[matchId] || [];
    return squads.some(s => s.playerIds.includes(playerId));
  }

  getTimeline(matchId) {
    return this._timeline[matchId] ? JSON.parse(JSON.stringify(this._timeline[matchId])) : null;
  }
}

module.exports = { SimulationAdapter };
