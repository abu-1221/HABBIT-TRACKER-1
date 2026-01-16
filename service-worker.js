// Service Worker for AI-POS - Enhanced Offline Support
const CACHE_NAME = 'ai-pos-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './components.css',
  './components2.css',
  './mobile.css',
  './mobile-responsive.css',
  './auth.css',
  './app.js',
  './modules/storage.js',
  './modules/ai-engine.js',
  './modules/tasks.js',
  './modules/focus.js',
  './modules/habits.js',
  './modules/analytics.js',
  './modules/assistant.js',
  './modules/mood.js',
  './modules/notifications.js',
  './modules/auth.js',
  './modules/auth-ui.js',
  './modules/security.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch from cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Update Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const data = event.notification.data || {};
  
  if (event.action === 'complete') {
    // Mark habit or task as complete
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) {
          const client = clientList[0];
          client.postMessage({
            type: 'COMPLETE_ITEM',
            itemType: data.type,
            itemId: data.id
          });
          client.focus();
        } else {
          clients.openWindow('/');
        }
      })
    );
  } else {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        if (clientList.length > 0) {
          clientList[0].focus();
        } else {
          clients.openWindow('/');
        }
      })
    );
  }
});

// Handle push notifications (for future web push feature)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from AI-POS',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification('AI-POS', options)
  );
});
