#!/bin/bash

# Script para build en Cloudflare
echo "Iniciando build para Cloudflare..."

# Usar la configuración específica para build
cd /opt/buildhome/repo/apps/client

# Instalar dependencias
echo "Instalando dependencias..."
pnpm install

# Hacer build usando la configuración específica
echo "Ejecutando build..."
pnpm build

echo "Build completado exitosamente!"