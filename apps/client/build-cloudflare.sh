#!/bin/bash

# Script para build en Cloudflare
echo "Iniciando build para Cloudflare..."

# Navegar al directorio correcto
cd /opt/buildhome/repo/apps/client

# Instalar dependencias
echo "Instalando dependencias..."
pnpm install

# Hacer build con variable de entorno para Cloudflare
echo "Ejecutando build para Cloudflare..."
VITE_DEPLOY_TARGET=cloudflare pnpm run build

echo "Build completado exitosamente!"