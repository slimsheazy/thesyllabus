
const CACHE_NAME = 'syllabus-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // For this dynamic esoteric app, we prioritize the network to get fresh data/modules,
  // falling back to cache if offline (Network First strategy for documents).
  // Ideally, static assets would use Stale-While-Revalidate, but a simple Network-First 
  // ensures the app doesn't break during development iterations.
  
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Optional: Dynamically cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response because it's a stream and can only be consumed once
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
           // We might not want to cache everything indiscriminately in dev, 
           // but this is standard PWA behavior.
           // cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
