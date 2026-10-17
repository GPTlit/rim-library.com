// QAHWA LIBRARY - Clean Service Worker & Cache Reset
// Purges any obsolete/stale cached assets and unregisters cleanly to prevent blank screens
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.registration.unregister();
    }).catch(() => {})
  );
});
