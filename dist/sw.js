const CACHE_NAME = 'spofree-shell-v1';
const BASE_URL = new URL('./', self.location.href);
const APP_ROOT = BASE_URL.pathname;
const APP_SHELL = [
  APP_ROOT,
  new URL('manifest.webmanifest', BASE_URL).pathname,
  new URL('ios-logo.png', BASE_URL).pathname
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(
      fetch(request).catch(() => caches.match(APP_ROOT))
    );
    return;
  }

  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => (
        cached ||
        fetch(request).then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          return response;
        })
      ))
    );
  }
});
