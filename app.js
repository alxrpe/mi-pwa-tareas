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

// Variables para PWA
let deferredPrompt;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateStats();
    updateDisplay();
    
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
    
    // Detectar si ya está instalada
    window.addEventListener('appinstalled', () => {
        console.log('PWA: App instalada');
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });
});

// Función para añadir tarea
function addTask() {
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
    
    // Feedback visual
    showNotification('✅ Tarea añadida exitosamente');
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
    }
};