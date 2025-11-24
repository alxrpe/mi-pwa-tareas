# React Login Project

## 📋 Requisitos Previos

Para ejecutar este proyecto, necesitas tener instalado:

1. **Node.js** (versión 16 o superior)
   - Descárgalo desde: https://nodejs.org/
   - Asegúrate de que npm se instale junto con Node.js

## 🚀 Instalación y Ejecución

### Opción 1: Con Vite (Recomendado)

1. **Instalar Node.js** (si no lo tienes):
   - Ve a https://nodejs.org/
   - Descarga e instala la versión LTS
   - Reinicia tu terminal/PowerShell

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar el proyecto**:
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**:
   - El proyecto se abrirá automáticamente en http://localhost:3000
   - Si no se abre automáticamente, ve a esa URL manualmente

### Opción 2: Version Simple (Sin bundler)

Si no quieres instalar Node.js, puedes usar la versión simple:
- Abre el archivo `simple-login.html` en tu navegador

## 🔑 Credenciales de Prueba

- **Usuario**: `admin`
- **Contraseña**: `123456`

## 📁 Estructura del Proyecto

```
reactpruebas/
├── src/
│   ├── components/
│   │   └── Login.jsx          # Componente de login
│   ├── App.jsx                # Componente principal
│   ├── main.jsx               # Punto de entrada
│   └── index.css              # Estilos globales
├── index.html                 # HTML principal
├── vite.config.js             # Configuración de Vite
├── package.json               # Dependencias del proyecto
└── simple-login.html          # Versión sin bundler
```

## ✨ Características

- ✅ Formulario de login con validación
- ✅ Manejo de estados con React hooks
- ✅ Diseño responsive
- ✅ Animaciones CSS
- ✅ Validación de campos
- ✅ Simulación de autenticación
- ✅ Dashboard básico después del login

## 🎯 Próximos Pasos

Una vez que tengas el login funcionando, podemos continuar con:

1. **Base de datos**: Configurar una base de datos (SQLite, MySQL, etc.)
2. **Backend**: Crear un servidor (Node.js/Express, Python/Flask, etc.)
3. **Autenticación real**: Implementar JWT o sesiones
4. **Registro de usuarios**: Formulario de registro
5. **CRUD**: Operaciones Create, Read, Update, Delete

## 🛠️ Comandos Disponibles

- `npm run dev`: Ejecuta el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la build de producción

## 🐛 Solución de Problemas

### Si npm no se reconoce:
1. Asegúrate de que Node.js esté instalado
2. Reinicia tu terminal/PowerShell
3. Verifica la instalación: `node --version`

### Si hay errores de dependencias:
1. Elimina la carpeta `node_modules`
2. Elimina el archivo `package-lock.json`
3. Ejecuta `npm install` nuevamente