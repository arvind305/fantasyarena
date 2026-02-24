/**
 * config.js — Application configuration.
 */

/**
 * Admin email for client-side UI gating (show/hide admin links).
 * NOT a security boundary — all admin operations are verified server-side.
 * Set via REACT_APP_ADMIN_EMAIL env var (baked in at build time).
 */
export function getAdminEmail() {
  return (process.env.REACT_APP_ADMIN_EMAIL || "").trim().toLowerCase();
}
