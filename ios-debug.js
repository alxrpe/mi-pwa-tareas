// Diagnóstico y solución específica para iOS
// Este archivo contiene funciones para diagnosticar problemas en iOS

// Debug para iOS
function debugIOS() {
    console.log('=== DIAGNÓSTICO iOS ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Es iOS:', isIOS());
    console.log('Soporte Web Push:', checkWebPushSupport());
    console.log('Soporte Notifications:', 'Notification' in window);
    console.log('Soporte Service Worker:', 'serviceWorker' in navigator);
    console.log('Soporte Push Manager:', 'PushManager' in window);
    console.log('Permiso actual:', Notification.permission);
    
    // Verificar elementos DOM
    console.log('Elementos DOM:');
    console.log('- taskInput:', !!document.getElementById('taskInput'));
    console.log('- addBtn:', !!document.getElementById('addBtn'));
    console.log('- taskList:', !!document.getElementById('taskList'));
    console.log('- webPushBtn:', !!document.getElementById('webPushBtn'));
    
    // Verificar eventos
    console.log('Event Listeners registrados para addBtn:', getEventListeners ? getEventListeners(document.getElementById('addBtn')) : 'N/A');
}

// Función simplificada para iOS que no depende de servicios externos
function setupIOSSimpleNotifications() {
    console.log('Configurando notificaciones simples para iOS');
    
    // Solo usar notificaciones locales en iOS
    if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                console.log('Notificaciones locales concedidas en iOS');
                showNotification('📱 Notificaciones iOS activadas (solo con app abierta)');
                
                // Actualizar botón
                if (notificationBtn) {
                    notificationBtn.textContent = '✅ Notificaciones iOS Activas';
                    notificationBtn.disabled = true;
                }
            } else {
                console.log('Notificaciones denegadas en iOS');
                showNotification('❌ Notificaciones denegadas en iOS');
            }
        });
    }
}

// Test de funcionalidad básica
function testBasicFunctionality() {
    console.log('=== TEST FUNCIONALIDAD BÁSICA ===');
    
    try {
        // Test 1: Verificar DOM
        const elements = {
            taskInput: document.getElementById('taskInput'),
            addBtn: document.getElementById('addBtn'),
            taskList: document.getElementById('taskList')
        };
        
        console.log('Elementos DOM encontrados:');
        Object.keys(elements).forEach(key => {
            console.log(`- ${key}:`, !!elements[key]);
        });
        
        // Test 2: Intentar crear elemento en lista
        if (elements.taskList) {
            const testItem = document.createElement('li');
            testItem.textContent = 'Test iOS';
            testItem.style.color = 'red';
            elements.taskList.appendChild(testItem);
            console.log('✅ Test DOM exitoso - elemento agregado');
            
            // Remover después de 2 segundos
            setTimeout(() => {
                testItem.remove();
                console.log('🗑️ Elemento test removido');
            }, 2000);
        }
        
        // Test 3: Verificar storage
        try {
            localStorage.setItem('test_ios', 'OK');
            const testValue = localStorage.getItem('test_ios');
            localStorage.removeItem('test_ios');
            console.log('✅ LocalStorage funcional:', testValue === 'OK');
        } catch (e) {
            console.log('❌ LocalStorage error:', e);
        }
        
    } catch (error) {
        console.error('❌ Error en test básico:', error);
    }
}

// Función de emergencia para iOS
function emergencyIOSSetup() {
    console.log('🚨 CONFIGURACIÓN DE EMERGENCIA iOS');
    
    // Remover todos los event listeners y re-configurar
    const newAddBtn = document.getElementById('addBtn');
    if (newAddBtn) {
        // Clonar botón para remover listeners
        const cleanBtn = newAddBtn.cloneNode(true);
        newAddBtn.parentNode.replaceChild(cleanBtn, newAddBtn);
        
        // Re-configurar listener simple
        cleanBtn.addEventListener('click', function() {
            console.log('🍎 iOS - Botón clickeado');
            const input = document.getElementById('taskInput');
            if (input && input.value.trim()) {
                // Crear tarea simple sin notificaciones complejas
                const task = {
                    id: Date.now(),
                    text: input.value.trim(),
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                
                // Agregar a lista visual
                const taskList = document.getElementById('taskList');
                if (taskList) {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="task-item">
                            <span class="task-text">${task.text}</span>
                            <button onclick="this.parentElement.parentElement.remove()">🗑️</button>
                        </div>
                    `;
                    taskList.appendChild(li);
                    
                    console.log('✅ Tarea añadida en iOS:', task.text);
                    
                    // Notificación simple
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('📝 Tarea añadida', {
                            body: task.text,
                            icon: './icons/icon-192x192.svg'
                        });
                    }
                    
                    // Limpiar input
                    input.value = '';
                }
            }
        });
        
        console.log('✅ Event listener reconfigurado para iOS');
    }
}

// Auto-ejecutar si es iOS
if (typeof window !== 'undefined') {
    window.addEventListener('load', function() {
        if (isIOS && isIOS()) {
            console.log('🍎 iOS detectado - iniciando diagnóstico');
            setTimeout(debugIOS, 1000);
            setTimeout(testBasicFunctionality, 2000);
        }
    });
}