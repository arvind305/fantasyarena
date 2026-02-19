/**
 * Send leaderboard update notification to all subscribers.
 * Usage: node scripts/notify-leaderboard.js
 */
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
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
  console.log(`Found ${subs.length} subscriber(s)`);

  const payload = JSON.stringify({
    title: 'Leaderboard Updated!',
    body: 'Check out the latest leaderboard standings',
    url: '/leaderboard',
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
      console.log('Sent to', sub.user_id);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await sb.from('push_subscriptions').delete().eq('id', sub.id);
        console.log('Removed expired subscription for', sub.user_id);
      } else {
        console.error('Failed for', sub.user_id, ':', err.message);
      }
    }
  }
  console.log(`Done. Sent ${sent} notification(s).`);
})();
