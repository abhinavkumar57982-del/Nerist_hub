// sw.js - Service Worker for NERIST Campus Hub
const CACHE_NAME = 'nerist-hub-v1';
const API_CACHE_NAME = 'nerist-api-v1';
const STATIC_CACHE_NAME = 'nerist-static-v1';

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/lost.html',
  '/found.html',
  '/marketplace.html',
  '/buy-requests.html',
  '/rentals.html',
  '/map.html',
  '/teachers.html',
  '/questionpaper.html',
  '/upload-paper.html',
  '/timetable.html',
  '/manual.html',
  '/login.html',
  '/style.css',
  '/notifications.css',
  '/app.js',
  '/auth.js',
  '/notifications.js',
  '/marketplace.js',
  '/buy-requests.js',
  '/questionpaper.js',
  '/app-rentals.js',
  '/pwa.js',
  '/feviconicon.png',
  '/manifest.json',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-128x128.png',
  '/images/icon-144x144.png',
  '/images/icon-152x152.png',
  '/images/icon-192x192.png',
  '/images/icon-384x384.png',
  '/images/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
  console.log('📦 Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('🔧 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip for socket.io
  if (url.pathname.includes('/socket.io/')) {
    return;
  }
  
  // API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(API_CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Static assets
  if (event.request.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => cachedResponse || fetch(event.request))
    );
    return;
  }
  
  // HTML pages
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }
  
  event.respondWith(fetch(event.request));
});

// Push notifications
self.addEventListener('push', event => {
  console.log('📨 Push notification received');
  
  let notificationData = {
    title: 'NERIST Campus Hub',
    body: 'You have a new notification',
    icon: '/feviconicon.png',
    badge: '/images/icon-72x72.png',
    data: { url: '/' }
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
