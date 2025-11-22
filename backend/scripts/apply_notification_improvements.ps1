# Script para aplicar mejoras de notificaciones
# Ejecutar desde: backend/

Write-Host "🚀 Aplicando mejoras del sistema de notificaciones..." -ForegroundColor Cyan
Write-Host ""

# 1. Crear migraciones
Write-Host "📝 Creando migraciones para índices..." -ForegroundColor Yellow
python manage.py makemigrations api --name add_notification_indexes

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al crear migraciones" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migraciones creadas" -ForegroundColor Green
Write-Host ""

# 2. Aplicar migraciones
Write-Host "🔧 Aplicando migraciones..." -ForegroundColor Yellow
python manage.py migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al aplicar migraciones" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migraciones aplicadas" -ForegroundColor Green
Write-Host ""

# 3. Ejecutar tests
Write-Host "🧪 Ejecutando tests de notificaciones..." -ForegroundColor Yellow
python manage.py test api.tests.test_notifications --verbosity=2

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Algunos tests fallaron - Revisa la salida" -ForegroundColor Yellow
} else {
    Write-Host "✅ Todos los tests pasaron" -ForegroundColor Green
}

Write-Host ""

# 4. Probar comando de limpieza (dry-run)
Write-Host "🧹 Probando comando de limpieza (dry-run)..." -ForegroundColor Yellow
python manage.py clean_notifications --dry-run

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✨ Mejoras aplicadas exitosamente" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Revisar las migraciones generadas"
Write-Host "   2. Configurar limpieza automática (cron/scheduler)"
Write-Host "   3. Ver documentación en: doc/NOTIFICATIONS_HIGH_PRIORITY_IMPROVEMENTS.md"
Write-Host ""
