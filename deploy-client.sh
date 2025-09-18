#!/bin/bash

# Script para desplegar a Cloudflare Pages
# Uso: ./deploy-client.sh

echo "🚀 Iniciando despliegue del cliente a Cloudflare Pages..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar que wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "📦 Wrangler no encontrado. Instalando..."
    npm install -g wrangler
fi

# Autenticación (solo si no está autenticado)
echo "🔐 Verificando autenticación con Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    echo "🔑 Iniciando sesión en Cloudflare..."
    wrangler login
fi

# Build del proyecto
echo "🏗️ Construyendo el proyecto cliente..."
cd apps/client
pnpm install
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build"
    exit 1
fi

echo "✅ Build completado exitosamente"

# Despliegue
echo "🚀 Desplegando a Cloudflare Pages..."
cd ../..
wrangler pages deploy

echo "✅ ¡Despliegue completado!"
echo "🌐 Tu aplicación debería estar disponible en tu dominio de Cloudflare Pages"