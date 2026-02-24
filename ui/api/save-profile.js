const { verifyGoogleToken, createServiceClient, unauthorized } = require('./_lib/auth');
const { CURRENT_TOURNAMENT } = require('./_lib/tournament');

/**
 * POST /api/save-profile
 *
 * Authenticated user profile save. Verifies Google token,
 * saves user profile and ensures leaderboard entry exists.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyGoogleToken(req);
  if (!user) return unauthorized(res, 'Invalid or expired token');

  const sb = createServiceClient();

  try {
    const displayName = user.name || `User ${user.userId.substring(0, 8)}`;

    // Upsert user profile
    const { error: userErr } = await sb
      .from('users')
      .upsert({
        user_id: user.userId,
        email: user.email || null,
        display_name: displayName,
        avatar_url: req.body.avatar || null,
        last_sign_in: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (userErr) {
      console.warn('[save-profile] Failed to save user:', userErr.message);
    }

    // Ensure leaderboard entry exists (insert only, never overwrite scores)
    await sb
      .from('leaderboard')
      .upsert({
        event_id: CURRENT_TOURNAMENT.id,
        user_id: user.userId,
        display_name: displayName,
        total_score: 0,
        matches_played: 0,
        last_match_score: 0,
      }, { onConflict: 'event_id,user_id', ignoreDuplicates: true });

    // Always update display name for existing entries
    await sb
      .from('leaderboard')
      .update({ display_name: displayName })
      .eq('user_id', user.userId);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
