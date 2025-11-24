// Estado de la aplicación
let tasks = [];
let taskIdCounter = 0;

// Referencias a elementos del DOM
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const completedCount = document.getElementById('completedCount');
const emptyState = document.getElementById('emptyState');
const installBtn = document.getElementById('installBtn');
const notificationBtn = document.getElementById('notificationBtn');
const webPushBtn = document.getElementById('webPushBtn');
const reminderBtn = document.getElementById('reminderBtn');
const iosInfo = document.getElementById('iosInfo');

// Variables para PWA
let deferredPrompt;
let OneSignal = null;
let notificationPermission = false;
let isOneSignalReady = false;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    loadTasks();
    updateStats();
    updateDisplay();
    
    // Esperar a que OneSignal esté listo
    await waitForOneSignal();
    await initializeNotifications();
    
    // Event listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // PWA Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: beforeinstallprompt disparado');
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'inline-block';
    });
    
    installBtn.addEventListener('click', installPWA);
    notificationBtn.addEventListener('click', requestNotificationPermission);
    
    // Event listener para Web Push
    if (webPushBtn) {
        webPushBtn.addEventListener('click', async () => {
            try {
                await subscribeToWebPush();
                showNotification('🚀 Web Push activado exitosamente (compatible con iOS)');
                webPushBtn.textContent = '✅ Web Push Activo';
                webPushBtn.disabled = true;
            } catch (error) {
                console.error('Error activando Web Push:', error);
                showNotification(`❌ Error activando Web Push: ${error.message}`);
            }
        });
    }
    
    // Mostrar opciones específicas para iOS y navegadores compatibles
    if (isIOS() || checkWebPushSupport()) {
        iosInfo.style.display = 'block';
        if (webPushBtn) webPushBtn.style.display = 'inline-block';
        
        if (isIOS()) {
            reminderBtn.style.display = 'inline-block';
            reminderBtn.addEventListener('click', createIOSReminder);
        }
    }
    
    // Detectar si ya está instalada
    window.addEventListener('appinstalled', () => {
        console.log('PWA: App instalada');
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });
});

// Función para añadir tarea
async function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        taskInput.focus();
        return;
    }
    
    const newTask = {
        id: ++taskIdCounter,
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    updateStats();
    updateDisplay();
    
    // Limpiar input
    taskInput.value = '';
    taskInput.focus();
    
    // Feedback visual y notificación push
    showNotification('✅ Tarea añadida exitosamente');
    
    // Enviar notificación usando el sistema unificado (Web Push + OneSignal + Local)
    await sendUnifiedNotification(
        `📝 Nueva tarea creada`,
        `"${taskText}" - Tu tarea ha sido añadida exitosamente`
    );
}

// Función para eliminar tarea
function deleteTask(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        updateStats();
        updateDisplay();
        showNotification('🗑️ Tarea eliminada');
    }
}

// Función para alternar estado de tarea
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        updateStats();
        updateDisplay();
        
        if (task.completed) {
            showNotification('🎉 ¡Tarea completada!');
        }
    }
}

// Actualizar estadísticas
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    taskCount.textContent = `${total} ${total === 1 ? 'tarea' : 'tareas'}`;
    completedCount.textContent = `${completed} ${completed === 1 ? 'completada' : 'completadas'}`;
}

// Actualizar display de tareas
function updateDisplay() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    // Ordenar tareas (incompletas primero)
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.completed - b.completed;
    });
    
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

// Crear elemento de tarea
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
            ${task.completed ? '✓' : ''}
        </div>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="task-delete" onclick="deleteTask(${task.id})">
            🗑️ Eliminar
        </button>
    `;
    
    return li;
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Guardar tareas en localStorage
function saveTasks() {
    try {
        localStorage.setItem('pwa-tasks', JSON.stringify(tasks));
        localStorage.setItem('pwa-task-counter', taskIdCounter.toString());
    } catch (error) {
        console.error('Error guardando tareas:', error);
        showNotification('❌ Error guardando datos');
    }
}

// Cargar tareas desde localStorage
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem('pwa-tasks');
        const savedCounter = localStorage.getItem('pwa-task-counter');
        
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
        
        if (savedCounter) {
            taskIdCounter = parseInt(savedCounter, 10);
        }
        
        // Migración de datos antiguos si es necesario
        tasks.forEach(task => {
            if (!task.createdAt) {
                task.createdAt = new Date().toISOString();
            }
        });
        
    } catch (error) {
        console.error('Error cargando tareas:', error);
        tasks = [];
        taskIdCounter = 0;
        showNotification('❌ Error cargando datos');
    }
}

// Instalar PWA
async function installPWA() {
    if (!deferredPrompt) {
        showNotification('ℹ️ La instalación no está disponible');
        return;
    }
    
    try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        console.log('PWA: Resultado de instalación:', result);
        
        if (result.outcome === 'accepted') {
            showNotification('📱 ¡App instalada exitosamente!');
        } else {
            showNotification('ℹ️ Instalación cancelada');
        }
        
        deferredPrompt = null;
        installBtn.style.display = 'none';
        
    } catch (error) {
        console.error('Error durante la instalación:', error);
        showNotification('❌ Error durante la instalación');
    }
}

// Sistema de notificaciones
function showNotification(message, duration = 3000) {
    // Remover notificación existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 1000;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animación de salida
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// === SISTEMA DE NOTIFICACIONES ONESIGNAL ===

// Esperar a que OneSignal esté disponible
async function waitForOneSignal() {
    return new Promise((resolve) => {
        const checkOneSignal = () => {
            if (window.OneSignalInstance && window.isOneSignalReady) {
                OneSignal = window.OneSignalInstance;
                isOneSignalReady = true;
                console.log('OneSignal está listo para usar');
                resolve();
            } else {
                console.log('Esperando a OneSignal...');
                setTimeout(checkOneSignal, 100);
            }
        };
        checkOneSignal();
    });
}

// Inicializar notificaciones
async function initializeNotifications() {
    // Verificar soporte básico
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Notificaciones no soportadas');
        notificationBtn.style.display = 'none';
        return;
    }
    
    try {
        // Verificar si OneSignal está listo
        if (!isOneSignalReady || !OneSignal) {
            console.log('OneSignal no disponible, usando notificaciones locales');
            updateNotificationButton(false);
            return;
        }
        
        // Verificar estado de suscripción
        const isSubscribed = await OneSignal.isPushNotificationsEnabled();
        
        if (isSubscribed) {
            notificationPermission = true;
            updateNotificationButton(true);
            showNotification('🔔 Notificaciones push ya activadas');
        } else {
            updateNotificationButton(false);
        }
        
        // Listener para cambios de suscripción
        OneSignal.on('subscriptionChange', function(isSubscribed) {
            console.log('Estado de suscripción cambió:', isSubscribed);
            notificationPermission = isSubscribed;
            updateNotificationButton(isSubscribed);
            
            if (isSubscribed) {
                showNotification('🔔 ¡Notificaciones push activadas exitosamente!');
                // Mostrar información de debug
                OneSignal.getUserId().then(function(userId) {
                    console.log('OneSignal User ID:', userId);
                    showNotification(`✅ Registrado en OneSignal. ID: ${userId.substring(0, 8)}...`);
                });
            }
        });
        
    } catch (error) {
        console.error('Error inicializando notificaciones:', error);
        updateNotificationButton(false);
    }
}

// Detectar iOS y ajustar comportamiento
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Solicitar permisos y suscribirse a OneSignal
async function requestNotificationPermission() {
    try {
        // Detectar iOS y mostrar mensaje específico
        if (isIOS()) {
            showNotification('📱 iOS detectado: Notificaciones limitadas a cuando la app está abierta');
            
            // En iOS, usar solo notificaciones locales
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                notificationPermission = true;
                updateNotificationButton(true);
                showNotification('🔔 Notificaciones iOS activadas (solo con app abierta)');
            } else {
                showNotification('❌ Notificaciones denegadas en iOS');
            }
            return;
        }

        if (!isOneSignalReady || !OneSignal) {
            console.log('OneSignal no está listo, usando notificaciones locales');
            // Fallback a notificaciones locales
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                notificationPermission = true;
                updateNotificationButton(true);
                showNotification('🔔 Notificaciones locales activadas');
            } else {
                showNotification('❌ Notificaciones denegadas');
            }
            return;
        }

        console.log('Solicitando permisos de OneSignal...');

        // Verificar permisos actuales
        const currentPermission = await OneSignal.Notifications.permission;
        console.log('Permisos actuales:', currentPermission);
        
        if (currentPermission === 'granted') {
            notificationPermission = true;
            updateNotificationButton(true);
            showNotification('✅ Ya tienes las notificaciones activadas');
            return;
        }

        // Solicitar permisos
        const result = await OneSignal.Notifications.requestPermission();
        console.log('Resultado de permisos:', result);
        
        if (result === 'granted') {
            notificationPermission = true;
            updateNotificationButton(true);
            showNotification('🔔 ¡Notificaciones push activadas exitosamente!');
            
            // Obtener y mostrar User ID
            try {
                const userId = await OneSignal.User.PushSubscription.id;
                if (userId) {
                    console.log('OneSignal User ID:', userId);
                    showNotification(`✅ Registrado en OneSignal. ID: ${userId.substring(0, 8)}...`);
                }
            } catch (idError) {
                console.log('No se pudo obtener User ID:', idError);
            }
        } else {
            updateNotificationButton(false);
            showNotification('🔕 Notificaciones denegadas');
        }
        
    } catch (error) {
        console.error('Error completo solicitando permisos:', error);
        showNotification(`❌ Error: ${error.message}`);
        
        // Fallback a notificaciones locales
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                notificationPermission = true;
                updateNotificationButton(true);
                showNotification('🔔 Notificaciones locales activadas como alternativa');
            }
        } catch (localError) {
            console.error('Error con notificaciones locales:', localError);
            showNotification('❌ No se pueden activar notificaciones');
        }
    }
}

// Enviar notificación OneSignal
async function sendOneSignalNotification(title, message) {
    try {
        if (!isOneSignalReady || !window.OneSignalInstance) {
            console.log('OneSignal no disponible, usando notificación local');
            sendLocalNotification(title, message);
            return;
        }

        const OneSignal = window.OneSignalInstance;

        // Verificar si el usuario está suscrito
        const permission = await OneSignal.Notifications.permission;
        
        if (permission !== 'granted') {
            console.log('Usuario no suscrito, usando notificación local');
            sendLocalNotification(title, message);
            return;
        }

        // Obtener el Player ID (usuario único) - API v16
        const userId = await OneSignal.User.PushSubscription.id;
        
        console.log('Enviando notificación OneSignal v16:', { userId, title, message });

        // Con la nueva API, las notificaciones se manejan automáticamente
        // cuando se envían desde el dashboard de OneSignal o via REST API
        
        // Por ahora mostramos notificación local como confirmación
        sendLocalNotification(title, message);
        console.log('Notificación local enviada como confirmación');
        
    } catch (error) {
        console.error('Error enviando notificación OneSignal:', error);
        sendLocalNotification(title, message);
    }
}

// Notificación local (fallback)
function sendLocalNotification(title, body) {
    if (!notificationPermission || Notification.permission !== 'granted') {
        return;
    }
    
    const options = {
        body: body,
        icon: 'icons/icon-192x192.svg',
        badge: 'icons/icon-72x72.svg',
        tag: 'task-notification',
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: Math.random()
        }
    };
    
    try {
        new Notification(title, options);
        console.log('Notificación local mostrada:', title);
    } catch (error) {
        console.error('Error mostrando notificación local:', error);
    }
}

// Mostrar notificación personalizada en la app
function showCustomNotification(title, body) {
    const customNotif = document.createElement('div');
    customNotif.className = 'custom-notification';
    customNotif.innerHTML = `
        <div class="custom-notification-content">
            <h4>${title}</h4>
            <p>${body}</p>
            <button onclick="this.parentElement.parentElement.remove()">✖</button>
        </div>
    `;
    
    customNotif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #4CAF50;
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(customNotif);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (customNotif.parentNode) {
            customNotif.remove();
        }
    }, 5000);
}

// Crear recordatorio alternativo para iOS
function createIOSReminder() {
    const taskText = taskInput.value.trim();
    
    if (!taskText) {
        showNotification('📝 Escribe una tarea primero para crear un recordatorio');
        taskInput.focus();
        return;
    }
    
    // Crear evento de calendario para iOS
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora después
    
    // Formato de fecha para iOS
    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const calendarUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mi PWA Tareas//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${Date.now()}@mipwa.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:📋 Tarea: ${taskText}
DESCRIPTION:Recordatorio creado desde Mi PWA Tareas
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Recordatorio: ${taskText}
TRIGGER:-PT15M
END:VALARM
END:VEVENT
END:VCALENDAR`;
    
    try {
        // Crear link de descarga
        const link = document.createElement('a');
        link.href = calendarUrl;
        link.download = `tarea-${Date.now()}.ics`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('📅 Archivo de calendario creado. Ábrelo para añadir el recordatorio a iOS');
        
    } catch (error) {
        console.error('Error creando recordatorio:', error);
        showNotification('❌ No se pudo crear el recordatorio automático');
        
        // Fallback: mostrar instrucciones
        alert(`📱 Para crear un recordatorio en iOS:
        
1. Abre la app "Recordatorios"
2. Toca "+" para nueva lista o recordatorio
3. Escribe: "${taskText}"
4. Configura fecha/hora si quieres
5. Guarda el recordatorio

¡Listo! 🎉`);
    }
}
function updateNotificationButton(enabled) {
    if (enabled) {
        notificationBtn.textContent = '🔔 Notificaciones PUSH ON';
        notificationBtn.classList.add('active');
        notificationBtn.disabled = false;
    } else {
        notificationBtn.textContent = '🔔 Activar Notificaciones Push';
        notificationBtn.classList.remove('active');
        notificationBtn.disabled = false;
    }
}

// Funciones de utilidad para debugging
window.debugPWA = {
    clearAllData() {
        localStorage.clear();
        tasks = [];
        taskIdCounter = 0;
        updateStats();
        updateDisplay();
        showNotification('🗑️ Todos los datos eliminados');
    },
    
    addSampleTasks() {
        const sampleTasks = [
            'Hacer la compra del supermercado',
            'Llamar al médico para cita',
            'Terminar el proyecto de trabajo',
            'Hacer ejercicio 30 minutos',
            'Leer 20 páginas del libro'
        ];
        
        sampleTasks.forEach(taskText => {
            const newTask = {
                id: ++taskIdCounter,
                text: taskText,
                completed: Math.random() > 0.7,
                createdAt: new Date().toISOString()
            };
            tasks.push(newTask);
        });
        
        saveTasks();
        updateStats();
        updateDisplay();
        showNotification('📝 Tareas de ejemplo añadidas');
    },
    
    exportData() {
        const data = {
            tasks,
            taskIdCounter,
            exportDate: new Date().toISOString()
        };
        console.log('Datos exportados:', JSON.stringify(data, null, 2));
        return data;
    },
    
    // Funciones de notificaciones para debug
    testNotification() {
        if (fcmToken) {
            sendFirebaseNotification('🗋 Notificación push de prueba', 'Esta es una prueba del sistema FCM');
        } else {
            sendLocalNotification('🗋 Notificación de prueba', 'Esta es una prueba del sistema local');
        }
    },
    
    requestNotifications() {
        requestNotificationPermission();
    },
    
    checkNotificationStatus() {
        console.log('Estado de notificaciones:', {
            supported: 'Notification' in window,
            permission: Notification.permission,
            enabled: notificationPermission,
            fcmToken: fcmToken,
            firebaseReady: !!messaging
        });
    },
    
    getFCMToken() {
        console.log('Token FCM actual:', fcmToken);
        return fcmToken;
    }
};

// === WEB PUSH PROTOCOL ===

// Clave pública VAPID para Web Push
const VAPID_PUBLIC_KEY = 'BO2FX9UNFs438_24zaPhzwSxTGzgxwUdnk9UhdFOgRiyZ6uRF9ag3u0pIzNiP3WGN9G00Rv1TcGOCXV6KC4LNoY';

// Variables para Web Push
let webPushSubscription = null;
let isWebPushSupported = false;

// Verificar soporte de Web Push
function checkWebPushSupport() {
    isWebPushSupported = 'serviceWorker' in navigator && 
                        'PushManager' in window && 
                        'Notification' in window;
    
    console.log('Web Push soportado:', isWebPushSupported);
    return isWebPushSupported;
}

// Convertir clave VAPID a Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Suscribirse a Web Push
async function subscribeToWebPush() {
    try {
        if (!checkWebPushSupport()) {
            throw new Error('Web Push no soportado');
        }

        // Registrar Service Worker si no está registrado
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker no soportado');
        }

        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registrado para Web Push');

        // Esperar a que esté listo
        await navigator.serviceWorker.ready;

        // Verificar permisos de notificación
        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            throw new Error('Permisos de notificación denegados');
        }

        // Suscribirse a push notifications
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        
        webPushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });

        console.log('Suscrito a Web Push:', webPushSubscription);
        
        // Guardar suscripción en localStorage
        localStorage.setItem('webPushSubscription', JSON.stringify(webPushSubscription));
        
        return webPushSubscription;
        
    } catch (error) {
        console.error('Error suscribiendo a Web Push:', error);
        throw error;
    }
}

// Enviar notificación Web Push
async function sendWebPushNotification(title, body, data = {}) {
    try {
        if (!webPushSubscription) {
            // Intentar cargar suscripción guardada
            const saved = localStorage.getItem('webPushSubscription');
            if (saved) {
                webPushSubscription = JSON.parse(saved);
            } else {
                throw new Error('No hay suscripción Web Push');
            }
        }

        const notificationData = {
            title: title,
            body: body,
            icon: './icons/icon-192x192.svg',
            badge: './icons/icon-192x192.svg',
            tag: 'web-push-notification',
            requireInteraction: false,
            data: data,
            timestamp: Date.now()
        };

        // Usar el cliente Web Push para enviar notificación (sin servidor)
        if (window.webPushClient) {
            const result = await window.webPushClient.sendNotification(webPushSubscription, notificationData);
            
            if (result.success) {
                console.log('Notificación Web Push enviada exitosamente via cliente');
                return true;
            } else {
                throw new Error(result.message || 'Error enviando notificación');
            }
        } else {
            throw new Error('Cliente Web Push no disponible');
        }

    } catch (error) {
        console.error('Error enviando Web Push:', error);
        
        // Fallback a notificación local si Web Push falla
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: './icons/icon-192x192.svg',
                tag: 'fallback-notification'
            });
            });
        }
        
        return false;
    }
}

// Inicializar Web Push
async function initializeWebPush() {
    try {
        if (!checkWebPushSupport()) {
            console.log('Web Push no soportado en este navegador');
            return false;
        }

        // Verificar si ya hay una suscripción guardada
        const savedSubscription = localStorage.getItem('webPushSubscription');
        if (savedSubscription) {
            webPushSubscription = JSON.parse(savedSubscription);
            console.log('Suscripción Web Push restaurada');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error inicializando Web Push:', error);
        return false;
    }
}

// Función unificada de notificaciones que usa el mejor método disponible
async function sendUnifiedNotification(title, body) {
    console.log('Enviando notificación unificada:', title, body);
    
    // 1. Intentar Web Push primero (mejor compatibilidad con iOS)
    try {
        if (isWebPushSupported && webPushSubscription) {
            const success = await sendWebPushNotification(title, body);
            if (success) {
                console.log('Notificación enviada via Web Push');
                return;
            }
        }
    } catch (error) {
        console.log('Web Push falló:', error);
    }
    
    // 2. Fallback a OneSignal
    try {
        if (isOneSignalReady && notificationPermission) {
            await sendOneSignalNotification(title, body);
            console.log('Notificación enviada via OneSignal');
            return;
        }
    } catch (error) {
        console.log('OneSignal falló:', error);
    }
    
    // 3. Fallback final a notificación local
    try {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: './icons/icon-192x192.svg',
                tag: 'local-notification'
            });
            console.log('Notificación enviada localmente');
        }
    } catch (error) {
        console.log('Notificación local falló:', error);
    }
}

// Actualizar la función de inicialización para incluir Web Push
const originalInitializeNotifications = initializeNotifications;
initializeNotifications = async function() {
    // Inicializar Web Push primero
    await initializeWebPush();
    
    // Luego inicializar OneSignal
    await originalInitializeNotifications();
    
    console.log('Sistema de notificaciones híbrido inicializado');
};