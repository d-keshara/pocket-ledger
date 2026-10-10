/* Service worker: lets Pocket Ledger open with no internet.
 *
 * Strategy "stale-while-revalidate":
 *   1. Answer every request from the cache straight away (fast, works offline).
 *   2. At the same time, fetch a fresh copy from the network and update the cache.
 *   So after you publish an update, users get it on their NEXT open.
 *
 * Bump CACHE_VERSION whenever you add or rename files in APP_FILES.
 */
const CACHE_VERSION = 'v2';
const CACHE_NAME = `pocket-ledger-${CACHE_VERSION}`;
const APP_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// install: runs once when a new service worker is found. Download the app files.
self.addEventListener('install', (event) => {
  // cache: 'reload' = download from the server, never from the browser's HTTP cache.
  const requests = APP_FILES.map((url) => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(requests)));
  self.skipWaiting();
});

// activate: delete caches from older versions so they don't pile up.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith('pocket-ledger-') && k !== CACHE_NAME).map((k) => caches.delete(k)),
    )).then(() => self.clients.claim()),
  );
});

// fetch: runs for every file the page asks for.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      // Build a new request from the URL: browsers refuse extra options on page-navigation requests.
      // cache: 'no-cache' = ask the server if the file changed, skip the browser's 10-minute HTTP cache.
      const fresh = fetch(new Request(event.request.url, { cache: 'no-cache' }))
        .then((res) => { if (res.ok) cache.put(event.request, res.clone()); return res; })
        .catch(() => cached); // offline: fall back to the cached copy
      return cached || fresh;
    }),
  );
});
