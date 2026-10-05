const CACHE_NAME = 'japon2026-cache-v7-esri-map';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',
  './icon.svg',
  './icon-ios-japan.png',
  './icon-192.png',
  './icon-512.png',
  './offline.html',
  './sw.js',
  './data/places-sample.json',
  './vendor/leaflet.js',
  './vendor/leaflet.css',
  './vendor/images/marker-icon.png',
  './vendor/images/marker-icon-2x.png',
  './vendor/images/marker-shadow.png',
  './vendor/images/layers.png',
  './vendor/images/layers-2x.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  // Para la página principal se intenta primero la red, evitando servir una
  // versión antigua indefinidamente; el resto de recursos mantiene cache-first.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
            return response;
          });
      })
      .catch(() => caches.match('./offline.html'))
  );
});
