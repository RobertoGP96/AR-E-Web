@echo off
REM Script para desplegar a Cloudflare Pages en Windows
REM Uso: deploy-client.bat

echo 🚀 Iniciando despliegue del cliente a Cloudflare Pages...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: Ejecuta este script desde la raíz del proyecto
    exit /b 1
)

REM Verificar que wrangler está instalado
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Wrangler no encontrado. Instalando...
    npm install -g wrangler
)

REM Autenticación
echo 🔐 Verificando autenticación con Cloudflare...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo 🔑 Iniciando sesión en Cloudflare...
    wrangler login
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

# Despliegue
echo 🚀 Desplegando a Cloudflare Pages...
cd ..\..
wrangler pages deploy apps/client/dist --project-name=arye-shipps

echo ✅ ¡Despliegue completado!
echo 🌐 Tu aplicación debería estar disponible en tu dominio de Cloudflare Pages