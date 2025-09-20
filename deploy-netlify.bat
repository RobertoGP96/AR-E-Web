@echo off
REM Script para desplegar a Netlify
REM Requiere: npm install -g netlify-cli

echo 🚀 Desplegando a Netlify...

REM Verificar netlify CLI
netlify --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando Netlify CLI...
    npm install -g netlify-cli
)

REM Build
echo 🏗️ Construyendo proyecto...
cd apps\client
call pnpm install
call pnpm build
cd ..\..

REM Deploy
echo 🚀 Desplegando...
netlify deploy --prod --dir=apps/client/dist --site=tu-site-id

echo ✅ ¡Deploy completado!