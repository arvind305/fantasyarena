/**
 * poll.js — External data ingestion polling stub.
 *
 * In SHADOW mode, polls a configured endpoint at regular intervals
 * to refresh match data, team data, and status updates.
 *
 * Data flows: External API → poll.js → adapter → engine → UI
 *
 * In SIMULATION mode, this module is inert (no polling).
 * In LIVE mode, the real backend handles ingestion; this is unused.
 *
 * The polling endpoint is a stub. When a real external data provider
 * is available, replace the fetch URL and response mapping below.
 */

import { IS_SHADOW_MODE, POLL_INTERVAL_MS } from "../config";

let _intervalId = null;
let _listeners = [];
let _lastPollAt = null;
let _pollCount = 0;
let _errors = [];

/**
 * Register a callback that fires after each successful poll.
 * Callback receives { matches, events, timestamp }.
 */
export function onPollUpdate(callback) {
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter((cb) => cb !== callback);
  };
}

/**
 * Single poll cycle. Fetches external data and notifies listeners.
 *
 * Stub implementation: when a real endpoint is configured via
 * REACT_APP_POLL_URL, it fetches from there. Otherwise logs a
 * no-op message (shadow mode validates the wiring, not the data).
 */
async function pollOnce() {
  const pollUrl = process.env.REACT_APP_POLL_URL;
  _pollCount++;

  if (!pollUrl) {
    // No external endpoint configured — stub poll.
    // In shadow mode this confirms the polling loop is alive.
    _lastPollAt = new Date().toISOString();
    console.log(`[poll] Shadow poll #${_pollCount} at ${_lastPollAt} — no REACT_APP_POLL_URL configured (stub).`);
    return;
  }

  try {
    const res = await fetch(pollUrl);
    if (!res.ok) {
      throw new Error(`Poll endpoint returned ${res.status}`);
    }
    const data = await res.json();
    _lastPollAt = new Date().toISOString();

    // Normalize and forward to listeners.
    // The listener (typically api.js or a top-level effect) is responsible
    // for feeding this data into the adapter/engine.
    const update = {
      matches: data.matches || [],
      events: data.events || data.tournaments || [],
      teams: data.teams || [],
      players: data.players || [],
      timestamp: _lastPollAt,
    };

    for (const cb of _listeners) {
      try { cb(update); } catch (err) {
        console.error("[poll] Listener error:", err);
      }
    }

    console.log(`[poll] Shadow poll #${_pollCount} OK — ${update.matches.length} matches, ${update.teams.length} teams`);
  } catch (err) {
    _errors.push({ at: new Date().toISOString(), error: err.message });
    console.warn(`[poll] Shadow poll #${_pollCount} failed:`, err.message);
    // Never crash. Polling continues on next interval.
  }
}

/**
 * Start the polling loop. Only active in shadow mode with a positive interval.
 * Safe to call multiple times (idempotent).
 */
export function startPolling() {
  if (_intervalId !== null) return; // already running
  if (!IS_SHADOW_MODE) {
    console.log("[poll] Not in shadow mode — polling disabled.");
    return;
  }
  if (POLL_INTERVAL_MS <= 0) {
    console.log("[poll] POLL_INTERVAL_MS is 0 — polling disabled.");
    return;
  }

  console.log(`[poll] Starting shadow polling every ${POLL_INTERVAL_MS}ms.`);

  // Immediate first poll, then interval.
  pollOnce();
  _intervalId = setInterval(pollOnce, POLL_INTERVAL_MS);
}

/**
 * Stop the polling loop. Safe to call when not running.
 */
export function stopPolling() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log("[poll] Polling stopped.");
  }
}

/**
 * Diagnostics — for admin/debug visibility.
 */
export function getPollStatus() {
  return {
    isRunning: _intervalId !== null,
    isShadowMode: IS_SHADOW_MODE,
    intervalMs: POLL_INTERVAL_MS,
    lastPollAt: _lastPollAt,
    pollCount: _pollCount,
    recentErrors: _errors.slice(-5),
  };
}
