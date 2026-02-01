/**
 * identity.js — Stable user identity resolution.
 *
 * If the user is signed in via Google, returns their Google sub (stable ID).
 * Otherwise, generates and persists a random anonymous ID in localStorage.
 */

const ANON_KEY = "fantasy_arena_anon_id";

/**
 * Get or create a stable anonymous ID.
 */
export function getAnonymousId() {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

/**
 * Resolve the best available user ID.
 * @param {object|null} authUser - The authenticated user from AuthProvider (or null).
 * @returns {{ userId: string, displayName: string }}
 */
export function resolveIdentity(authUser) {
  if (authUser) {
    return {
      userId: authUser.userId,
      displayName: authUser.name || authUser.email || authUser.userId,
    };
  }
  const anonId = getAnonymousId();
  return {
    userId: anonId,
    displayName: "Guest " + anonId.slice(-4).toUpperCase(),
  };
}
