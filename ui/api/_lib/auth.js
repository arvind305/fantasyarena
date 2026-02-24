/**
 * Shared auth verification for all API routes.
 * Verifies Google OAuth tokens and extracts user identity.
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Verify a Google token (either id_token or access_token).
 * Returns user info or null if invalid.
 */
async function verifyGoogleToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  // Try as id_token first (from GIS credential flow)
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    if (res.ok) {
      const payload = await res.json();
      // Verify audience matches our client ID (if configured)
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (clientId && payload.aud !== clientId) {
        return null;
      }
      return {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    }
  } catch {
    // Not a valid id_token, try as access_token
  }

  // Try as access_token (from OAuth2 popup flow)
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const info = await res.json();
      return {
        userId: info.sub,
        email: info.email,
        name: info.name,
      };
    }
  } catch {
    // Invalid token
  }

  return null;
}

/**
 * Check if the given email is the admin email.
 */
function isAdmin(email) {
  const adminEmail = process.env.ADMIN_EMAIL || '';
  return (
    adminEmail &&
    email &&
    email.trim().toLowerCase() === adminEmail.trim().toLowerCase()
  );
}

/**
 * Create a Supabase client with service_role key (full access).
 */
function createServiceClient() {
  return createClient(
    process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function unauthorized(res, msg = 'Unauthorized') {
  return res.status(401).json({ error: msg });
}

function forbidden(res, msg = 'Forbidden') {
  return res.status(403).json({ error: msg });
}

function badRequest(res, msg = 'Bad Request') {
  return res.status(400).json({ error: msg });
}

module.exports = {
  verifyGoogleToken,
  isAdmin,
  createServiceClient,
  unauthorized,
  forbidden,
  badRequest,
};
