#!/bin/bash

# Script de desarrollo para todo el monorepo
# Usage: ./scripts/dev.sh [client|admin|backend|all]

set -e

APP=${1:-all}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Iniciando AR-E Web Development Environment"
echo "📁 Root directory: $ROOT_DIR"

case $APP in
  "client")
    echo "🔥 Iniciando Client App..."
    cd "$ROOT_DIR/apps/client"
    pnpm dev
    ;;
  "admin")
    echo "👨‍💼 Iniciando Admin App..."
    cd "$ROOT_DIR/apps/admin"
    pnpm dev --port 5174
    ;;
  "backend")
    echo "🐍 Iniciando Django Backend..."
    cd "$ROOT_DIR/backend"
    python manage.py runserver
    ;;
  "all")
    echo "🎯 Iniciando todas las aplicaciones..."
    cd "$ROOT_DIR"
    
    # Verificar que exista .env.local
    if [ ! -f .env.local ]; then
      echo "⚠️  Creando .env.local desde .env.example"
      cp .env.example .env.local
      echo "📝 Por favor, ajusta las variables en .env.local"
    fi
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
      echo "📦 Instalando dependencias..."
      pnpm install
    fi
    
    if [ ! -d "backend/venv" ] && [ ! -f "backend/.venv" ]; then
      echo "🐍 Configurando entorno virtual de Python..."
      cd backend
      python -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt
      cd ..
    fi
    
    # Ejecutar migraciones si es necesario
    echo "🗄️  Verificando base de datos..."
    cd backend
    if [ -f "venv/bin/activate" ]; then
      source venv/bin/activate
    fi
    python manage.py migrate
    cd ..
    
    # Iniciar todas las apps
    pnpm dev
    ;;
  *)
    echo "❌ Opción no válida. Usa: client, admin, backend, o all"
    exit 1
    ;;
esac