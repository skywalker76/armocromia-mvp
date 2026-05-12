/**
 * Service Worker — Armocromia PWA
 *
 * Strategia cache:
 * - Static assets (HTML, CSS, JS, fonts): Cache-first
 * - API calls (auth, dossier): Network-first
 * - Images: Cache-first con fallback network
 */

const CACHE_NAME = "armocromia-v2";
const DOSSIER_CACHE = "armocromia-dossier-v1";

const STATIC_ASSETS = [
  "/",
  "/auth/login",
  "/dashboard",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html"
];

// Install: pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DOSSIER_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: specialized strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // 1. API Dossier / Images: Network-first, fallback to DOSSIER_CACHE
  if (url.pathname.startsWith("/api/dossier") || url.pathname.includes("supabase.co/storage")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DOSSIER_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 2. Demo Images (static): Cache-first
  if (url.pathname.startsWith("/demo/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      }))
    );
    return;
  }

  // 3. HTML Navigation: Network-first, fallback to offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // 4. Everything else (JS/CSS/Fonts): Cache-first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Ignore other failures
        return new Response('', { status: 408, statusText: 'Request timeout' });
      });
    })
  );
});
