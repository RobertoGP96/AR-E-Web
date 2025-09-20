@echo off
REM Script para desplegar a Surge.sh
REM Requiere: npm install -g surge

echo 🚀 Desplegando a Surge.sh...

REM Verificar Surge CLI
surge --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando Surge CLI...
    npm install -g surge
)

REM Build
echo 🏗️ Construyendo proyecto...
cd apps\client
call pnpm install
call pnpm build

REM Deploy
echo 🚀 Desplegando...
cd dist
surge . arye-shipps.surge.sh
cd ..\..\..

echo ✅ ¡Deploy completado!
echo 🌐 Tu app está en: https://arye-shipps.surge.sh