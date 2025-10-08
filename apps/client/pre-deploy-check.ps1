# Pre-Deploy Check Script para Vercel
# Verifica que todo esté listo antes de hacer deploy

Write-Host "🔍 Verificando configuración pre-deploy..." -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0

# 1. Verificar que estamos en la carpeta correcta
Write-Host "📁 Verificando directorio..." -ForegroundColor Yellow
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: No se encuentra package.json. Ejecuta desde apps/client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Directorio correcto" -ForegroundColor Green
Write-Host ""

# 2. Verificar archivo .env.production
Write-Host "🔐 Verificando variables de entorno..." -ForegroundColor Yellow
if (!(Test-Path ".env.production")) {
    Write-Host "⚠️  Advertencia: No se encuentra .env.production" -ForegroundColor Yellow
    $ErrorCount++
} else {
    $envContent = Get-Content ".env.production" -Raw
    $requiredVars = @("VITE_API_URL", "VITE_APP_ENV")
    
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch $var) {
            Write-Host "⚠️  Advertencia: Falta variable $var en .env.production" -ForegroundColor Yellow
            $ErrorCount++
        }
    }
    
    if ($ErrorCount -eq 0) {
        Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
    }
}
Write-Host ""

# 3. Verificar dependencias instaladas
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "⚠️  Advertencia: node_modules no encontrado. Instalando..." -ForegroundColor Yellow
    pnpm install
} else {
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
}
Write-Host ""

# 4. Limpiar dist anterior
Write-Host "🧹 Limpiando build anterior..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Dist limpiado" -ForegroundColor Green
} else {
    Write-Host "✅ No hay dist anterior" -ForegroundColor Green
}
Write-Host ""

# 5. Type check
Write-Host "🔍 Verificando tipos TypeScript..." -ForegroundColor Yellow
$typeCheckOutput = pnpm type-check 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en type-check:" -ForegroundColor Red
    Write-Host $typeCheckOutput -ForegroundColor Red
    $ErrorCount++
    exit 1
} else {
    Write-Host "✅ Type-check exitoso" -ForegroundColor Green
}
Write-Host ""

# 6. Lint
Write-Host "🔍 Verificando linting..." -ForegroundColor Yellow
$lintOutput = pnpm lint 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Advertencia: Errores de linting encontrados" -ForegroundColor Yellow
    Write-Host "   Ejecuta 'pnpm lint:fix' para corregir automáticamente" -ForegroundColor Yellow
    $ErrorCount++
} else {
    Write-Host "✅ Linting exitoso" -ForegroundColor Green
}
Write-Host ""

# 7. Build de prueba
Write-Host "🏗️  Ejecutando build de prueba..." -ForegroundColor Yellow
$buildOutput = pnpm build:vercel 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en build:" -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Build exitoso" -ForegroundColor Green
}
Write-Host ""

# 8. Verificar archivos generados
Write-Host "📂 Verificando archivos generados..." -ForegroundColor Yellow
if (!(Test-Path "dist/index.html")) {
    Write-Host "❌ Error: No se generó dist/index.html" -ForegroundColor Red
    exit 1
}
if (!(Test-Path "dist/assets")) {
    Write-Host "❌ Error: No se generó carpeta dist/assets" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Archivos generados correctamente" -ForegroundColor Green
Write-Host ""

# 9. Verificar tamaño del build
Write-Host "📊 Analizando tamaño del build..." -ForegroundColor Yellow
$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   Tamaño total: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
if ($distSize -gt 10) {
    Write-Host "⚠️  Advertencia: Build grande (>10MB). Considera optimizar." -ForegroundColor Yellow
}
Write-Host ""

# 10. Verificar vercel.json en la raíz
Write-Host "🔧 Verificando configuración de Vercel..." -ForegroundColor Yellow
if (!(Test-Path "../../vercel.json")) {
    Write-Host "⚠️  Advertencia: No se encuentra vercel.json en la raíz" -ForegroundColor Yellow
} else {
    Write-Host "✅ vercel.json encontrado" -ForegroundColor Green
}
Write-Host ""

# Resumen
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($ErrorCount -eq 0) {
    Write-Host "✅ ¡TODO LISTO PARA DEPLOY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. git add ." -ForegroundColor White
    Write-Host "2. git commit -m 'chore: prepare for deployment'" -ForegroundColor White
    Write-Host "3. git push origin main" -ForegroundColor White
    Write-Host ""
    Write-Host "O usa Vercel CLI:" -ForegroundColor Cyan
    Write-Host "   vercel --prod" -ForegroundColor White
} else {
    Write-Host "⚠️  HAY $ErrorCount ADVERTENCIAS" -ForegroundColor Yellow
    Write-Host "   Revisa los mensajes anteriores antes de deployar" -ForegroundColor Yellow
}
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Para más información, lee: ../../VERCEL_DEPLOY_CLIENT.md" -ForegroundColor Cyan
