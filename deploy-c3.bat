@echo off
REM Script para usar create-cloudflare (c3) en lugar de wrangler
REM Uso: deploy-c3.bat

echo 🚀 Despliegue usando create-cloudflare (c3)...

REM Build del proyecto
echo 🏗️ Construyendo el proyecto...
cd apps\client
call pnpm install
call pnpm build
cd ..\..

REM Deploy usando c3
echo 📤 Desplegando con c3...
npx create-cloudflare@latest --type pages --existing-script apps/client/dist --name arye-shipps

echo ✅ ¡Despliegue completado!