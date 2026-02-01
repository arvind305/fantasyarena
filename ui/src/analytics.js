/**
 * analytics.js — Centralized analytics instrumentation.
 *
 * Uses Google Analytics 4 (gtag.js).
 * The GA script is loaded in index.html; this module wraps gtag calls.
 *
 * Tracked events:
 *   app_open, sign_in, sign_out,
 *   match_created, match_joined, team_locked, match_completed
 *
 * All events include userId (if available) and matchId (if applicable).
 */

const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || "";

function gtag(...args) {
  if (window.gtag) {
    window.gtag(...args);
  }
}

/**
 * Track a custom event.
 * @param {string} eventName
 * @param {object} [params] - Additional parameters (userId, matchId, etc.)
 */
export function trackEvent(eventName, params = {}) {
  if (!MEASUREMENT_ID) {
    // In dev without GA configured, log to console
    if (process.env.NODE_ENV === "development") {
      console.log(`[analytics] ${eventName}`, params);
    }
    return;
  }

  gtag("event", eventName, {
    ...params,
    send_to: MEASUREMENT_ID,
  });
}

/**
 * Set persistent user properties (called once on sign-in).
 * @param {string} userId
 */
export function setAnalyticsUser(userId) {
  if (!MEASUREMENT_ID) return;
  gtag("config", MEASUREMENT_ID, { user_id: userId });
}

/**
 * Track app open — call once at app boot.
 */
export function trackAppOpen() {
  trackEvent("app_open");
}
