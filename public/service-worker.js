/**
 * Service Worker for BeatFlow Media PWA
 * Provides offline capability and faster load times through caching
 * Last updated: 2026-01-03
 */

const CACHE_NAME = 'beatflow-media-v7';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Cache timeouts (in milliseconds)
const CACHE_MAX_AGE = {
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
  static: 24 * 60 * 60 * 1000,      // 1 day
  js: 1 * 60 * 60 * 1000,            // 1 hour
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => {
          console.log('[Service Worker] Cache addAll error:', err);
        });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Determine cache strategy based on request type
function getCacheStrategy(url) {
  const pathname = url.pathname;

  // Images: cache-first with 7 day expiration
  if (pathname.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
    return 'cache-first';
  }

  // JavaScript and CSS: network-first (ensure fresh code)
  if (pathname.match(/\.(js|css)$/i)) {
    return 'network-first';
  }

  // HTML pages: network-first
  if (pathname === '/' || pathname.endsWith('.html')) {
    return 'network-first';
  }

  // Default: stale-while-revalidate
  return 'stale-while-revalidate';
}

// Fetch event - use strategy based on resource type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (except WebP images)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Firebase, Firestore, and API requests
  if (url.pathname.includes('/firestore') ||
      url.pathname.includes('/api/') ||
      url.pathname.includes('/.netlify/')) {
    return;
  }

  const strategy = getCacheStrategy(url);

  if (strategy === 'cache-first') {
    // Cache-first: good for images
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  } else if (strategy === 'network-first') {
    // Network-first: good for JS/CSS/HTML to ensure fresh code
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for documents
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
        })
    );
  } else {
    // Stale-while-revalidate: default strategy
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Clone before using the response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
