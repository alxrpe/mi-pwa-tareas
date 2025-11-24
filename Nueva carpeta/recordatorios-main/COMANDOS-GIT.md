# 🚀 COMANDOS GIT PARA SUBIR EL PROYECTO

## ⚡ Comandos completos (copiar y pegar):

### 1️⃣ Navegar al proyecto:
```powershell
cd "C:\Users\edwin\Downloads\pruebaalpha\reactpruebas"
```

### 2️⃣ Inicializar repositorio:
```powershell
git init
```

### 3️⃣ Configurar Git (si es primera vez):
```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### 4️⃣ Agregar todos los archivos:
```powershell
git add .
```

### 5️⃣ Hacer el primer commit:
```powershell
git commit -m "Initial commit: Proyecto React Login completo"
```

### 6️⃣ Agregar el repositorio remoto:
```powershell
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
```

### 7️⃣ Cambiar a rama main (si es necesario):
```powershell
git branch -M main
```

### 8️⃣ Subir al repositorio:
```powershell
git push -u origin main
```

## 🎉 ¡PROYECTO COMPLETADO!

Tu proyecto ahora incluye:
- ✅ Login funcional con validación
- ✅ CRUD completo de tareas académicas
- ✅ Formularios con todos los campos solicitados:
  * Nombre de materia
  * Fecha de entrega  
  * Tarea por hacer
  * Comentarios
  * Recordatorio (¿Se te va a recordar?)
  * Estado realizado (Checkbox)
- ✅ Filtros y ordenamiento
- ✅ Validaciones completas
- ✅ Diseño responsive
- ✅ Dos versiones: React profesional + HTML simple

## 🔧 Si Git no está instalado aún:

### Opción A: Instalar con winget (recomendado):
```powershell
winget install --id Git.Git -e --source winget
```

### Opción B: Instalar con chocolatey:
```powershell
choco install git
```

### Opción C: Descarga manual:
- Ve a: https://git-scm.com/download/windows
- Descarga e instala
- **Importante**: Durante instalación, marcar "Add to PATH"

## 🚨 Después de instalar Git:
1. **Cierra PowerShell completamente**
2. **Abre nueva ventana de PowerShell**
3. **Ejecuta**: `git --version` (para verificar)
4. **Ejecuta los comandos de arriba**

## 📝 Comandos adicionales útiles:

### Ver estado:
```powershell
git status
```

### Ver commits:
```powershell
git log --oneline
```

### Agregar archivos específicos:
```powershell
git add archivo.js
```

### Commit con mensaje:
```powershell
git commit -m "Descripción del cambio"
```

### Subir cambios:
```powershell
git push
```

### Descargar cambios:
```powershell
git pull
```

## 🎯 Secuencia completa en un solo bloque:

```powershell
cd "C:\Users\edwin\Downloads\pruebaalpha\reactpruebas"
git init
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
git add .
git commit -m "Initial commit: Proyecto React Login completo"
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

## ⚠️ IMPORTANTE:
- Reemplaza `TU_USUARIO` con tu usuario de GitHub
- Reemplaza `TU_REPOSITORIO` con el nombre de tu repositorio
- Si te pide credenciales, usa tu token de GitHub (no la contraseña)