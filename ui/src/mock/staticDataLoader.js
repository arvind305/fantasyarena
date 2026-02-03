/**
 * staticDataLoader.js — Fetches and caches static tournament data from /data/*.json.
 *
 * Returns a normalized object:
 *   { tournament, matches, players, squads }
 *
 * Uses in-memory caching so repeated calls don't refetch.
 */

let cachedData = null;
let loadPromise = null;

/**
 * Team code to teamId mapping.
 * The JSON files use short codes (PAK, IND) for matches,
 * but full IDs (pakistan, india) for players/squads.
 */
const TEAM_CODE_TO_ID = {
  IND: "india",
  PAK: "pakistan",
  USA: "usa",
  NED: "netherlands",
  NAM: "namibia",
  AUS: "australia",
  SL: "sri_lanka",
  IRE: "ireland",
  ZIM: "zimbabwe",
  OMAN: "oman",
  ENG: "england",
  WI: "west_indies",
  ITA: "italy",
  NEP: "nepal",
  SCO: "scotland",
  RSA: "south_africa",
  NZ: "new_zealand",
  AFG: "afghanistan",
  CAN: "canada",
  UAE: "uae",
};

/**
 * Reverse mapping: teamId to short code
 */
const TEAM_ID_TO_CODE = Object.fromEntries(
  Object.entries(TEAM_CODE_TO_ID).map(([code, id]) => [id, code])
);

/**
 * Team display names
 */
const TEAM_NAMES = {
  india: "India",
  pakistan: "Pakistan",
  usa: "USA",
  netherlands: "Netherlands",
  namibia: "Namibia",
  australia: "Australia",
  sri_lanka: "Sri Lanka",
  ireland: "Ireland",
  zimbabwe: "Zimbabwe",
  oman: "Oman",
  england: "England",
  west_indies: "West Indies",
  italy: "Italy",
  nepal: "Nepal",
  scotland: "Scotland",
  south_africa: "South Africa",
  new_zealand: "New Zealand",
  afghanistan: "Afghanistan",
  canada: "Canada",
  uae: "UAE",
};

/**
 * Team colors (brand colors for display)
 */
const TEAM_COLORS = {
  india: "#1e90ff",
  pakistan: "#006400",
  usa: "#b22234",
  netherlands: "#ff6600",
  namibia: "#003580",
  australia: "#ffcc00",
  sri_lanka: "#0033a0",
  ireland: "#169b62",
  zimbabwe: "#ffd700",
  oman: "#c8102e",
  england: "#cf142b",
  west_indies: "#7b3f00",
  italy: "#009246",
  nepal: "#dc143c",
  scotland: "#0065bd",
  south_africa: "#007749",
  new_zealand: "#000000",
  afghanistan: "#0066b2",
  canada: "#ff0000",
  uae: "#00732f",
};

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Loads and normalizes all static tournament data.
 * Returns cached data on subsequent calls.
 */
export async function loadStaticData() {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const [tournamentData, playersRaw, squadsRaw] = await Promise.all([
      fetchJSON("/data/t20wc_2026.json"),
      fetchJSON("/data/players.json"),
      fetchJSON("/data/squads.json"),
    ]);

    // Normalize tournament
    const tournament = {
      eventId: tournamentData.tournament.id,
      name: tournamentData.tournament.name,
      sport: "cricket",
      format: "t20",
      season: "2026",
      status: "UPCOMING",
      startDate: "2026-02-07T00:00:00Z",
      endDate: "2026-03-08T00:00:00Z",
      rulesetVersion: "constitution-v1.0",
      groups: tournamentData.groups,
      super8_seeding: tournamentData.super8_seeding,
    };

    // Normalize matches
    const matches = tournamentData.matches.map((m) => {
      // Convert date + time_gmt to ISO string
      const scheduledTime = new Date(`${m.date}T${m.time_gmt}:00Z`).toISOString();
      const now = Date.now();
      const matchTime = new Date(scheduledTime).getTime();

      // Determine status based on time
      let status = "UPCOMING";
      if (matchTime < now - 4 * 3600000) {
        status = "COMPLETED";
      } else if (matchTime < now) {
        status = "LIVE";
      }

      // Resolve team codes (may be placeholders like X1, Y2, TBC for knockout)
      let teamACode = m.teams[0];
      let teamBCode = m.teams[1];

      // If it's a Super8 seeding placeholder, resolve it
      if (tournamentData.super8_seeding[teamACode]) {
        teamACode = tournamentData.super8_seeding[teamACode];
      }
      if (tournamentData.super8_seeding[teamBCode]) {
        teamBCode = tournamentData.super8_seeding[teamBCode];
      }

      return {
        matchId: `wc_m${m.match_id}`,
        eventId: tournament.eventId,
        teamA: teamACode,
        teamB: teamBCode,
        scheduledTime,
        venue: `${m.venue}, ${m.city}`,
        status,
        isAbandoned: false,
        includesSuperOver: false,
        bettingLockedAt: status !== "UPCOMING" ? scheduledTime : null,
        result: null,
        stage: m.stage,
        group: m.group,
        isTbc: m.is_tbc,
      };
    });

    // Build players map (playerId → player object)
    const players = playersRaw.map((p) => ({
      playerId: p.playerId,
      name: p.name,
      role: p.role,
      nationality: TEAM_NAMES[p.teamId] || p.teamId,
      teamId: p.teamId,
      batHand: p.batHand || null,
      isCaptain: p.isCaptain || false,
    }));

    // Build squads map (teamId → player IDs array)
    const squads = {};
    for (const sq of squadsRaw) {
      squads[sq.teamId] = sq.players;
    }

    cachedData = { tournament, matches, players, squads };

    // Console confirmation as requested
    console.log(
      `Loaded static tournament data: ${tournament.name}, matches=${matches.length}, players=${players.length}, squads=${Object.keys(squads).length}`
    );

    return cachedData;
  })();

  return loadPromise;
}

/**
 * Clears the cache (useful for testing/dev).
 */
export function clearStaticDataCache() {
  cachedData = null;
  loadPromise = null;
}

// Export mappings for use by ExternalDataAdapter
export { TEAM_CODE_TO_ID, TEAM_ID_TO_CODE, TEAM_NAMES, TEAM_COLORS };
