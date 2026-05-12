const CACHE_NAME = 'armocromia-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for now. Real caching can be added later.
  event.respondWith(fetch(event.request));
});
