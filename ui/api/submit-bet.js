const { verifyGoogleToken, createServiceClient, unauthorized, badRequest } = require('./_lib/auth');

/**
 * POST /api/submit-bet
 *
 * Authenticated bet submission. Verifies Google token,
 * extracts user identity from the verified token (NOT from request body),
 * checks match is OPEN and lock_time hasn't passed,
 * then upserts the bet using service_role key.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify user identity
  const user = await verifyGoogleToken(req);
  if (!user) return unauthorized(res, 'Invalid or expired token');

  const { matchId, answers, playerPicks, runnerPicks, sideBetAnswers, version } = req.body;
  if (!matchId) return badRequest(res, 'matchId is required');

  const sb = createServiceClient();

  try {
    // Verify match is OPEN and within lock_time
    const { data: config, error: configErr } = await sb
      .from('match_config')
      .select('status, lock_time')
      .eq('match_id', matchId)
      .single();

    if (configErr || !config) {
      return badRequest(res, 'Match not found');
    }

    if (config.status !== 'OPEN') {
      return res.status(403).json({ error: 'Betting is closed for this match' });
    }

    if (new Date(config.lock_time) <= new Date()) {
      return res.status(403).json({ error: 'Lock time has passed for this match' });
    }

    // Build bet data — user ID comes from verified token, NOT request body
    const now = new Date().toISOString();
    const betId = `bet_${user.userId}_${matchId}`;

    const betData = {
      bet_id: betId,
      user_id: user.userId,
      match_id: matchId,
      submitted_at: now,
      is_locked: false,
      score: null,
    };

    // Support both V1 (answers only) and V2 (answers + picks + side bets)
    if (version === 'v1' || (!playerPicks && !sideBetAnswers)) {
      betData.answers = answers || {};
    } else {
      betData.answers = answers || {};
      betData.player_picks = playerPicks || [];
      betData.runner_picks = runnerPicks || [];
      betData.side_bet_answers = sideBetAnswers || {};
    }

    const { data, error } = await sb
      .from('bets')
      .upsert(betData, { onConflict: 'bet_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
