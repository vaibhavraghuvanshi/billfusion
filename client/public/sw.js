const CACHE_NAME = 'invoiceflow-v1';
const STATIC_CACHE_NAME = 'invoiceflow-static-v1';
const API_CACHE_NAME = 'invoiceflow-api-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// API endpoints that can be cached
const CACHEABLE_APIS = [
  '/api/user',
  '/api/clients',
  '/api/invoices',
  '/api/analytics'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Default: network first, then cache
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isReadOperation = request.method === 'GET';
  
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (networkResponse.ok && isReadOperation && 
        CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request:', url.pathname);
    
    // For GET requests, try to serve from cache
    if (isReadOperation) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[SW] Serving API from cache:', url.pathname);
        return cachedResponse;
      }
    }
    
    // For write operations when offline, store in IndexedDB for background sync
    if (!isReadOperation) {
      await storeOfflineRequest(request);
      return new Response(
        JSON.stringify({ 
          success: true, 
          offline: true, 
          message: 'Request saved for when you\'re back online' 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Return offline page or error response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        offline: true 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline fallback if available
    if (request.destination === 'document') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    
    throw error;
  }
}

// Store offline requests for background sync
async function storeOfflineRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: [...request.headers.entries()],
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    };
    
    // Store in IndexedDB
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-requests'], 'readwrite');
    const store = transaction.objectStore('offline-requests');
    await store.add(requestData);
    
    console.log('[SW] Stored offline request:', request.url);
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('background-sync');
    }
  } catch (error) {
    console.error('[SW] Failed to store offline request:', error);
  }
}

// Open IndexedDB for offline storage
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('InvoiceFlowOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline-requests')) {
        const store = db.createObjectStore('offline-requests', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('offline-invoices')) {
        const store = db.createObjectStore('offline-invoices', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Sync offline requests when back online
async function syncOfflineRequests() {
  try {
    console.log('[SW] Starting background sync');
    
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-requests'], 'readonly');
    const store = transaction.objectStore('offline-requests');
    const requests = await getAllFromStore(store);
    
    for (const requestData of requests) {
      try {
        const { url, method, headers, body } = requestData;
        
        const fetchOptions = {
          method,
          headers: new Headers(headers),
        };
        
        if (body && method !== 'GET') {
          fetchOptions.body = body;
        }
        
        const response = await fetch(url, fetchOptions);
        
        if (response.ok) {
          // Remove successful request from offline storage
          const deleteTransaction = db.transaction(['offline-requests'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('offline-requests');
          await deleteStore.delete(requestData.id);
          
          console.log('[SW] Successfully synced offline request:', url);
          
          // Notify the main thread about successful sync
          await notifyMainThread({
            type: 'SYNC_SUCCESS',
            data: { url, method }
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync request:', requestData.url, error);
      }
    }
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Helper function to get all records from IndexedDB store
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have new invoice updates',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/manifest.json'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/manifest.json'
      }
    ]
  };
  
  if (event.data) {
    const pushData = event.data.json();
    options.body = pushData.body || options.body;
    options.data = { ...options.data, ...pushData.data };
  }
  
  event.waitUntil(
    self.registration.showNotification('InvoiceFlow', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Notification closed
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_INVOICE':
      cacheInvoiceOffline(data);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Cache invoice data for offline access
async function cacheInvoiceOffline(invoiceData) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-invoices'], 'readwrite');
    const store = transaction.objectStore('offline-invoices');
    
    await store.put({
      ...invoiceData,
      timestamp: Date.now(),
      synced: false
    });
    
    console.log('[SW] Invoice cached offline:', invoiceData.id);
  } catch (error) {
    console.error('[SW] Failed to cache invoice offline:', error);
  }
}

// Get cache status
async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const totalSize = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        return keys.length;
      })
    );
    
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-requests', 'offline-invoices'], 'readonly');
    const requestsStore = transaction.objectStore('offline-requests');
    const invoicesStore = transaction.objectStore('offline-invoices');
    
    const offlineRequests = await getAllFromStore(requestsStore);
    const offlineInvoices = await getAllFromStore(invoicesStore);
    
    return {
      caches: cacheNames.length,
      cachedItems: totalSize.reduce((a, b) => a + b, 0),
      offlineRequests: offlineRequests.length,
      offlineInvoices: offlineInvoices.length,
      isOnline: navigator.onLine
    };
  } catch (error) {
    console.error('[SW] Failed to get cache status:', error);
    return { error: error.message };
  }
}

// Notify main thread
async function notifyMainThread(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Periodic sync for invoice reminders (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'invoice-reminders') {
    event.waitUntil(checkInvoiceReminders());
  }
});

// Check for invoice reminders
async function checkInvoiceReminders() {
  try {
    // This would typically fetch overdue invoices from the API
    // and show notifications for payment reminders
    console.log('[SW] Checking invoice reminders');
    
    // Implementation would depend on your specific reminder logic
    // For now, this is a placeholder for the functionality
  } catch (error) {
    console.error('[SW] Failed to check invoice reminders:', error);
  }
}

console.log('[SW] Service Worker loaded');
