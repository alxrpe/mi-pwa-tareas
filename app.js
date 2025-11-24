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
    
    // Inicializar OneSignal y notificaciones
    await initializeOneSignal();
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
    
    // Enviar notificación push real
    if (isOneSignalReady && notificationPermission) {
        await sendOneSignalNotification(`📝 Nueva tarea: "${taskText}"`, 'Tu tarea ha sido añadida exitosamente');
    }
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

// Inicializar OneSignal
async function initializeOneSignal() {
    try {
        // Verificar que OneSignal esté cargado
        if (typeof window.OneSignalDeferred === 'undefined') {
            console.log('OneSignal SDK v16 no está cargado');
            return false;
        }

        // Cargar configuración
        const response = await fetch('./onesignal-config.json');
        const config = await response.json();
        
        // Usar el nuevo método de inicialización de OneSignal v16
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
                appId: config.appId,
                safari_web_id: config.safari_web_id,
                allowLocalhostAsSecureOrigin: true,
                notifyButton: {
                    enable: false // Usamos nuestro propio botón
                }
            });
            
            // Guardar referencia global
            window.OneSignalInstance = OneSignal;
            OneSignal = OneSignal;
            isOneSignalReady = true;
            
            console.log('OneSignal v16 inicializado correctamente');
            
            // Configurar listeners
            OneSignal.Notifications.addEventListener('permissionChange', function(event) {
                console.log('Permisos de notificación cambiaron:', event);
                const isSubscribed = event.permission === 'granted';
                notificationPermission = isSubscribed;
                updateNotificationButton(isSubscribed);
                
                if (isSubscribed) {
                    showNotification('🔔 ¡Notificaciones push activadas exitosamente!');
                    // Mostrar información de debug
                    OneSignal.User.PushSubscription.id.then(function(userId) {
                        if (userId) {
                            console.log('OneSignal User ID:', userId);
                            showNotification(`✅ Registrado en OneSignal. ID: ${userId.substring(0, 8)}...`);
                        }
                    });
                }
            });
        });
        
        isOneSignalReady = true;
        return true;
        
    } catch (error) {
        console.error('Error inicializando OneSignal v16:', error);
        showNotification('⚠️ No se pudieron cargar las notificaciones push');
        return false;
    }
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

// Solicitar permisos y suscribirse a OneSignal
async function requestNotificationPermission() {
    try {
        if (!isOneSignalReady || !window.OneSignalInstance) {
            showNotification('❌ OneSignal no está configurado. Revisa la configuración.');
            return;
        }

        const OneSignal = window.OneSignalInstance;

        // Verificar si ya está suscrito
        const permission = await OneSignal.Notifications.permission;
        
        if (permission === 'granted') {
            showNotification('✅ Ya tienes las notificaciones activadas');
            notificationPermission = true;
            updateNotificationButton(true);
            return;
        }

        // Solicitar permisos de notificación
        const result = await OneSignal.Notifications.requestPermission();
        
        if (result === 'granted') {
            notificationPermission = true;
            updateNotificationButton(true);
            showNotification('🔔 ¡Notificaciones push activadas exitosamente!');
        } else {
            updateNotificationButton(false);
            showNotification('🔕 Notificaciones denegadas. Activa desde configuración del navegador.');
        }
        
    } catch (error) {
        console.error('Error solicitando permisos:', error);
        showNotification('❌ Error activando notificaciones. Intenta desde configuración del navegador.');
        
        // Fallback a notificaciones locales
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationPermission = true;
            updateNotificationButton(true);
            showNotification('🔔 Notificaciones locales activadas como alternativa');
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

// Actualizar estado del botón de notificaciones
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