/**
 * config.js — Operational mode configuration.
 *
 * Three modes, one toggle:
 *
 *   SIMULATION  — Seeded mock data (ExternalDataAdapter.js). Fully offline.
 *                 Bets accepted and scored in-memory via localStorage.
 *                 Used for development and dry-run validation.
 *
 *   SHADOW      — RealDataAdapter feeds (or real API for reads). Read-only.
 *                 External data ingested on interval via poll.js.
 *                 Bet submissions are BLOCKED (server rejects, UI warns).
 *                 Match status flows from real scheduledTime through adapter.
 *                 Scores are never persisted. Leaderboards are frozen/empty.
 *                 Purpose: validate ingestion + UI rendering against live data
 *                 without affecting users or producing real scores.
 *
 *   LIVE        — Production. Real API backend for all reads and writes.
 *                 Bets accepted and scored server-side.
 *                 Switch here when ready to launch.
 *
 * To switch modes:
 *   1. Set REACT_APP_ENGINE_MODE in .env (or environment)
 *   2. Or change the fallback below
 *
 * SHADOW → LIVE migration:
 *   1. Set REACT_APP_ENGINE_MODE=live
 *   2. Set REACT_APP_API_URL to production backend
 *   3. Redeploy. No code changes required.
 */

const VALID_MODES = ["simulation", "shadow", "live"];

export const ENGINE_MODE = (() => {
  const env = (process.env.REACT_APP_ENGINE_MODE || "simulation").toLowerCase().trim();
  if (!VALID_MODES.includes(env)) {
    console.warn(`[config] Unknown ENGINE_MODE "${env}", falling back to "simulation".`);
    return "simulation";
  }
  return env;
})();

/**
 * Global safeguard flag.
 *
 * When true:
 *   - Bet submissions return a clear error (not silently swallowed)
 *   - Long-term bet submissions blocked
 *   - Group creation/joining still allowed (no scoring impact)
 *   - All read operations work normally
 *   - Scores are never persisted
 */
export const IS_SHADOW_MODE = ENGINE_MODE === "shadow";

/**
 * Whether the UI should use the in-browser mock engine for data.
 * True for both simulation and shadow (shadow uses mock engine for reads
 * but blocks writes via the shadow guard).
 */
export const USE_LOCAL_ENGINE = ENGINE_MODE !== "live";

/**
 * Polling interval for external data refresh (milliseconds).
 * Only active in shadow mode. Set to 0 to disable.
 */
export const POLL_INTERVAL_MS = IS_SHADOW_MODE
  ? parseInt(process.env.REACT_APP_POLL_INTERVAL_MS || "60000", 10)
  : 0;

/**
 * API base URL for live mode.
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || "";
