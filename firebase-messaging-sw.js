// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración de Firebase (se cargará dinámicamente)
let firebaseConfig = null;

// Cargar configuración de Firebase
async function loadFirebaseConfig() {
  try {
    const response = await fetch('/firebase-config.json');
    firebaseConfig = await response.json();
    
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Inicializar Messaging
    const messaging = firebase.messaging();
    
    // Manejar mensajes en segundo plano
    messaging.onBackgroundMessage((payload) => {
      console.log('Mensaje en segundo plano recibido:', payload);
      
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        tag: 'task-notification',
        data: payload.data,
        actions: [
          {
            action: 'view',
            title: '👁️ Ver tareas',
            icon: '/icons/icon-72x72.svg'
          },
          {
            action: 'close',
            title: '✖️ Cerrar',
            icon: '/icons/icon-72x72.svg'
          }
        ],
        requireInteraction: true,
        vibrate: [200, 100, 200]
      };
      
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
  } catch (error) {
    console.error('Error cargando configuración de Firebase:', error);
  }
}

// Cargar configuración al iniciar
loadFirebaseConfig();

// === CACHE MANAGEMENT (mantener funcionalidad existente) ===

const CACHE_NAME = 'mi-pwa-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './firebase-config.json',
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

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('Notificación clickeada:', event);
  
  const notification = event.notification;
  const action = event.action;
  
  notification.close();
  
  if (action === 'close') {
    return;
  }
  
  // Abrir o enfocar la aplicación
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Buscar si ya hay una ventana abierta
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', event => {
  console.log('Notificación cerrada:', event);
});

// Manejar mensajes desde la aplicación
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});