#!/bin/bash

# =============================================================================
# SCRIPT DE BUILD Y DEPLOYMENT PARA CLOUDFLARE PAGES - UNIX/LINUX/MAC
# =============================================================================

echo "🚀 Iniciando proceso de build para Cloudflare Pages..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta desde el directorio admin."
    exit 1
fi

echo "📋 Verificando dependencias..."

# Verificar que pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm no está instalado."
    echo "Instala pnpm: npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm versión: $(pnpm --version)"

# Limpiar instalaciones previas
echo "🧹 Limpiando archivos anteriores..."
rm -rf node_modules dist pnpm-lock.yaml

# Instalar dependencias
echo "📦 Instalando dependencias..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

# Verificar variables de entorno
echo "🔧 Verificando variables de entorno..."
if [ ! -f ".env.production" ]; then
    echo "❌ Error: No se encontró .env.production"
    exit 1
fi

# Ejecutar lint
echo "🔍 Ejecutando lint..."
pnpm lint:fix

# Ejecutar type check
echo "📝 Verificando tipos TypeScript..."
pnpm type-check

if [ $? -ne 0 ]; then
    echo "❌ Error en verificación de tipos"
    exit 1
fi

# Build para producción
echo "🏗️  Ejecutando build de producción..."
NODE_ENV=production pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build"
    exit 1
fi

# Verificar que el build se completó
if [ ! -d "dist" ]; then
    echo "❌ Error: No se generó la carpeta dist"
    exit 1
fi

# Mostrar información del build
echo "📊 Información del build:"
DIST_SIZE=$(du -sh dist | cut -f1)
echo "   Tamaño total: $DIST_SIZE"

# Mostrar archivos principales
echo "📁 Archivos principales generados:"
find dist -name "*.js" -o -name "*.css" -o -name "*.html" | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "   ${file#dist/}: $size"
done

echo ""
echo "✅ Build completado exitosamente!"
echo "📁 Los archivos están listos en la carpeta 'dist'"
echo ""
echo "📝 Próximos pasos para deployment:"
echo "   1. Conecta tu repositorio a Cloudflare Pages"
echo "   2. Configura las variables de entorno en Cloudflare"
echo "   3. Establece el comando de build: 'pnpm build'"
echo "   4. Establece el directorio de output: 'dist'"
echo "   5. Establece el directorio root: 'apps/admin'"