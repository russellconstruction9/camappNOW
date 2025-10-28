self.addEventListener('install', (event) => {
  // This event is triggered when the service worker is first installed.
  console.log('Service worker: install event in progress.');
  // We can pre-cache assets here if needed.
  // For now, we'll just skip waiting to activate immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // This event is triggered when the service worker is activated.
  console.log('Service worker: activate event in progress.');
  // This is a good place to clean up old caches.
  // Take control of all clients (open tabs) that are in scope.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // This event is triggered for every network request made by the page.
  // A minimal fetch handler is required for the app to be considered installable.
  // This implementation just passes the request through to the network.
  // It does not provide offline functionality.
  event.respondWith(fetch(event.request));
});
