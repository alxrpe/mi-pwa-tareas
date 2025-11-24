// Servidor simple para Web Push usando web-push library
// Este archivo se puede usar con Node.js para enviar notificaciones Web Push

const webpush = require('web-push');
const express = require('express');
const cors = require('cors');
const app = express();

// Claves VAPID
const vapidKeys = {
    publicKey: 'BO2FX9UNFs438_24zaPhzwSxTGzgxwUdnk9UhdFOgRiyZ6uRF9ag3u0pIzNiP3WGN9G00Rv1TcGOCXV6KC4LNoY',
    privateKey: 'GBf8OVVy8X0yMirPImzqKT5otR4-DMO6mv3xWwaapDo'
};

// Configurar web-push
webpush.setVapidDetails(
    'mailto:admin@mi-pwa-tareas.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Almacén de suscripciones en memoria (en producción usar base de datos)
let subscriptions = [];

// Endpoint para recibir suscripciones
app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    
    console.log('Nueva suscripción recibida:', subscription);
    
    // Guardar suscripción
    subscriptions.push(subscription);
    
    res.status(201).json({ message: 'Suscripción guardada' });
});

// Endpoint para enviar notificaciones
app.post('/send-web-push', async (req, res) => {
    try {
        const { subscription, notification } = req.body;
        
        console.log('Enviando notificación Web Push:', notification);
        
        const payload = JSON.stringify(notification);
        
        const result = await webpush.sendNotification(subscription, payload);
        
        console.log('Notificación enviada:', result);
        res.status(200).json({ success: true, result });
        
    } catch (error) {
        console.error('Error enviando notificación:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para enviar a todas las suscripciones
app.post('/api/send-to-all', async (req, res) => {
    try {
        const { notification } = req.body;
        const payload = JSON.stringify(notification);
        
        console.log(`Enviando notificación a ${subscriptions.length} suscriptores`);
        
        const promises = subscriptions.map(subscription => 
            webpush.sendNotification(subscription, payload)
                .catch(err => {
                    console.error('Error enviando a suscripción:', err);
                    // Remover suscripciones inválidas
                    const index = subscriptions.indexOf(subscription);
                    if (index > -1) {
                        subscriptions.splice(index, 1);
                    }
                })
        );
        
        await Promise.all(promises);
        
        res.status(200).json({ 
            success: true, 
            sent: subscriptions.length 
        });
        
    } catch (error) {
        console.error('Error enviando notificaciones:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint de estado
app.get('/api/status', (req, res) => {
    res.json({
        subscriptions: subscriptions.length,
        vapidPublicKey: vapidKeys.publicKey
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Web Push corriendo en puerto ${PORT}`);
    console.log(`Suscripciones activas: ${subscriptions.length}`);
});