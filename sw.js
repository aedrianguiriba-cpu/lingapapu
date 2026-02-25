// LingapApu Senior PWA — Service Worker
// Caches all static assets for offline use

const CACHE_NAME = 'lingapapu-senior-v3';

// Core assets to pre-cache on install
const PRECACHE = [
  './senior-mobile.php',
  './senior-manifest.webmanifest',
  './assets/supabase-config.js',
  './assets/db.js',
  './assets/style.css',
  './assets/pics/logo.png',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/dist/umd/supabase.js'
];

// ── Install: pre-cache all static assets ─────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use individual adds so one bad URL doesn't fail the whole batch
      return Promise.allSettled(PRECACHE.map(url => cache.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for API, cache-first for assets ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin Supabase API calls (need live network)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // If offline and no cache — return the app shell for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./senior-mobile.php');
        }
      });
    })
  );
});

// ── Background Sync: queue failed transactions ────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_TRANSACTIONS' }));
      })
    );
  }
});
