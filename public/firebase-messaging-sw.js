importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAHo4YgQEQn9643u1lFKwWZZR7IS5OXNn8',
  authDomain: 'craftycode-mze7r.firebaseapp.com',
  projectId: 'craftycode-mze7r',
  storageBucket: 'craftycode-mze7r.firebasestorage.app',
  messagingSenderId: '160661125374',
  appId: '1:160661125374:web:ea55b23bc3216584210daf',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Liflu';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/img/liflu-icon.png',
    badge: '/img/liflu-icon.png',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
