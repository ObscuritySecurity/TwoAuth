// A simple, no-op service worker that takes control of the page and allows the app to be installed.
// This is a placeholder that you can extend to add more robust caching strategies.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Skip waiting to activate the new service worker immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Take control of all clients as soon as the service worker is activated.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple "network-first" caching strategy.
  // You can customize this to be "cache-first" or use more complex strategies.
  event.respondWith(
    fetch(event.request).catch(() => {
      // If the network fails, you could try to serve from a cache here.
      // For this basic setup, we just let the browser's default offline page show.
      return new Response(
        'You are offline. Please check your internet connection.',
        { headers: { 'Content-Type': 'text/plain' } }
      );
    })
  );
});
