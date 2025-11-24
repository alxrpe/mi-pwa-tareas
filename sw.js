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
  console.log('Service Worker recibió mensaje:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Manejar solicitud de mostrar notificación
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const notification = event.data.notification;
    
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || './icons/icon-192x192.svg',
      badge: notification.badge || './icons/icon-192x192.svg',
      tag: notification.tag || 'web-push',
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
      data: notification.data || {},
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: './icons/icon-192x192.svg'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ]
    });
  }
});

// === MANEJO DE NOTIFICACIONES ===

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
  
  // Aquí podríamos enviar estadísticas de engagement
  // trackNotificationInteraction('closed', event.notification.tag);
});

// === WEB PUSH PROTOCOL ===

// Manejar eventos push de Web Push Protocol
self.addEventListener('push', event => {
  console.log('Evento push recibido:', event);
  
  let notificationData = {
    title: 'Mi PWA Tareas',
    body: 'Nueva notificación',
    icon: './icons/icon-192x192.svg',
    badge: './icons/icon-192x192.svg',
    tag: 'default',
    requireInteraction: false,
    silent: false
  };
  
  // Si hay datos en el evento push, usarlos
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (e) {
      console.log('Error parseando datos push:', e);
      // Usar datos por defecto si hay error
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  console.log('Mostrando notificación:', notificationData);
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      data: notificationData.data || {},
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: './icons/icon-192x192.svg'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ]
    })
  );
});

// Manejar errores de suscripción push
self.addEventListener('pushsubscriptionchange', event => {
  console.log('Suscripción push cambió:', event);
  
  event.waitUntil(
    // Resubscribirse automáticamente
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BO2FX9UNFs438_24zaPhzwSxTGzgxwUdnk9UhdFOgRiyZ6uRF9ag3u0pIzNiP3WGN9G00Rv1TcGOCXV6KC4LNoY'
    }).then(subscription => {
      console.log('Resubscrito a push notifications');
      
      // Enviar nueva suscripción al servidor
      return fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
    }).catch(err => {
      console.log('Error resubscribiendo:', err);
    })
  );
});