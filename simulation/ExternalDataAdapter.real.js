/**
 * ExternalDataAdapter.real.js
 *
 * Read-only adapter for ingesting real-world cricket data (e.g., ESPN/Cricbuzz-like JSON feeds).
 * Normalizes external data into existing domain contracts.
 * Runs in SHADOW MODE: no scoring, no bets, no UI changes.
 *
 * All data is deep-cloned on return to prevent external mutation.
 * This module never writes to any external system.
 */

"use strict";

// ─── Validation logger (warn, never throw) ──────────────────────────────────

class ValidationReport {
  constructor() {
    this.warnings = [];
    this.errors = [];
    this.ambiguities = [];
    this.passed = 0;
    this.failed = 0;
  }

  warn(category, message, context = {}) {
    this.warnings.push({ category, message, context, ts: new Date().toISOString() });
    this.failed++;
  }

  pass(check) {
    this.passed++;
  }

  ambiguity(field, message, context = {}) {
    this.ambiguities.push({ field, message, context, ts: new Date().toISOString() });
  }

  summary() {
    return {
      totalChecks: this.passed + this.failed,
      passed: this.passed,
      failed: this.failed,
      warnings: [...this.warnings],
      ambiguities: [...this.ambiguities],
    };
  }
}

// ─── Status mapping ─────────────────────────────────────────────────────────

const EXTERNAL_STATUS_MAP = {
  // ESPN-like statuses
  "scheduled":    "UPCOMING",
  "pre-match":    "UPCOMING",
  "upcoming":     "UPCOMING",
  "toss":         "UPCOMING",
  "in_progress":  "LIVE",
  "innings break":"LIVE",
  "live":         "LIVE",
  "stumps":       "LIVE",
  "tea":          "LIVE",
  "lunch":        "LIVE",
  "drinks":       "LIVE",
  "complete":     "COMPLETED",
  "completed":    "COMPLETED",
  "result":       "COMPLETED",
  "abandoned":    "ABANDONED",
  "cancelled":    "ABANDONED",
  "no result":    "NO_RESULT",
  "no_result":    "NO_RESULT",
};

function mapStatus(externalStatus, report) {
  if (!externalStatus) {
    report.warn("STATUS", "Missing status field, defaulting to UPCOMING");
    return "UPCOMING";
  }
  const normalized = externalStatus.toString().toLowerCase().trim();
  const mapped = EXTERNAL_STATUS_MAP[normalized];
  if (!mapped) {
    report.warn("STATUS", `Unknown external status "${externalStatus}", defaulting to UPCOMING`, { raw: externalStatus });
    report.ambiguity("matchStatus", `Unmapped status value: "${externalStatus}"`, { raw: externalStatus });
    return "UPCOMING";
  }
  report.pass("STATUS_MAPPING");
  return mapped;
}

// ─── Role mapping ───────────────────────────────────────────────────────────

const EXTERNAL_ROLE_MAP = {
  "batsman":       "BAT",
  "batter":        "BAT",
  "bat":           "BAT",
  "top order":     "BAT",
  "middle order":  "BAT",
  "opening batter":"BAT",
  "bowler":        "BOWL",
  "bowl":          "BOWL",
  "fast bowler":   "BOWL",
  "spin bowler":   "BOWL",
  "pace bowler":   "BOWL",
  "all-rounder":   "AR",
  "allrounder":    "AR",
  "all rounder":   "AR",
  "ar":            "AR",
  "batting allrounder": "AR",
  "bowling allrounder": "AR",
  "wicketkeeper":  "WK",
  "keeper":        "WK",
  "wk":            "WK",
  "wk-bat":        "WK",
  "wicketkeeper batter": "WK",
};

function mapRole(externalRole, report, playerId) {
  if (!externalRole) {
    report.warn("ROLE", `Missing role for player ${playerId}, defaulting to BAT`);
    report.ambiguity("playerRole", `No role provided for player ${playerId}`);
    return "BAT";
  }
  const normalized = externalRole.toString().toLowerCase().trim();
  const mapped = EXTERNAL_ROLE_MAP[normalized];
  if (!mapped) {
    report.warn("ROLE", `Unknown role "${externalRole}" for player ${playerId}, defaulting to BAT`, { raw: externalRole });
    report.ambiguity("playerRole", `Unmapped role: "${externalRole}" for player ${playerId}`);
    return "BAT";
  }
  report.pass("ROLE_MAPPING");
  return mapped;
}

// ─── Normalization helpers ──────────────────────────────────────────────────

function ensureString(val, fallback = "") {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (val === null || val === undefined) return [];
  return [val];
}

// ─── Real Adapter ───────────────────────────────────────────────────────────

class RealDataAdapter {
  constructor() {
    this._tournaments = {};
    this._teams = {};
    this._players = {};
    this._matches = {};
    this._squads = {};       // matchId → squad[]
    this._validationReport = new ValidationReport();
    this._log = [];
  }

  // ─── Logging ────────────────────────────────────────────────────────────

  _logEvent(type, detail) {
    const entry = { type, ...detail, _ts: Date.now() };
    this._log.push(entry);
    return entry;
  }

  getLog() {
    return [...this._log];
  }

  getValidationReport() {
    return this._validationReport.summary();
  }

  // ─── Ingestion: Tournaments ─────────────────────────────────────────────

  ingestTournaments(rawTournaments) {
    const list = ensureArray(rawTournaments);
    for (const raw of list) {
      const id = ensureString(raw.id || raw.eventId || raw.tournament_id);
      if (!id) {
        this._validationReport.warn("TOURNAMENT", "Tournament missing ID, skipped", { raw });
        continue;
      }

      this._tournaments[id] = {
        eventId: id,
        name: ensureString(raw.name || raw.series_name || raw.tournament_name, "Unknown Tournament"),
        sport: ensureString(raw.sport, "cricket"),
        format: ensureString(raw.format || raw.match_format, "unknown"),
        season: ensureString(raw.season || raw.year, new Date().getFullYear().toString()),
        status: mapStatus(raw.status || raw.tournament_status, this._validationReport),
        startDate: ensureString(raw.startDate || raw.start_date, null),
        endDate: ensureString(raw.endDate || raw.end_date, null),
        rulesetVersion: "constitution-v1.0",
      };

      this._validationReport.pass("TOURNAMENT_INGESTED");
      this._logEvent("TOURNAMENT_INGESTED", { eventId: id });
    }
  }

  // ─── Ingestion: Teams ───────────────────────────────────────────────────

  ingestTeams(rawTeams, tournamentId) {
    const list = ensureArray(rawTeams);
    for (const raw of list) {
      const id = ensureString(raw.id || raw.teamId || raw.team_id || raw.object_id);
      if (!id) {
        this._validationReport.warn("TEAM", "Team missing ID, skipped", { raw });
        continue;
      }

      // Collect player IDs if embedded in team data
      const rosterIds = ensureArray(raw.players || raw.squad || raw.roster)
        .map(p => ensureString(typeof p === "string" ? p : (p.id || p.playerId || p.player_id)))
        .filter(Boolean);

      this._teams[id] = {
        teamId: id,
        name: ensureString(raw.name || raw.team_name, "Unknown Team"),
        shortName: ensureString(raw.shortName || raw.short_name || raw.abbreviation || raw.code, id.slice(0, 3).toUpperCase()),
        sport: ensureString(raw.sport, "cricket"),
        logoUrl: ensureString(raw.logoUrl || raw.logo || raw.image_url, null),
        _rosterPlayerIds: rosterIds, // internal: for squad validation
      };

      // If players are embedded, ingest them
      const embeddedPlayers = ensureArray(raw.players || raw.squad || raw.roster)
        .filter(p => typeof p === "object" && p !== null);
      if (embeddedPlayers.length > 0) {
        this.ingestPlayers(embeddedPlayers, id);
      }

      this._validationReport.pass("TEAM_INGESTED");
      this._logEvent("TEAM_INGESTED", { teamId: id, tournamentId });
    }
  }

  // ─── Ingestion: Players ─────────────────────────────────────────────────

  ingestPlayers(rawPlayers, teamId) {
    const list = ensureArray(rawPlayers);
    for (const raw of list) {
      const id = ensureString(raw.id || raw.playerId || raw.player_id || raw.object_id);
      if (!id) {
        this._validationReport.warn("PLAYER", "Player missing ID, skipped", { raw });
        continue;
      }

      this._players[id] = {
        playerId: id,
        name: ensureString(raw.name || raw.player_name || raw.full_name || `${raw.first_name || ""} ${raw.last_name || ""}`.trim(), "Unknown Player"),
        role: mapRole(raw.role || raw.playing_role || raw.batting_style, this._validationReport, id),
        nationality: ensureString(raw.nationality || raw.country || raw.country_name, "Unknown"),
        teamId: ensureString(teamId || raw.teamId || raw.team_id, null),
      };

      this._validationReport.pass("PLAYER_INGESTED");
    }
  }

  // ─── Ingestion: Matches ─────────────────────────────────────────────────

  ingestMatches(rawMatches, tournamentId) {
    const list = ensureArray(rawMatches);
    for (const raw of list) {
      const id = ensureString(raw.id || raw.matchId || raw.match_id || raw.object_id);
      if (!id) {
        this._validationReport.warn("MATCH", "Match missing ID, skipped", { raw });
        continue;
      }

      const teamAId = ensureString(raw.teamA || raw.team_a || raw.team1 || raw.home_team_id || (raw.teams && raw.teams[0]));
      const teamBId = ensureString(raw.teamB || raw.team_b || raw.team2 || raw.away_team_id || (raw.teams && raw.teams[1]));
      const status = mapStatus(raw.status || raw.match_status, this._validationReport);

      // Invariant #1: match must have exactly 2 distinct teams
      if (!teamAId || !teamBId) {
        this._validationReport.warn("MATCH_TEAMS", `Match ${id} missing one or both team IDs`, { teamAId, teamBId });
      } else if (teamAId === teamBId) {
        this._validationReport.warn("MATCH_TEAMS", `Match ${id} has identical teams: ${teamAId}`, { teamAId, teamBId });
      } else {
        this._validationReport.pass("MATCH_DISTINCT_TEAMS");
      }

      this._matches[id] = {
        matchId: id,
        eventId: ensureString(tournamentId || raw.eventId || raw.series_id, null),
        teamA: teamAId,
        teamB: teamBId,
        scheduledTime: ensureString(raw.scheduledTime || raw.scheduled_time || raw.start_date || raw.date, null),
        venue: ensureString(raw.venue || raw.ground || raw.stadium, "Unknown Venue"),
        status,
        isAbandoned: status === "ABANDONED",
        includesSuperOver: Boolean(raw.includesSuperOver || raw.super_over || raw.is_super_over),
        bettingLockedAt: ensureString(raw.bettingLockedAt || raw.scheduled_time || raw.start_date || raw.date, null),
        result: ensureString(raw.result || raw.status_text || raw.result_text, null),
      };

      // Ambiguity tracking
      if (raw.teams && raw.teams.length > 2) {
        this._validationReport.ambiguity("matchTeams", `Match ${id} has ${raw.teams.length} teams in source data; used first two`, { teams: raw.teams });
      }

      this._validationReport.pass("MATCH_INGESTED");
      this._logEvent("MATCH_INGESTED", { matchId: id, tournamentId });
    }
  }

  // ─── Ingestion: Squads ──────────────────────────────────────────────────

  ingestSquads(matchId, rawSquads) {
    const match = this._matches[matchId];
    if (!match) {
      this._validationReport.warn("SQUAD", `Cannot ingest squads: match ${matchId} not found`);
      return;
    }

    const list = ensureArray(rawSquads);
    const squads = [];

    for (const raw of list) {
      const teamId = ensureString(raw.teamId || raw.team_id);
      if (!teamId) {
        this._validationReport.warn("SQUAD", `Squad entry missing teamId for match ${matchId}`, { raw });
        continue;
      }

      const playerIds = ensureArray(raw.playerIds || raw.player_ids || raw.players || raw.squad)
        .map(p => ensureString(typeof p === "string" ? p : (p.id || p.playerId || p.player_id)))
        .filter(Boolean);

      const playingXI = ensureArray(raw.playingXI || raw.playing_xi || raw.playing_11 || raw.xi)
        .map(p => ensureString(typeof p === "string" ? p : (p.id || p.playerId || p.player_id)))
        .filter(Boolean);

      // Validate: playingXI ⊆ playerIds
      const playerIdSet = new Set(playerIds);
      for (const pid of playingXI) {
        if (!playerIdSet.has(pid)) {
          this._validationReport.warn("SQUAD_SUBSET", `Playing XI player ${pid} not in squad playerIds for team ${teamId}, match ${matchId}`);
        }
      }

      // Validate: squad players ⊆ team roster (if roster known)
      const team = this._teams[teamId];
      if (team && team._rosterPlayerIds && team._rosterPlayerIds.length > 0) {
        const rosterSet = new Set(team._rosterPlayerIds);
        for (const pid of playerIds) {
          if (!rosterSet.has(pid)) {
            this._validationReport.warn("SQUAD_ROSTER", `Squad player ${pid} not in team ${teamId} roster for match ${matchId}`);
          }
        }
        this._validationReport.pass("SQUAD_ROSTER_CHECK");
      } else {
        this._validationReport.ambiguity("squadRoster", `No roster available for team ${teamId}; cannot validate squad subset`, { teamId, matchId });
      }

      // Validate: no missing player IDs
      for (const pid of playerIds) {
        if (!this._players[pid]) {
          this._validationReport.warn("SQUAD_PLAYER_MISSING", `Player ${pid} in squad for match ${matchId} not found in player registry`);
        } else {
          this._validationReport.pass("SQUAD_PLAYER_EXISTS");
        }
      }

      squads.push({
        matchId,
        teamId,
        playerIds,
        playingXI: playingXI.length > 0 ? playingXI : playerIds, // fallback
        isFinal: Boolean(raw.isFinal || raw.is_final || raw.confirmed),
        lastUpdatedAt: ensureString(raw.lastUpdatedAt || raw.updated_at, new Date().toISOString()),
      });
    }

    // Invariant #2: match must have exactly 2 squads
    if (squads.length !== 2) {
      this._validationReport.warn("SQUAD_COUNT", `Match ${matchId} has ${squads.length} squads, expected 2`);
    } else {
      this._validationReport.pass("SQUAD_COUNT");

      // Validate squad teams match match teams
      const squadTeamIds = new Set(squads.map(s => s.teamId));
      if (!squadTeamIds.has(match.teamA)) {
        this._validationReport.warn("SQUAD_TEAM_MISMATCH", `Match ${matchId} teamA (${match.teamA}) has no squad`);
      }
      if (!squadTeamIds.has(match.teamB)) {
        this._validationReport.warn("SQUAD_TEAM_MISMATCH", `Match ${matchId} teamB (${match.teamB}) has no squad`);
      }
      this._validationReport.pass("SQUAD_TEAM_MATCH");
    }

    this._squads[matchId] = squads;
    this._logEvent("SQUADS_INGESTED", { matchId, squadCount: squads.length });
  }

  // ─── Read-only public API (mirrors SimulationAdapter) ───────────────────

  getTournaments() {
    return JSON.parse(JSON.stringify(Object.values(this._tournaments)));
  }

  getTournament(eventId) {
    const t = this._tournaments[eventId];
    return t ? JSON.parse(JSON.stringify(t)) : null;
  }

  getTeams(sport) {
    let list = Object.values(this._teams);
    if (sport) list = list.filter(t => t.sport === sport);
    // Strip internal fields
    return JSON.parse(JSON.stringify(list.map(t => {
      const { _rosterPlayerIds, ...rest } = t;
      return rest;
    })));
  }

  getTeam(teamId) {
    const t = this._teams[teamId];
    if (!t) return null;
    const { _rosterPlayerIds, ...rest } = t;
    return JSON.parse(JSON.stringify(rest));
  }

  getPlayers(filters = {}) {
    let list = Object.values(this._players);
    if (filters.teamId) list = list.filter(p => p.teamId === filters.teamId);
    if (filters.role) list = list.filter(p => p.role === filters.role);
    return JSON.parse(JSON.stringify(list));
  }

  getPlayer(playerId) {
    const p = this._players[playerId];
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

  isPlayerInMatchSquads(matchId, playerId) {
    const squads = this._squads[matchId] || [];
    return squads.some(s => s.playerIds.includes(playerId));
  }

  // Stats and timeline are not available from real feeds in shadow mode
  getPlayerMatchStats(_matchId) {
    return null;
  }

  getTimeline(_matchId) {
    return null;
  }
}

module.exports = { RealDataAdapter, ValidationReport };
