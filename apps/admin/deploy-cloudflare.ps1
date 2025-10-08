# =============================================================================
# SCRIPT DE BUILD Y DEPLOYMENT PARA CLOUDFLARE PAGES - WINDOWS
# =============================================================================

Write-Host "🚀 Iniciando proceso de build para Cloudflare Pages..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Ejecuta desde el directorio admin." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Verificando dependencias..." -ForegroundColor Yellow

# Verificar que pnpm está instalado
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm versión: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: pnpm no está instalado." -ForegroundColor Red
    exit 1
}

# Limpiar instalaciones previas
Write-Host "🧹 Limpiando archivos anteriores..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
if (Test-Path "pnpm-lock.yaml") {
    Remove-Item -Force "pnpm-lock.yaml"
}

# Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

# Verificar variables de entorno
Write-Host "🔧 Verificando variables de entorno..." -ForegroundColor Yellow
if (!(Test-Path ".env.production")) {
    Write-Host "❌ Error: No se encontró .env.production" -ForegroundColor Red
    exit 1
}

# Ejecutar lint
Write-Host "🔍 Ejecutando lint..." -ForegroundColor Yellow
pnpm lint:fix

# Ejecutar type check
Write-Host "📝 Verificando tipos TypeScript..." -ForegroundColor Yellow
pnpm type-check

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en verificación de tipos" -ForegroundColor Red
    exit 1
}

# Build para producción
Write-Host "🏗️  Ejecutando build de producción..." -ForegroundColor Yellow
$env:NODE_ENV="production"
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build" -ForegroundColor Red
    exit 1
}

# Verificar que el build se completó
if (!(Test-Path "dist")) {
    Write-Host "❌ Error: No se generó la carpeta dist" -ForegroundColor Red
    exit 1
}

# Mostrar información del build
Write-Host "📊 Información del build:" -ForegroundColor Cyan
$distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
$distSizeMB = [math]::Round($distSize / 1MB, 2)
Write-Host "   Tamaño total: $distSizeMB MB" -ForegroundColor White

# Mostrar archivos principales
Write-Host "📁 Archivos principales generados:" -ForegroundColor Cyan
Get-ChildItem "dist" -Recurse -Name | Where-Object { $_ -match "\.(js|css|html)$" } | ForEach-Object {
    $size = (Get-Item "dist/$_").Length
    $sizeMB = [math]::Round($size / 1MB, 3)
    Write-Host "   $_`: $sizeMB MB" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ Build completado exitosamente!" -ForegroundColor Green
Write-Host "📁 Los archivos están listos en la carpeta 'dist'" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos para deployment:" -ForegroundColor Yellow
Write-Host "   1. Conecta tu repositorio a Cloudflare Pages" -ForegroundColor White
Write-Host "   2. Configura las variables de entorno en Cloudflare" -ForegroundColor White
Write-Host "   3. Establece el comando de build: 'pnpm build'" -ForegroundColor White
Write-Host "   4. Establece el directorio de output: 'dist'" -ForegroundColor White
Write-Host "   5. Establece el directorio root: 'apps/admin'" -ForegroundColor White