// Super Selector — Push Notification Service Worker
// No caching logic — purely push handling

self.addEventListener('push', function(event) {
  let data = { title: 'Super Selector', body: 'You have a new notification!', url: '/play' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.warn('[SW] Failed to parse push data:', e);
  }

  const options = {
    body: data.body || '',
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/play' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Super Selector', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/play';

  event.waitUntil(
    clients.openWindow(url)
  );
});
