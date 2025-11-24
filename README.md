# Mi PWA - Lista de Tareas

Una aplicación Progressive Web App (PWA) sencilla para gestionar tareas diarias. Desarrollada con tecnologías web modernas y optimizada para funcionar tanto online como offline.

## 🚀 Características

- ✅ **Gestión de tareas**: Añadir, completar y eliminar tareas
- 📱 **Instalable**: Se puede instalar como app nativa en dispositivos móviles y escritorio
- 🔄 **Funciona offline**: Acceso completo sin conexión a internet
- 📊 **Estadísticas**: Contador de tareas totales y completadas
- 💾 **Persistencia**: Los datos se guardan localmente en el navegador
- 🎨 **Diseño responsivo**: Optimizado para móviles, tablets y escritorio
- 🌟 **Experiencia nativa**: Comportamiento similar a una app móvil

## 🛠️ Tecnologías utilizadas

- **HTML5**: Estructura semántica y metadatos PWA
- **CSS3**: Diseño responsivo con Flexbox y CSS Grid
- **JavaScript ES6+**: Funcionalidad interactiva y gestión de estado
- **Service Worker**: Cache y funcionalidad offline
- **Web App Manifest**: Configuración para instalación
- **LocalStorage**: Persistencia de datos local

## 📁 Estructura del proyecto

```
mi-pwa/
├── index.html          # Página principal
├── manifest.json       # Configuración PWA
├── sw.js              # Service Worker
├── style.css          # Estilos CSS
├── app.js             # Lógica de la aplicación
├── icons/             # Iconos de la aplicación (necesarios)
└── README.md          # Este archivo
```

## 🚀 Cómo usar

### Opción 1: Servidor local simple
```bash
# Con Python 3
python -m http.server 8000

# Con Python 2
python -m SimpleHTTPServer 8000

# Con Node.js (si tienes http-server instalado)
npx http-server
```

### Opción 2: Live Server en VS Code
1. Instala la extensión "Live Server" en VS Code
2. Haz clic derecho en `index.html`
3. Selecciona "Open with Live Server"

### Opción 3: Netlify Drop
1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta del proyecto
3. Obtendrás una URL temporal

## 📱 Instalación como PWA

1. **En Chrome/Edge (Escritorio)**:
   - Busca el icono "Instalar" en la barra de direcciones
   - O usa el menú → "Instalar [nombre de la app]"

2. **En Chrome (Android)**:
   - Toca el menú (⋮) → "Instalar app" o "Añadir a pantalla de inicio"

3. **En Safari (iOS)**:
   - Toca el botón "Compartir" → "Añadir a pantalla de inicio"

## ✨ Funcionalidades implementadas

### Gestión de tareas
- Añadir nuevas tareas con el botón o presionando Enter
- Marcar tareas como completadas/pendientes
- Eliminar tareas con confirmación
- Contador de tareas totales y completadas

### PWA Features
- **Manifest**: Configuración completa para instalación
- **Service Worker**: Cache de recursos y funcionamiento offline
- **Iconos**: Conjunto completo de iconos para diferentes dispositivos
- **Tema**: Colores personalizados para la interfaz

### Experiencia de usuario
- Diseño responsivo para todos los dispositivos
- Animaciones suaves y transiciones
- Notificaciones de feedback
- Estados de carga y vacío
- Confirmaciones para acciones destructivas

## 🎨 Personalización

### Cambiar colores
Edita las variables CSS en `style.css`:
```css
:root {
  --primary-color: #4CAF50;
  --secondary-color: #45a049;
  --background-color: #667eea;
}
```

### Modificar el nombre de la app
Actualiza estos archivos:
- `manifest.json`: Cambia `name` y `short_name`
- `index.html`: Actualiza el `<title>` y otros metadatos

### Añadir nuevas funcionalidades
- Edita `app.js` para nueva lógica
- Actualiza `style.css` para nuevos estilos
- Modifica `sw.js` si necesitas cachear nuevos recursos

## 🔧 Debug y desarrollo

### Herramientas de debugging incluidas
En la consola del navegador puedes usar:
```javascript
// Limpiar todos los datos
debugPWA.clearAllData();

// Añadir tareas de ejemplo
debugPWA.addSampleTasks();

// Exportar datos actuales
debugPWA.exportData();
```

### Verificar el Service Worker
1. Abre las DevTools (F12)
2. Ve a la pestaña "Application" / "Aplicación"
3. Revisa "Service Workers" y "Storage"

### Probar funcionalidad offline
1. Abre la app en el navegador
2. En DevTools, ve a "Network" / "Red"
3. Selecciona "Offline"
4. Recarga la página y verifica que funcione

## 📋 Checklist PWA

- ✅ Manifest con configuración completa
- ✅ Service Worker registrado y funcionando
- ✅ Iconos para diferentes tamaños y dispositivos
- ✅ Funcionalidad offline completa
- ✅ Diseño responsivo
- ✅ HTTPS (requerido en producción)
- ✅ Meta tags para SEO y PWA

## 🚨 Notas importantes

1. **Iconos**: Necesitas crear los iconos reales y colocarlos en la carpeta `icons/`. Los tamaños requeridos están especificados en `manifest.json`.

2. **HTTPS**: En producción, las PWAs requieren HTTPS para funcionar completamente.

3. **Service Worker**: Se actualiza automáticamente cuando detecta cambios en los archivos.

4. **Compatibilidad**: Funciona en todos los navegadores modernos, con funcionalidades PWA completas en Chrome/Edge.

## 🎯 Próximas mejoras

- [ ] Sincronización en segundo plano
- [ ] Notificaciones push
- [ ] Categorías de tareas
- [ ] Fechas de vencimiento
- [ ] Exportar/importar datos
- [ ] Modo oscuro
- [ ] Búsqueda de tareas
- [ ] Estadísticas avanzadas

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Para contribuir:

1. Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de usar, modificar y distribuir.

---

¡Disfruta usando tu nueva PWA! 🎉