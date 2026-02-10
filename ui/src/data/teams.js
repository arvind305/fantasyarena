/**
 * teams.js — Static team constants for T20 World Cup 2026.
 *
 * Team code ↔ ID mappings, display names, and brand colors.
 * Extracted from the mock engine for direct use by the API layer.
 */

export const TEAM_CODE_TO_ID = {
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

export const TEAM_ID_TO_CODE = Object.fromEntries(
  Object.entries(TEAM_CODE_TO_ID).map(([code, id]) => [id, code])
);

export const TEAM_NAMES = {
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

export const TEAM_COLORS = {
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

/**
 * Build a team display object from a team code.
 */
export function buildTeamObject(teamCode) {
  const teamId = TEAM_CODE_TO_ID[teamCode] || teamCode?.toLowerCase();
  return {
    teamId: teamId || teamCode,
    name: TEAM_NAMES[teamId] || teamCode,
    shortName: teamCode,
    sport: "cricket",
    logoUrl: null,
    color: TEAM_COLORS[teamId] || "#888888",
  };
}
