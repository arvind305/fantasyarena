/**
 * Central tournament configuration.
 *
 * To switch tournaments (e.g. T20 WC → IPL), change these values
 * and provide a matching schedule JSON in public/data/.
 *
 * Every file that previously hardcoded "t20wc_2026", "wc_m", or
 * "/data/t20wc_2026.json" now imports from here.
 */
export const CURRENT_TOURNAMENT = {
  id: "t20wc_2026",
  name: "T20 World Cup 2026",
  shortName: "T20 WC",
  matchIdPrefix: "wc_m",
  dataFile: "/data/t20wc_2026.json",
  fallbackDateRange: "7 Feb \u2013 8 Mar 2026",
};
