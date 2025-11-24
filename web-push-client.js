// Cliente-side Web Push handler (sin servidor)
// Esta implementación funciona completamente en el cliente para desarrollo

class WebPushClient {
    constructor() {
        this.subscriptions = JSON.parse(localStorage.getItem('webpush_subscriptions') || '[]');
        this.vapidPublicKey = 'BO2FX9UNFs438_24zaPhzwSxTGzgxwUdnk9UhdFOgRiyZ6uRF9ag3u0pIzNiP3WGN9G00Rv1TcGOCXV6KC4LNoY';
    }

    // Simular envío de notificación Web Push (para desarrollo)
    async sendNotification(subscription, notificationData) {
        try {
            console.log('Simulando envío Web Push:', notificationData);
            
            // En desarrollo, mostrar notificación directamente
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                // Enviar mensaje al Service Worker para mostrar notificación
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    notification: notificationData
                });
                
                return { success: true, message: 'Notificación enviada via Service Worker' };
            } else {
                // Fallback a notificación local
                if (Notification.permission === 'granted') {
                    new Notification(notificationData.title, {
                        body: notificationData.body,
                        icon: notificationData.icon,
                        badge: notificationData.badge,
                        tag: notificationData.tag,
                        requireInteraction: notificationData.requireInteraction,
                        silent: notificationData.silent,
                        data: notificationData.data
                    });
                    
                    return { success: true, message: 'Notificación local mostrada' };
                }
            }
            
            return { success: false, message: 'No se pueden mostrar notificaciones' };
            
        } catch (error) {
            console.error('Error simulando notificación:', error);
            return { success: false, error: error.message };
        }
    }

    // Guardar suscripción localmente
    saveSubscription(subscription) {
        this.subscriptions.push(subscription);
        localStorage.setItem('webpush_subscriptions', JSON.stringify(this.subscriptions));
        console.log('Suscripción guardada localmente');
    }

    // Obtener todas las suscripciones
    getSubscriptions() {
        return this.subscriptions;
    }

    // Limpiar suscripciones
    clearSubscriptions() {
        this.subscriptions = [];
        localStorage.removeItem('webpush_subscriptions');
    }
}

// Instancia global para usar en la aplicación
window.webPushClient = new WebPushClient();