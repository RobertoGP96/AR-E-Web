@echo off
REM Script de desarrollo para Windows
REM Usage: scripts\dev.bat [client|admin|backend|all]

setlocal enabledelayedexpansion
set APP=%1
if "%APP%"=="" set APP=all

set ROOT_DIR=%~dp0..
cd /d "%ROOT_DIR%"

echo 🚀 Iniciando AR-E Web Development Environment
echo 📁 Root directory: %ROOT_DIR%

if "%APP%"=="client" (
    echo 🔥 Iniciando Client App...
    cd apps\client
    pnpm dev
) else if "%APP%"=="admin" (
    echo 👨‍💼 Iniciando Admin App...
    cd apps\admin
    pnpm dev --port 5174
) else if "%APP%"=="backend" (
    echo 🐍 Iniciando Django Backend...
    cd backend
    python manage.py runserver
) else if "%APP%"=="all" (
    echo 🎯 Iniciando todas las aplicaciones...
    
    REM Verificar .env.local
    if not exist .env.local (
        echo ⚠️  Creando .env.local desde .env.example
        copy .env.example .env.local
        echo 📝 Por favor, ajusta las variables en .env.local
    )
    
    REM Instalar dependencias si es necesario
    if not exist node_modules (
        echo 📦 Instalando dependencias...
        pnpm install
    )
    
    REM Configurar Python virtual environment
    if not exist backend\venv (
        echo 🐍 Configurando entorno virtual de Python...
        cd backend
        python -m venv venv
        call venv\Scripts\activate.bat
        pip install -r requirements.txt
        cd ..
    )
    
    REM Verificar base de datos
    echo 🗄️  Verificando base de datos...
    cd backend
    if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat
    python manage.py migrate
    cd ..
    
    REM Iniciar todas las apps
    pnpm dev
) else (
    echo ❌ Opción no válida. Usa: client, admin, backend, o all
    exit /b 1
)

endlocal