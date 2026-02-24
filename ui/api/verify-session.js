const { verifyGoogleToken, isAdmin } = require('./_lib/auth');

/**
 * POST /api/verify-session
 *
 * Verifies a Google OAuth token and returns user info + admin status.
 * Called on page load to validate stored credentials.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyGoogleToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  return res.status(200).json({
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
    },
    isAdmin: isAdmin(user.email),
  });
};
