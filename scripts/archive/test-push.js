const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env'), quiet: true });

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  'mailto:fantasyarena@example.com',
  'BFVuIPWt3Lhm9GRHQZxTJFz3RkMEuy4O_re4Ag0oKkCcKfCQZ719lnpWawvZioSndyOFewKtK8USCv3nmaHlVJM',
  'Yfv-XZahkXnJzCtV0hjb8b0iTOmS0RcB_1TpogO39pQ'
);

(async () => {
  const { data: subs, error } = await sb.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth');
  if (error) { console.error('Error:', error.message); return; }
  console.log(`Found ${subs.length} subscription(s)`);

  const payload = JSON.stringify({
    title: 'Test Notification',
    body: 'Push notifications are working! You\'ll get match reminders before lock time.',
    url: '/play',
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      console.log('Sent to', sub.user_id);
    } catch (err) {
      console.error('Failed for', sub.user_id, ':', err.message);
    }
  }
})();
