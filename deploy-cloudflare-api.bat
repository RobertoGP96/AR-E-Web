@echo off
REM Script para desplegar a Cloudflare Pages usando la API REST
REM Uso: deploy-cloudflare-api.bat

echo 🚀 Iniciando despliegue a Cloudflare Pages via API...

REM Verificar variables de entorno
if "%CLOUDFLARE_API_TOKEN%"=="" (
    echo ❌ Error: Define CLOUDFLARE_API_TOKEN
    echo Obtén tu token en: https://dash.cloudflare.com/profile/api-tokens
    exit /b 1
)

if "%CLOUDFLARE_ACCOUNT_ID%"=="" (
    echo ❌ Error: Define CLOUDFLARE_ACCOUNT_ID
    echo Encuéntralo en: https://dash.cloudflare.com/
    exit /b 1
)

REM Build del proyecto
echo 🏗️ Construyendo el proyecto...
cd apps\client
call pnpm install
call pnpm build

if errorlevel 1 (
    echo ❌ Error en el build
    exit /b 1
)

echo ✅ Build completado

REM Crear archivo ZIP
echo 📦 Creando archivo para deploy...
cd dist
tar -a -c -f ..\site.zip *
cd ..\..

REM Upload via API usando curl
echo 🚀 Subiendo a Cloudflare Pages...
curl -X POST ^
  "https://api.cloudflare.com/client/v4/accounts/%CLOUDFLARE_ACCOUNT_ID%/pages/projects/arye-shipps/deployments" ^
  -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
  -H "Content-Type: multipart/form-data" ^
  -F "file=@apps/client/site.zip"

REM Limpiar archivos temporales
del apps\client\site.zip

echo ✅ ¡Despliegue completado!
echo 🌐 Revisa tu proyecto en: https://dash.cloudflare.com/