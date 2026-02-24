/**
 * Server-side tournament config — mirrors ui/src/config/tournament.js
 *
 * To switch tournaments, update both this file AND ui/src/config/tournament.js.
 */
const CURRENT_TOURNAMENT = {
  id: "t20wc_2026",
  name: "T20 World Cup 2026",
  matchIdPrefix: "wc_m",
  dataFile: "/data/t20wc_2026.json",
};

module.exports = { CURRENT_TOURNAMENT };
