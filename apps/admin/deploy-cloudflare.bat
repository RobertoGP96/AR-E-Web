@echo off
REM =============================================================================
REM SCRIPT DE BUILD Y DEPLOYMENT PARA CLOUDFLARE PAGES - WINDOWS BATCH
REM =============================================================================

echo 🚀 Iniciando proceso de build para Cloudflare Pages...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: No se encontro package.json. Ejecuta desde el directorio admin.
    exit /b 1
)

echo 📋 Verificando dependencias...

REM Verificar que pnpm está instalado
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: pnpm no esta instalado.
    exit /b 1
)

echo ✅ pnpm instalado correctamente

REM Limpiar instalaciones previas
echo 🧹 Limpiando archivos anteriores...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "dist" rmdir /s /q "dist"
if exist "pnpm-lock.yaml" del "pnpm-lock.yaml"

REM Instalar dependencias
echo 📦 Instalando dependencias...
pnpm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias
    exit /b 1
)

REM Verificar variables de entorno
echo 🔧 Verificando variables de entorno...
if not exist ".env.production" (
    echo ❌ Error: No se encontro .env.production
    exit /b 1
)

REM Ejecutar lint
echo 🔍 Ejecutando lint...
pnpm lint:fix

REM Ejecutar type check
echo 📝 Verificando tipos TypeScript...
pnpm type-check
if errorlevel 1 (
    echo ❌ Error en verificacion de tipos
    exit /b 1
)

REM Build para producción
echo 🏗️  Ejecutando build de produccion...
set NODE_ENV=production
pnpm build
if errorlevel 1 (
    echo ❌ Error en el build
    exit /b 1
)

REM Verificar que el build se completó
if not exist "dist" (
    echo ❌ Error: No se genero la carpeta dist
    exit /b 1
)

echo.
echo ✅ Build completado exitosamente!
echo 📁 Los archivos estan listos en la carpeta 'dist'
echo.
echo 📝 Proximos pasos para deployment:
echo    1. Conecta tu repositorio a Cloudflare Pages
echo    2. Configura las variables de entorno en Cloudflare
echo    3. Establece el comando de build: 'pnpm build'
echo    4. Establece el directorio de output: 'dist'
echo    5. Establece el directorio root: 'apps/admin'