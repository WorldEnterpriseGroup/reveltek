/**
 * RevelTek service worker — static-cache with offline fallback.
 *
 * Strategy (navigation-safe by design):
 * - Navigations: network-first, then cache, then the cached 404.html
 *   offline fallback. App-shell pages are NEVER served stale-first, so a
 *   new deploy can never trap users on an old page.
 * - Same-origin GET assets (CSS/JS/images/fonts/manifest): cache-first with
 *   lazy runtime caching, network fallback. Versioned cache purged on
 *   activate, so asset updates propagate with the next SW version bump.
 * - Cross-origin requests (Google Fonts, Maps embeds): network-only, never
 *   cached (avoids opaque-response quota burn and stale third-party assets).
 *
 * Bump CACHE_VERSION on any app-shell change to force a clean refresh.
 */
const CACHE_VERSION = 'reveltek-v2';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL = ['/index.html', '/404.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([CACHE_VERSION, RUNTIME_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isNavigation(request) {
  return request.mode === 'navigate';
}

function isCacheableAsset(url) {
  return (
    url.origin === self.location.origin &&
    /^\/(assets|manifest\.webmanifest|apple-touch-icon\.png|favicon)/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigations: network first, never stale-first.
  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match('/404.html').then((fb) => fb || Response.error()),
          ),
        ),
    );
    return;
  }

  // Same-origin static assets: cache-first, lazily populated.
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && (response.ok || response.type === 'opaque')) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
  // Everything else (cross-origin, feeds, sitemaps): network-only, untouched.
});
