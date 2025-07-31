// Choose a cache name
const CACHE_NAME = 'twoauth-cache-v1';

// List the files to precache
const PRECACHE_ASSETS = [
  '/',
  '/add',
  '/settings',
  '/trash'
  // Other assets like JS, CSS, and images will be cached dynamically
];

// When the service worker is installed, open the cache and add the precache assets
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Setting {cache: 'reload'} in the new request will ensure that the response
    // isn't fulfilled from the HTTP cache; i.e., it will be from the network.
    await cache.addAll(PRECACHE_ASSETS.map(path => new Request(path, { cache: 'reload' })));
  })());
  self.skipWaiting();
});

// When the service worker is activated, remove any old caches
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.map((name) => {
        if (name !== CACHE_NAME) {
          return caches.delete(name);
        }
      })
    );
    await clients.claim();
  })());
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
      return;
  }
  
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    
    // Try the cache first.
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      // If we found a match in the cache, return it, but also
      // update the entry in the cache in the background.
      event.waitUntil(
        (async () => {
          try {
            const networkResponse = await fetch(event.request);
            await cache.put(event.request, networkResponse.clone());
          } catch (error) {
            // The network is unavailable, so we can't update the cache.
            // This is fine.
            console.log('Network fetch failed, serving from cache.', error);
          }
        })()
      );
      return cachedResponse;
    }

    // If we didn't find a match in the cache, try the network.
    try {
      const networkResponse = await fetch(event.request);
      // If the request is successful, clone the response and store it in the cache.
      if (networkResponse.ok) {
        event.waitUntil(cache.put(event.request, networkResponse.clone()));
      }
      return networkResponse;
    } catch (error) {
      // The network is unavailable.
      console.log('Fetch failed; returning offline page instead.', error);
      // For any other navigation request that fails, you might want to return a generic offline fallback page.
      // For this app, we will just let it fail, as the main pages are precached.
      // For non-navigation requests (images, etc.), this will just result in a failed fetch.
      return new Response('Network error occurred.', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  })());
});
