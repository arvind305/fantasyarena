const { verifyGoogleToken, createServiceClient, unauthorized, badRequest } = require('./_lib/auth');

/**
 * POST /api/push
 *
 * Manage push notification subscriptions.
 * Body: { action: 'subscribe' | 'unsubscribe', endpoint, p256dh?, auth? }
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyGoogleToken(req);
  if (!user) return unauthorized(res, 'Invalid or expired token');

  const { action, endpoint, p256dh, auth } = req.body;
  if (!endpoint) return badRequest(res, 'endpoint is required');

  const sb = createServiceClient();

  try {
    if (action === 'subscribe') {
      if (!p256dh || !auth) return badRequest(res, 'p256dh and auth are required for subscribe');
      const { error } = await sb
        .from('push_subscriptions')
        .upsert({ user_id: user.userId, endpoint, p256dh, auth }, { onConflict: 'endpoint' });
      if (error) throw new Error(error.message);
    } else if (action === 'unsubscribe') {
      const { error } = await sb
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint)
        .eq('user_id', user.userId);
      if (error) throw new Error(error.message);
    } else {
      return badRequest(res, 'action must be "subscribe" or "unsubscribe"');
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
