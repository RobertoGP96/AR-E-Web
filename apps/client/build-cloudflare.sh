#!/bin/bash

# Script para build en Cloudflare
echo "Iniciando build para Cloudflare..."

# Usar la configuración específica para build
cd /opt/buildhome/repo/apps/client

# Instalar dependencias
echo "Instalando dependencias..."
pnpm install

# Copiar archivos específicos para Cloudflare
echo "Configurando archivos para Cloudflare..."
cp index.cloudflare.html index.html

# Hacer build usando la configuración específica
echo "Ejecutando build..."
pnpm run build:cloudflare

echo "Build completado exitosamente!"