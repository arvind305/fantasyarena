/**
 * apiClient.js — Authenticated API client for server-side endpoints.
 *
 * All write operations go through Vercel serverless functions.
 * The Google OAuth token is sent in the Authorization header.
 */

/**
 * Get the current auth token from localStorage.
 * This is a standalone function (not a hook) so it can be used in api.js.
 */
export function getStoredToken() {
  try {
    const raw = localStorage.getItem('fantasy_arena_auth_v3');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

/**
 * Make an authenticated POST request to a server-side API endpoint.
 *
 * @param {string} url - API endpoint path (e.g., '/api/submit-bet')
 * @param {object} body - Request body (will be JSON-encoded)
 * @returns {Promise<object>} Response data
 * @throws {Error} If the request fails or returns an error
 */
export async function authenticatedPost(url, body) {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error (${res.status})`);
  }

  return data;
}
