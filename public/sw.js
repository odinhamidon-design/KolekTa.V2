/**
 * Kolek-Ta Service Worker
 * Enables offline functionality for drivers
 */

const CACHE_VERSION = 1770601574760;
const STATIC_CACHE = `kolekta-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `kolekta-dynamic-v${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/index.html',
  '/login.html',
  '/app.js',
  '/js/fetch-retry.js',
  '/js/app-state.js',
  '/js/utils.js',
  '/js/table-utils.js',
  '/js/offline-sync.js',
  '/js/offline-db.js',
  '/js/sync-manager.js',
  '/js/map-core.js',
  '/js/auth.js',
  '/js/admin-users.js',
  '/js/admin-trucks.js',
  '/js/admin-routes.js',
  '/js/admin-fuel.js',
  '/js/admin-complaints.js',
  '/js/admin-schedules.js',
  '/js/admin-reports.js',
  '/js/admin-analytics.js',
  '/js/gps-tracking.js',
  '/js/driver-dashboard.js',
  '/js/driver-routes.js',
  '/js/live-tracking.js',
  '/js/notifications-history.js',
  '/js/app-init.js',
  '/manifest.json',
  // Vendor libraries (locally hosted)
  '/vendor/tailwindcss/tailwind.min.js',
  '/vendor/lucide/lucide.min.js',
  '/vendor/leaflet/leaflet.css',
  '/vendor/leaflet/leaflet.js',
  '/vendor/leaflet-routing-machine/leaflet-routing-machine.css',
  '/vendor/leaflet-routing-machine/leaflet-routing-machine.js',
  '/vendor/leaflet-heat/leaflet-heat.js',
  '/vendor/jspdf/jspdf.umd.min.js',
  '/vendor/jspdf/jspdf.plugin.autotable.min.js',
  '/vendor/chartjs/chart.umd.js',
  '/vendor/fonts/inter.css'
];

// CDN assets to cache (no longer used - all vendor libs are local)
const CDN_ASSETS = [];

// API endpoints to cache for offline access
const CACHEABLE_API = [
  '/api/routes',
  '/api/trucks'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          console.warn('[SW] Some static assets failed to cache:', err);
        });
      }),
      // Cache CDN assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching CDN assets');
        return Promise.all(
          CDN_ASSETS.map(url => {
            return fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(err => console.warn('[SW] Failed to cache CDN:', url, err));
          })
        );
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }

  // Handle map tiles - cache with stale-while-revalidate
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(handleMapTile(event.request));
    return;
  }

  // Handle CDN requests
  if (url.hostname !== location.hostname) {
    event.respondWith(handleCDNRequest(event.request));
    return;
  }

  // Handle static assets - cache first
  event.respondWith(handleStaticRequest(event.request));
});

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cached response immediately
    // Also update cache in background (stale-while-revalidate)
    updateCacheInBackground(request);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Fetch failed, returning offline page:', error);

    // Return cached index.html for navigation requests
    if (request.mode === 'navigate') {
      const cachedIndex = await caches.match('/index.html');
      if (cachedIndex) return cachedIndex;
    }

    // Return a simple offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Handle CDN requests
async function handleCDNRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request, { mode: 'cors' });

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] CDN fetch failed:', request.url);
    return new Response('', { status: 503 });
  }
}

// Handle API requests with network-first, cache fallback
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_API.some(path => url.pathname.startsWith(path));

  try {
    const networkResponse = await fetch(request);

    // Cache successful GET responses for cacheable endpoints
    if (networkResponse.ok && isCacheable) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached API response:', url.pathname);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] API request failed, checking cache:', url.pathname);

    // Try to return cached response
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Returning cached API response for:', url.pathname);
      // Add header to indicate this is cached data
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cached-At', cachedResponse.headers.get('date') || 'unknown');

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }

    // Return error response if no cache available
    return new Response(JSON.stringify({
      error: 'Offline - no cached data available',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle map tiles with cache-first, then network
async function handleMapTile(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cached tile immediately
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the tile
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return a placeholder for missing tiles
    console.log('[SW] Map tile fetch failed');
    return new Response('', { status: 404 });
  }
}

// Update cache in background (stale-while-revalidate)
async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response);
    }
  } catch (error) {
    // Ignore network errors in background update
  }
}

// Handle messages from the main thread
self.addEventListener('message', event => {
  console.log('[SW] Received message:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }

  if (event.data.type === 'CACHE_API_RESPONSE') {
    // Cache a specific API response
    const { url, data } = event.data;
    caches.open(DYNAMIC_CACHE).then(cache => {
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put(url, response);
      console.log('[SW] Cached API response via message:', url);
    });
  }
});

// Background sync for queued GPS updates
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-gps') {
    event.waitUntil(syncGPSData());
  }

  if (event.tag === 'sync-completions') {
    event.waitUntil(syncCompletions());
  }
});

// Sync queued GPS data when back online
async function syncGPSData() {
  console.log('[SW] Syncing GPS data...');
  // This will be handled by the sync-manager.js in the main thread
  // Just notify the clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_GPS_QUEUE' });
  });
}

// Sync queued completions when back online
async function syncCompletions() {
  console.log('[SW] Syncing completions...');
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETIONS_QUEUE' });
  });
}

console.log('[SW] Service Worker loaded');
