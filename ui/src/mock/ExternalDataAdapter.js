/**
 * ExternalDataAdapter.js — Abstraction over externally-owned data.
 *
 * In production, this would call Cricbuzz / ESPNcricinfo / equivalent APIs.
 * For now, it returns mock snapshots that simulate ingestion behavior.
 *
 * ALL data returned here is READ-ONLY to the rest of the system.
 * The adapter owns: Tournaments, Teams, Players, Matches, Squads, PlayerMatchStats.
 * Nothing in the UI or engine may create, modify, or delete these entities.
 *
 * Finality rules (from DOMAIN_MODEL_AND_DATA_CONTRACTS.md §5):
 *   - Squads: updateable until betting locks (first ball). After lock, changes do NOT
 *     invalidate existing bets — players who are swapped out simply score zero.
 *   - Player stats: provisional for 2 hours after match completion, then final.
 *   - Match result: final when status = COMPLETED and stats are finalized.
 */

// ─── Raw external data (simulates what an ingestion pipeline would store) ─────

const _tournaments = [
  {
    eventId: "ipl2025",
    name: "IPL 2025",
    sport: "cricket",
    format: "t20",
    season: "2025",
    status: "ACTIVE",
    startDate: "2025-03-22T00:00:00Z",
    endDate: "2025-05-25T00:00:00Z",
    rulesetVersion: "constitution-v1.0",
  },
];

const _teams = [
  { teamId: "csk", name: "Chennai Super Kings",        shortName: "CSK",  sport: "cricket", logoUrl: null, color: "#f9cd05" },
  { teamId: "mi",  name: "Mumbai Indians",             shortName: "MI",   sport: "cricket", logoUrl: null, color: "#004ba0" },
  { teamId: "rcb", name: "Royal Challengers Bengaluru", shortName: "RCB", sport: "cricket", logoUrl: null, color: "#d4213d" },
  { teamId: "kkr", name: "Kolkata Knight Riders",      shortName: "KKR",  sport: "cricket", logoUrl: null, color: "#3a225d" },
  { teamId: "dc",  name: "Delhi Capitals",             shortName: "DC",   sport: "cricket", logoUrl: null, color: "#0078bc" },
  { teamId: "srh", name: "Sunrisers Hyderabad",        shortName: "SRH",  sport: "cricket", logoUrl: null, color: "#ff822a" },
  { teamId: "rr",  name: "Rajasthan Royals",           shortName: "RR",   sport: "cricket", logoUrl: null, color: "#ea1a85" },
  { teamId: "pbks",name: "Punjab Kings",               shortName: "PBKS", sport: "cricket", logoUrl: null, color: "#ed1b24" },
];

const _players = [
  // CSK
  { playerId: "p1",  name: "MS Dhoni",            role: "WK",   nationality: "India", teamId: "csk"  },
  { playerId: "p2",  name: "Ruturaj Gaikwad",     role: "BAT",  nationality: "India", teamId: "csk"  },
  { playerId: "p3",  name: "Ravindra Jadeja",     role: "AR",   nationality: "India", teamId: "csk"  },
  { playerId: "p4",  name: "Deepak Chahar",       role: "BOWL", nationality: "India", teamId: "csk"  },
  // MI
  { playerId: "p5",  name: "Rohit Sharma",        role: "BAT",  nationality: "India", teamId: "mi"   },
  { playerId: "p6",  name: "Jasprit Bumrah",      role: "BOWL", nationality: "India", teamId: "mi"   },
  { playerId: "p7",  name: "Suryakumar Yadav",    role: "BAT",  nationality: "India", teamId: "mi"   },
  { playerId: "p8",  name: "Ishan Kishan",        role: "WK",   nationality: "India", teamId: "mi"   },
  // RCB
  { playerId: "p9",  name: "Virat Kohli",         role: "BAT",  nationality: "India", teamId: "rcb"  },
  { playerId: "p10", name: "Glenn Maxwell",       role: "AR",   nationality: "Australia", teamId: "rcb" },
  { playerId: "p11", name: "Mohammed Siraj",      role: "BOWL", nationality: "India", teamId: "rcb"  },
  { playerId: "p12", name: "Faf du Plessis",      role: "BAT",  nationality: "South Africa", teamId: "rcb" },
  // KKR
  { playerId: "p13", name: "Shreyas Iyer",        role: "BAT",  nationality: "India", teamId: "kkr"  },
  { playerId: "p14", name: "Andre Russell",       role: "AR",   nationality: "West Indies", teamId: "kkr" },
  { playerId: "p15", name: "Sunil Narine",        role: "AR",   nationality: "West Indies", teamId: "kkr" },
  { playerId: "p16", name: "Varun Chakravarthy",  role: "BOWL", nationality: "India", teamId: "kkr"  },
  // DC
  { playerId: "p17", name: "Rishabh Pant",        role: "WK",   nationality: "India", teamId: "dc"   },
  { playerId: "p18", name: "Axar Patel",          role: "AR",   nationality: "India", teamId: "dc"   },
  { playerId: "p19", name: "Anrich Nortje",       role: "BOWL", nationality: "South Africa", teamId: "dc" },
  // SRH
  { playerId: "p20", name: "Travis Head",         role: "BAT",  nationality: "Australia", teamId: "srh" },
  { playerId: "p21", name: "Heinrich Klaasen",    role: "WK",   nationality: "South Africa", teamId: "srh" },
  { playerId: "p22", name: "Pat Cummins",         role: "BOWL", nationality: "Australia", teamId: "srh" },
  // RR
  { playerId: "p23", name: "Sanju Samson",        role: "WK",   nationality: "India", teamId: "rr"   },
  { playerId: "p24", name: "Jos Buttler",         role: "BAT",  nationality: "England", teamId: "rr"  },
  { playerId: "p25", name: "Yuzvendra Chahal",    role: "BOWL", nationality: "India", teamId: "rr"   },
  // PBKS
  { playerId: "p26", name: "Shikhar Dhawan",      role: "BAT",  nationality: "India", teamId: "pbks" },
  { playerId: "p27", name: "Sam Curran",          role: "AR",   nationality: "England", teamId: "pbks"},
  { playerId: "p28", name: "Kagiso Rabada",       role: "BOWL", nationality: "South Africa", teamId: "pbks" },
];

// Matches — externally sourced schedule
const _now = Date.now();
const _matches = [
  {
    matchId: "m1", eventId: "ipl2025",
    teamA: "csk", teamB: "mi",
    scheduledTime: new Date(_now + 2 * 3600000).toISOString(),
    venue: "MA Chidambaram Stadium, Chennai",
    status: "UPCOMING",
    isAbandoned: false,
    includesSuperOver: false,
    bettingLockedAt: null,
  },
  {
    matchId: "m2", eventId: "ipl2025",
    teamA: "rcb", teamB: "kkr",
    scheduledTime: new Date(_now - 1 * 3600000).toISOString(),
    venue: "M. Chinnaswamy Stadium, Bengaluru",
    status: "LIVE",
    isAbandoned: false,
    includesSuperOver: false,
    bettingLockedAt: new Date(_now - 1 * 3600000).toISOString(),
  },
  {
    matchId: "m3", eventId: "ipl2025",
    teamA: "dc", teamB: "srh",
    scheduledTime: new Date(_now + 26 * 3600000).toISOString(),
    venue: "Arun Jaitley Stadium, Delhi",
    status: "UPCOMING",
    isAbandoned: false,
    includesSuperOver: false,
    bettingLockedAt: null,
  },
  {
    matchId: "m4", eventId: "ipl2025",
    teamA: "rr", teamB: "pbks",
    scheduledTime: new Date(_now + 50 * 3600000).toISOString(),
    venue: "Sawai Mansingh Stadium, Jaipur",
    status: "UPCOMING",
    isAbandoned: false,
    includesSuperOver: false,
    bettingLockedAt: null,
  },
  {
    matchId: "m5", eventId: "ipl2025",
    teamA: "csk", teamB: "rcb",
    scheduledTime: new Date(_now - 48 * 3600000).toISOString(),
    venue: "MA Chidambaram Stadium, Chennai",
    status: "COMPLETED",
    isAbandoned: false,
    includesSuperOver: false,
    bettingLockedAt: new Date(_now - 48 * 3600000).toISOString(),
    result: "CSK won by 6 wickets",
  },
  {
    matchId: "m6", eventId: "ipl2025",
    teamA: "mi", teamB: "kkr",
    scheduledTime: new Date(_now - 24 * 3600000).toISOString(),
    venue: "Wankhede Stadium, Mumbai",
    status: "COMPLETED",
    isAbandoned: false,
    includesSuperOver: false,
    bettingLockedAt: new Date(_now - 24 * 3600000).toISOString(),
    result: "KKR won by 22 runs",
  },
];

// Squads — per-match rosters (externally sourced at toss time)
// For completed/live matches, squads are final. For upcoming, may still update.
const _squads = {
  m1: [
    { matchId: "m1", teamId: "csk", playerIds: ["p1","p2","p3","p4"], playingXI: ["p1","p2","p3","p4"], isFinal: false, lastUpdatedAt: new Date(_now - 3600000).toISOString() },
    { matchId: "m1", teamId: "mi",  playerIds: ["p5","p6","p7","p8"], playingXI: ["p5","p6","p7","p8"], isFinal: false, lastUpdatedAt: new Date(_now - 3600000).toISOString() },
  ],
  m2: [
    { matchId: "m2", teamId: "rcb", playerIds: ["p9","p10","p11","p12"], playingXI: ["p9","p10","p11","p12"], isFinal: true, lastUpdatedAt: new Date(_now - 3600000).toISOString() },
    { matchId: "m2", teamId: "kkr", playerIds: ["p13","p14","p15","p16"], playingXI: ["p13","p14","p15","p16"], isFinal: true, lastUpdatedAt: new Date(_now - 3600000).toISOString() },
  ],
  m3: [
    { matchId: "m3", teamId: "dc",  playerIds: ["p17","p18","p19"], playingXI: ["p17","p18","p19"], isFinal: false, lastUpdatedAt: new Date(_now - 7200000).toISOString() },
    { matchId: "m3", teamId: "srh", playerIds: ["p20","p21","p22"], playingXI: ["p20","p21","p22"], isFinal: false, lastUpdatedAt: new Date(_now - 7200000).toISOString() },
  ],
  m4: [
    { matchId: "m4", teamId: "rr",   playerIds: ["p23","p24","p25"], playingXI: ["p23","p24","p25"], isFinal: false, lastUpdatedAt: new Date(_now - 7200000).toISOString() },
    { matchId: "m4", teamId: "pbks", playerIds: ["p26","p27","p28"], playingXI: ["p26","p27","p28"], isFinal: false, lastUpdatedAt: new Date(_now - 7200000).toISOString() },
  ],
  m5: [
    { matchId: "m5", teamId: "csk", playerIds: ["p1","p2","p3","p4"], playingXI: ["p1","p2","p3","p4"], isFinal: true, lastUpdatedAt: new Date(_now - 49 * 3600000).toISOString() },
    { matchId: "m5", teamId: "rcb", playerIds: ["p9","p10","p11","p12"], playingXI: ["p9","p10","p11","p12"], isFinal: true, lastUpdatedAt: new Date(_now - 49 * 3600000).toISOString() },
  ],
  m6: [
    { matchId: "m6", teamId: "mi",  playerIds: ["p5","p6","p7","p8"], playingXI: ["p5","p6","p7","p8"], isFinal: true, lastUpdatedAt: new Date(_now - 25 * 3600000).toISOString() },
    { matchId: "m6", teamId: "kkr", playerIds: ["p13","p14","p15","p16"], playingXI: ["p13","p14","p15","p16"], isFinal: true, lastUpdatedAt: new Date(_now - 25 * 3600000).toISOString() },
  ],
};

// Player match stats (externally sourced scorecard data for completed matches)
const _playerMatchStats = {
  m5: {
    p1:  { runs: 45, ballsFaced: 28, fours: 4, sixes: 2, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 1, runOuts: 0, stumpings: 1, isManOfTheMatch: false, hasTakenHatTrick: false },
    p2:  { runs: 82, ballsFaced: 55, fours: 8, sixes: 3, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, stumpings: 0, isManOfTheMatch: true,  hasTakenHatTrick: false },
    p3:  { runs: 35, ballsFaced: 22, fours: 3, sixes: 1, wickets: 2, oversBowled: 4, runsConceded: 28, catches: 1, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p4:  { runs: 0,  ballsFaced: 0,  fours: 0, sixes: 0, wickets: 3, oversBowled: 4, runsConceded: 32, catches: 0, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p9:  { runs: 65, ballsFaced: 42, fours: 6, sixes: 2, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 1, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p10: { runs: 28, ballsFaced: 18, fours: 2, sixes: 2, wickets: 1, oversBowled: 4, runsConceded: 38, catches: 0, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p11: { runs: 2,  ballsFaced: 4,  fours: 0, sixes: 0, wickets: 1, oversBowled: 4, runsConceded: 30, catches: 0, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p12: { runs: 40, ballsFaced: 32, fours: 4, sixes: 1, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 2, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
  },
  m6: {
    p5:  { runs: 55, ballsFaced: 40, fours: 5, sixes: 2, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p6:  { runs: 0,  ballsFaced: 2,  fours: 0, sixes: 0, wickets: 2, oversBowled: 4, runsConceded: 22, catches: 0, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p7:  { runs: 38, ballsFaced: 25, fours: 3, sixes: 2, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 1, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p8:  { runs: 22, ballsFaced: 18, fours: 2, sixes: 0, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, stumpings: 1, isManOfTheMatch: false, hasTakenHatTrick: false },
    p13: { runs: 72, ballsFaced: 48, fours: 7, sixes: 3, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 1, runOuts: 0, stumpings: 0, isManOfTheMatch: true,  hasTakenHatTrick: false },
    p14: { runs: 45, ballsFaced: 22, fours: 3, sixes: 4, wickets: 2, oversBowled: 4, runsConceded: 35, catches: 0, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p15: { runs: 30, ballsFaced: 15, fours: 2, sixes: 2, wickets: 1, oversBowled: 4, runsConceded: 25, catches: 1, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
    p16: { runs: 0,  ballsFaced: 0,  fours: 0, sixes: 0, wickets: 3, oversBowled: 4, runsConceded: 20, catches: 0, runOuts: 0, stumpings: 0, isManOfTheMatch: false, hasTakenHatTrick: false },
  },
};

// ─── Finality tracking ───────────────────────────────────────────────────────

const STATS_FINALITY_WINDOW_MS = 2 * 3600000; // 2 hours

function areStatsFinalized(match) {
  if (match.status !== "COMPLETED") return false;
  // Stats are final 2 hours after the match's bettingLockedAt + estimated match duration (~4h)
  // Simplified: final if completed more than 2 hours ago
  const completedAgo = _now - new Date(match.scheduledTime).getTime();
  return completedAgo > STATS_FINALITY_WINDOW_MS;
}

// ─── Public API (read-only) ──────────────────────────────────────────────────

/**
 * Returns all tournaments.
 */
export function getTournaments() {
  return structuredClone(_tournaments);
}

/**
 * Returns a single tournament by eventId, or null.
 */
export function getTournament(eventId) {
  const t = _tournaments.find((x) => x.eventId === eventId);
  return t ? structuredClone(t) : null;
}

/**
 * Returns all teams, optionally filtered by sport.
 */
export function getTeams(sport) {
  const list = sport ? _teams.filter((t) => t.sport === sport) : _teams;
  return structuredClone(list);
}

/**
 * Returns a single team by teamId, or null.
 */
export function getTeam(teamId) {
  const t = _teams.find((x) => x.teamId === teamId);
  return t ? structuredClone(t) : null;
}

/**
 * Returns all players, optionally filtered.
 */
export function getPlayers(filters = {}) {
  let list = [..._players];
  if (filters.teamId) list = list.filter((p) => p.teamId === filters.teamId);
  if (filters.role) list = list.filter((p) => p.role === filters.role);
  return structuredClone(list);
}

/**
 * Returns a single player by playerId, or null.
 */
export function getPlayer(playerId) {
  const p = _players.find((x) => x.playerId === playerId);
  return p ? structuredClone(p) : null;
}

/**
 * Returns all matches, optionally filtered.
 */
export function getMatches(filters = {}) {
  let list = [..._matches];
  if (filters.status) list = list.filter((m) => m.status === filters.status);
  if (filters.eventId) list = list.filter((m) => m.eventId === filters.eventId);
  return structuredClone(list);
}

/**
 * Returns a single match by matchId, or null.
 */
export function getMatch(matchId) {
  const m = _matches.find((x) => x.matchId === matchId);
  return m ? structuredClone(m) : null;
}

/**
 * Returns squads for a given match. Always returns an array (possibly empty).
 * Contract: empty array if squads not yet announced, never null.
 */
export function getSquads(matchId) {
  return structuredClone(_squads[matchId] || []);
}

/**
 * Returns the union of all playerIds across both squads for a match.
 */
export function getMatchPlayerIds(matchId) {
  const squads = _squads[matchId] || [];
  const ids = new Set();
  for (const s of squads) {
    for (const pid of s.playerIds) ids.add(pid);
  }
  return [...ids];
}

/**
 * Returns player match stats for a completed match. Null if not available.
 * Includes finality flag.
 */
export function getPlayerMatchStats(matchId) {
  const match = _matches.find((m) => m.matchId === matchId);
  if (!match || !_playerMatchStats[matchId]) return null;
  return {
    stats: structuredClone(_playerMatchStats[matchId]),
    isFinalized: areStatsFinalized(match),
  };
}

/**
 * Checks whether a player is in one of the match's squads.
 */
export function isPlayerInMatchSquads(matchId, playerId) {
  const squads = _squads[matchId] || [];
  return squads.some((s) => s.playerIds.includes(playerId));
}
