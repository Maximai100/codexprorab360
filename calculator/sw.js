const CACHE_NAME = 'calculator-cache-v3'; // Updated version for offline mode
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event: opens a cache and adds the core files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Fetch event: implements stale-while-revalidate strategy with offline fallback.
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for esm.sh.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Check if we received a valid response
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            cache.put(event.request, responseToCache);
          }
          return networkResponse;
        }).catch(error => {
          console.error('Fetching failed:', error);
          // If fetch fails and we have a cached response, we can still serve it.
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation requests, return a custom offline page
          if (event.request.mode === 'navigate') {
            return cache.match('/index.html');
          }
          throw error;
        });

        // Return the cached response immediately if it exists, otherwise wait for the network response.
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Activate event: removes old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Push notifications for sync status
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Данные синхронизированы',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Строительный калькулятор', options)
  );
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB
    const offlineData = await getOfflineData();
    if (offlineData && offlineData.length > 0) {
      // Sync with server or localStorage
      await syncWithStorage(offlineData);
      console.log('Offline data synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync offline data:', error);
  }
}

// Helper functions for offline data management
async function getOfflineData() {
  // Implementation would depend on IndexedDB setup
  return [];
}

async function syncWithStorage(data) {
  // Implementation for syncing with localStorage
  return Promise.resolve();
}
