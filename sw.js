const CACHE_NAME = 'mi-pwa-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192x192.svg',
  './icons/icon-512x512.svg'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalación completa');
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activación completa');
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devolver la versión cacheada
        if (response) {
          console.log('Service Worker: Sirviendo desde cache:', event.request.url);
          return response;
        }

        // Si no está en cache, hacer petición a la red
        console.log('Service Worker: Petición de red:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Verificar que sea una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para guardar en cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla la red y no está en cache, mostrar página offline
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Manejar mensajes desde la aplicación
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});