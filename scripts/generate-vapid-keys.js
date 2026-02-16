const path = require('path');
const webpush = require(path.join(__dirname, '..', 'ui', 'node_modules', 'web-push'));

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== VAPID Keys Generated ===');
console.log('');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('');
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('');
console.log('VAPID_SUBJECT=mailto:fantasyarena@example.com');
console.log('');
console.log('Add to Vercel env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT');
console.log('Add to ui/.env: REACT_APP_VAPID_PUBLIC_KEY=<public key above>');
