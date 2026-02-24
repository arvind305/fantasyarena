const { verifyGoogleToken, createServiceClient, unauthorized, badRequest } = require('./_lib/auth');

/**
 * POST /api/push-unsubscribe
 *
 * Remove a push notification subscription for the authenticated user.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyGoogleToken(req);
  if (!user) return unauthorized(res, 'Invalid or expired token');

  const { endpoint } = req.body;
  if (!endpoint) {
    return badRequest(res, 'endpoint is required');
  }

  const sb = createServiceClient();

  try {
    const { error } = await sb
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', user.userId);

    if (error) throw new Error(error.message);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
