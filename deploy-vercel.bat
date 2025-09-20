@echo off
REM Script para desplegar a Vercel
REM Requiere: npm install -g vercel

echo 🚀 Desplegando a Vercel...

REM Verificar Vercel CLI
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando Vercel CLI...
    npm install -g vercel
)

REM Build
echo 🏗️ Construyendo proyecto...
cd apps\client
call pnpm install
call pnpm build
cd ..\..

REM Deploy
echo 🚀 Desplegando...
vercel --prod apps/client/dist

echo ✅ ¡Deploy completado!