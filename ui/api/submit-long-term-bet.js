const { verifyGoogleToken, createServiceClient, unauthorized, badRequest } = require('./_lib/auth');
const { CURRENT_TOURNAMENT } = require('./_lib/tournament');

/**
 * POST /api/submit-long-term-bet
 *
 * Authenticated long-term bet submission.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyGoogleToken(req);
  if (!user) return unauthorized(res, 'Invalid or expired token');

  const { eventId = CURRENT_TOURNAMENT.id, predictions } = req.body;
  if (!predictions) return badRequest(res, 'predictions is required');

  const sb = createServiceClient();

  try {
    // Check if long-term bets are still open
    const { data: config } = await sb
      .from('long_term_bets_config')
      .select('lock_time, is_locked')
      .eq('event_id', eventId)
      .single();

    if (config) {
      if (config.is_locked) {
        return res.status(403).json({ error: 'Long-term betting is locked' });
      }
      if (config.lock_time && new Date(config.lock_time) <= new Date()) {
        return res.status(403).json({ error: 'Long-term betting deadline has passed' });
      }
    }

    const now = new Date().toISOString();

    const { data, error } = await sb
      .from('long_term_bets')
      .upsert({
        event_id: eventId,
        user_id: user.userId,
        winner_team: predictions.winnerTeam || null,
        finalist_teams: predictions.finalistTeams || [],
        final_four_teams: predictions.finalFourTeams || [],
        orange_cap_players: predictions.orangeCapPlayers || [],
        purple_cap_players: predictions.purpleCapPlayers || [],
        updated_at: now,
      }, { onConflict: 'event_id,user_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({ success: true, submittedAt: data.updated_at });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
