# Script para Validar Configuracion CORS
Write-Host "=== VALIDACION DE CONFIGURACION CORS ===" -ForegroundColor Cyan
Write-Host

# Verificar configuracion CORS en settings.py
Write-Host "1. Verificando configuracion CORS en settings.py:" -ForegroundColor Yellow

$settingsPath = "backend/config/settings.py"
if (Test-Path $settingsPath) {
    $settingsContent = Get-Content $settingsPath -Raw
    
    if ($settingsContent -match "CORS_ALLOWED_ORIGINS") {
        Write-Host "   ✅ CORS_ALLOWED_ORIGINS configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ CORS_ALLOWED_ORIGINS no encontrado" -ForegroundColor Red
    }
    
    if ($settingsContent -match "CORS_ALLOW_CREDENTIALS") {
        Write-Host "   ✅ CORS_ALLOW_CREDENTIALS configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ CORS_ALLOW_CREDENTIALS no configurado" -ForegroundColor Red
    }
    
    if ($settingsContent -match "corsheaders") {
        Write-Host "   ✅ django-cors-headers instalado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ django-cors-headers no encontrado" -ForegroundColor Red
    }
    
    if ($settingsContent -match "corsheaders.middleware.CorsMiddleware") {
        Write-Host "   ✅ CorsMiddleware configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ CorsMiddleware no configurado en MIDDLEWARE" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ settings.py no encontrado" -ForegroundColor Red
}

Write-Host
Write-Host "2. Variables de entorno para Render:" -ForegroundColor Yellow
Write-Host "   Configura estas variables en Render Dashboard:" -ForegroundColor Gray
Write-Host
Write-Host "   Para ver documentacion desde navegador:" -ForegroundColor Cyan
Write-Host "   CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com" -ForegroundColor White
Write-Host
Write-Host "   Para conectar frontend desde Vercel:" -ForegroundColor Cyan
Write-Host "   CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com,https://tu-frontend.vercel.app" -ForegroundColor White
Write-Host
Write-Host "   Para desarrollo + produccion:" -ForegroundColor Cyan
Write-Host "   CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com,https://tu-frontend.vercel.app,http://localhost:5173" -ForegroundColor White
Write-Host
Write-Host "   Para desarrollo rapido (SOLO testing):" -ForegroundColor Cyan
Write-Host "   CORS_ALLOW_ALL_ORIGINS=True" -ForegroundColor White
Write-Host

Write-Host "3. URLs de documentacion:" -ForegroundColor Yellow
Write-Host "   Una vez desplegado en Render:" -ForegroundColor Gray
Write-Host "   📋 Swagger UI: https://tu-app-name.onrender.com/api/docs/" -ForegroundColor Green
Write-Host "   📄 ReDoc: https://tu-app-name.onrender.com/api/redoc/" -ForegroundColor Green
Write-Host "   ⚙️  Schema: https://tu-app-name.onrender.com/api/schema/" -ForegroundColor Green
Write-Host "   👮 Admin: https://tu-app-name.onrender.com/admin/" -ForegroundColor Green
Write-Host

Write-Host "4. Prueba CORS desde navegador:" -ForegroundColor Yellow
Write-Host "   Abre la consola en tu app desplegada y ejecuta:" -ForegroundColor Gray
Write-Host "   fetch('/arye_system/api_data/user/').then(r => r.json()).then(console.log)" -ForegroundColor Cyan
Write-Host

Write-Host "5. Configuracion recomendada para Render:" -ForegroundColor Yellow
Write-Host "   SECRET_KEY=tu_clave_secreta_segura" -ForegroundColor Gray
Write-Host "   DEBUG=False" -ForegroundColor Gray
Write-Host "   ALLOWED_HOSTS=tu-app-name.onrender.com" -ForegroundColor Gray
Write-Host "   CORS_ALLOWED_ORIGINS=https://tu-app-name.onrender.com" -ForegroundColor Gray
Write-Host

Write-Host "=== FIN VALIDACION CORS ===" -ForegroundColor Cyan