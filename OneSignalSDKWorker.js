// OneSignal Service Worker para notificaciones push
importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// Manejar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon, badge, tag, data, actions, requireInteraction, vibrate } = event.data;
        
        const notificationOptions = {
            body: body,
            icon: icon || '/mi-pwa-tareas/icons/icon-192x192.svg',
            badge: badge || '/mi-pwa-tareas/icons/icon-72x72.svg',
            tag: tag || 'pwa-notification',
            data: data || {},
            actions: actions || [],
            requireInteraction: requireInteraction || false,
            vibrate: vibrate || [200, 100, 200],
            silent: false,
            renotify: true
        };
        
        // Mostrar notificación del sistema
        self.registration.showNotification(title, notificationOptions)
            .then(() => {
                console.log('Notificación del sistema mostrada:', title);
            })
            .catch((error) => {
                console.error('Error mostrando notificación del sistema:', error);
            });
    }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('Notificación del sistema clickeada:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    // Abrir o enfocar la aplicación
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Buscar si ya hay una ventana abierta
                for (const client of clientList) {
                    if (client.url.includes('mi-pwa-tareas') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Si no hay ventana abierta, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow('/mi-pwa-tareas/');
                }
            })
    );
});