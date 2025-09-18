#!/usr/bin/env powershell

# Script de desarrollo para Windows PowerShell
# Usage: .\scripts\dev.ps1 [client|admin|backend|all]

param(
    [Parameter(Position=0)]
    [ValidateSet("client", "admin", "backend", "all")]
    [string]$App = "all"
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path $PSScriptRoot -Parent

Write-Host "🚀 Iniciando AR-E Web Development Environment" -ForegroundColor Green
Write-Host "📁 Root directory: $RootDir" -ForegroundColor Blue

Set-Location $RootDir

switch ($App) {
    "client" {
        Write-Host "🔥 Iniciando Client App..." -ForegroundColor Yellow
        Set-Location "apps\client"
        pnpm dev
    }
    "admin" {
        Write-Host "👨‍💼 Iniciando Admin App..." -ForegroundColor Yellow
        Set-Location "apps\admin"
        pnpm dev --port 5174
    }
    "backend" {
        Write-Host "🐍 Iniciando Django Backend..." -ForegroundColor Yellow
        Set-Location "backend"
        
        # Activar virtual environment si existe
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & ".\venv\Scripts\Activate.ps1"
        }
        
        python manage.py runserver
    }
    "all" {
        Write-Host "🎯 Iniciando todas las aplicaciones..." -ForegroundColor Yellow
        
        # Verificar que exista .env.local
        if (!(Test-Path ".env.local")) {
            Write-Host "⚠️  Creando .env.local desde .env.example" -ForegroundColor Yellow
            Copy-Item ".env.example" ".env.local"
            Write-Host "📝 Por favor, ajusta las variables en .env.local" -ForegroundColor Cyan
        }
        
        # Instalar dependencias si es necesario
        if (!(Test-Path "node_modules")) {
            Write-Host "📦 Instalando dependencias..." -ForegroundColor Blue
            pnpm install
        }
        
        # Configurar Python virtual environment
        if (!(Test-Path "backend\venv")) {
            Write-Host "🐍 Configurando entorno virtual de Python..." -ForegroundColor Blue
            Set-Location "backend"
            python -m venv venv
            & ".\venv\Scripts\Activate.ps1"
            pip install -r requirements.txt
            Set-Location ".."
        }
        
        # Verificar base de datos
        Write-Host "🗄️  Verificando base de datos..." -ForegroundColor Blue
        Set-Location "backend"
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & ".\venv\Scripts\Activate.ps1"
        }
        python manage.py migrate
        Set-Location ".."
        
        # Iniciar todas las apps usando concurrently
        Write-Host "🚀 Iniciando todas las aplicaciones..." -ForegroundColor Green
        pnpm dev
    }
    default {
        Write-Host "❌ Opción no válida. Usa: client, admin, backend, o all" -ForegroundColor Red
        exit 1
    }
}