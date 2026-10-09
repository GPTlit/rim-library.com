// QAHWA LIBRARY - High-Performance Cache & Offline Service Worker
const CACHE_VERSION = 'qahwa-cache-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGES_CACHE = `${CACHE_VERSION}-images`;
const FONTS_CACHE = `${CACHE_VERSION}-fonts`;

// Critical app shell assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/placeholder.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset fetch failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and internal websocket connections
  if (request.method !== 'GET') return;
  if (url.protocol.startsWith('ws')) return;

  // 1. Google Fonts & Web Fonts: Cache-First
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(FONTS_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // 2. Images & Book Covers (Unsplash, local media, supabase storage): Cache-First with background revalidation
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i) ||
    url.hostname.includes('unsplash.com') ||
    url.pathname.includes('/storage/v1/object/')
  ) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          // Asynchronously revalidate in background if online
          fetch(request).then((networkRes) => {
            if (networkRes.ok) cache.put(request, networkRes);
          }).catch(() => {});
          return cached;
        }

        try {
          const networkRes = await fetch(request);
          if (networkRes.ok) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        } catch {
          return cached || (await caches.match('/placeholder.svg')) || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // 3. Static scripts & stylesheets: Stale-While-Revalidate
  if (url.origin === self.location.origin && (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes.ok) cache.put(request, networkRes.clone());
          return networkRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. HTML Navigation requests: Network-First with Cache fallback for offline SPA routing
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/index.html');
        return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  // Default: Network fetch
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return cached || new Response('Offline', { status: 503 });
    })
  );
});
