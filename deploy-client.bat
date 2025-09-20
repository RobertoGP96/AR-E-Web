@echo off
REM Script para BUILD SOLAMENTE - Deploy manual via dashboard
REM Uso: deploy-client.bat

echo 🚀 Preparando aplicación para Cloudflare Pages...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: Ejecuta este script desde la raíz del proyecto
    exit /b 1
)

REM Build del proyecto
echo 🏗️ Construyendo el proyecto cliente...
cd apps\client
call pnpm install
call pnpm build

if errorlevel 1 (
    echo ❌ Error en el build
    exit /b 1
)

echo ✅ Build completado exitosamente
echo 📁 Archivos listos en: apps\client\dist

echo.
echo 🌐 PASOS PARA DEPLOY MANUAL:
echo 1. Ve a: https://dash.cloudflare.com/
echo 2. Páginas → Crear proyecto
echo 3. Conectar a Git → Selecciona tu repositorio
echo 4. Configuración de build:
echo    - Build command: cd apps/client ^&^& pnpm install ^&^& pnpm build
echo    - Build output directory: apps/client/dist
echo    - Root directory: /
echo 5. Deploy automático en cada push!

cd ..\..
echo.
echo ✅ ¡Listo para deploy manual!