// GambleCodez Service Worker
const CACHE_NAME = 'gamblecodz-v1';
const urlsToCache = [
  '/',
  '/index.php',
  '/css/neon-dark.css',
  '/js/gc-menu-system.js',
  '/js/gc-affiliates.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});