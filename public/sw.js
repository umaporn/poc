// public/sw.js - No Workbox, no precaching issues
const CACHE_NAME = 'pwa-cache-v2';

// Only cache files that we know exist and are important
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
  // Don't include _next files as they change frequently
];

// Install event - minimal caching
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Service Worker: Opened cache');
        
        // Only cache files that actually exist
        const cachePromises = STATIC_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`Cached: ${url}`);
            } else {
              console.warn(`Failed to cache ${url}: ${response.status}`);
            }
          } catch (error) {
            console.warn(`Error caching ${url}:`, error);
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('Service Worker: Caching complete');
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting(); // Take control immediately
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activation complete');
    })
  );
});

// Fetch event - network-first strategy (no aggressive precaching)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension, data:, blob: URLs
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip analytics and external requests that might cause issues
  if (event.request.url.includes('analytics') || 
      event.request.url.includes('wondershare') ||
      event.request.url.includes('google-analytics') ||
      event.request.url.includes('gtm')) {
    return; // Let these requests go through normally
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response.ok && response.status === 200) {
          // Clone the response before caching
          const responseClone = response.clone();
          
          // Cache in background (don't block the response)
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache certain types of files
            const url = new URL(event.request.url);
            if (url.pathname.endsWith('.js') || 
                url.pathname.endsWith('.css') || 
                url.pathname.endsWith('.html') ||
                url.pathname === '/') {
              cache.put(event.request, responseClone);
            }
          }).catch((error) => {
            console.warn('Cache put failed:', error);
          });
        }
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('Serving from cache:', event.request.url);
              return cachedResponse;
            }
            
            // If it's a navigation request and no cache, show offline page
            if (event.request.destination === 'document') {
              return new Response(
                `<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Offline - PWA</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      margin: 0;
                      background: #f5f5f5;
                      color: #333;
                      text-align: center;
                      padding: 20px;
                    }
                    .offline-icon {
                      font-size: 4rem;
                      margin-bottom: 1rem;
                    }
                    h1 {
                      margin: 0 0 1rem 0;
                      color: #666;
                    }
                    button {
                      padding: 12px 24px;
                      background: #007bff;
                      color: white;
                      border: none;
                      border-radius: 6px;
                      cursor: pointer;
                      font-size: 16px;
                      margin-top: 1rem;
                    }
                    button:hover {
                      background: #0056b3;
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-icon">📱</div>
                  <h1>You're offline</h1>
                  <p>Please check your internet connection and try again.</p>
                  <button onclick="window.location.reload()">Retry</button>
                </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html' },
                  status: 200,
                  statusText: 'OK'
                }
              );
            }
            
            // For other requests, throw error
            throw new Error('No network and no cache');
          });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  let notificationData = {
    title: 'PWA Notification',
    body: 'You have a new message',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'push-notification',
    requireInteraction: false,
    data: {
      url: '/'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
      console.log('Push data:', pushData);
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-192x192.png'
        }
      ]
    }
  );

  event.waitUntil(notificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return; // Just close the notification
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window to focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (client.navigate && urlToOpen !== '/') {
              return client.navigate(urlToOpen);
            }
            return client;
          }
        }
        
        // No existing window found, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

// Handle service worker messages
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
  event.preventDefault(); // Prevent the error from bubbling up
});

console.log('Service Worker: Script loaded');