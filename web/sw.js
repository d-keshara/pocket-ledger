/* Service worker: lets Pocket Ledger open with no internet.
 *
 * Strategy "stale-while-revalidate":
 *   1. Answer every request from the cache straight away (fast, works offline).
 *   2. At the same time, fetch a fresh copy from the network and update the cache.
 *   3. If the fresh copy is a newer version, tell the page, which offers "Refresh".
 *
 * Bump CACHE_VERSION whenever you add or rename files in APP_FILES.
 */
const CACHE_VERSION = 'v3';
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

// Two downloads of the same file are "different versions" when the server's
// fingerprint changed: ETag (GitHub Pages) or Last-Modified (local servers).
const fingerprint = (res) => res.headers.get('etag') || res.headers.get('last-modified');
const isNewer = (cached, fresh) => {
  const a = fingerprint(cached), b = fingerprint(fresh);
  return Boolean(a && b && a !== b);
};

// Tell every open window that new files are ready. The page shows the banner.
async function notifyUpdate() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const w of windows) w.postMessage({ type: 'update-ready' });
}

// fetch: runs for every file the page asks for.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;

  const cachedPromise = caches.open(CACHE_NAME).then((cache) => cache.match(event.request, { ignoreSearch: true }));

  // Build a new request from the URL: browsers refuse extra options on page-navigation requests.
  // cache: 'no-cache' = ask the server if the file changed, skip the browser's 10-minute HTTP cache.
  const freshPromise = fetch(new Request(event.request.url, { cache: 'no-cache' })).then(async (res) => {
    if (res.ok) {
      const cached = await cachedPromise;
      if (cached && isNewer(cached, res)) notifyUpdate();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, res.clone());
    }
    return res;
  });

  // Answer from the cache at once (fast, works offline); use the network only for files never cached.
  event.respondWith(cachedPromise.then((cached) => cached || freshPromise));
  // Keep the service worker alive until the background download is saved,
  // otherwise the phone may stop it halfway. Offline errors are expected here.
  event.waitUntil(freshPromise.catch(() => {}));
});
