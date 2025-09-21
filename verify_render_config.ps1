# Verificación de configuración para Render
Write-Host "=== VERIFICACIÓN DE CONFIGURACIÓN PARA RENDER ===" -ForegWrite-Host "=== FIN DE VERIFICACION ===" -ForegroundColor CyanoundColor Cyan
Write-Host

# Verificar estructura del proyecto
Write-Host "1. Verificando estructura del proyecto:" -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "   ✅ Directorio backend encontrado" -ForegroundColor Green
    if (Test-Path "backend/manage.py") {
        Write-Host "   ✅ manage.py encontrado en backend" -ForegroundColor Green
    } else {
        Write-Host "   ❌ manage.py NO encontrado en backend" -ForegroundColor Red
    }
    if (Test-Path "backend/requirements.txt") {
        Write-Host "   ✅ requirements.txt encontrado en backend" -ForegroundColor Green
    } else {
        Write-Host "   ❌ requirements.txt NO encontrado en backend" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Directorio backend NO encontrado" -ForegroundColor Red
}

Write-Host

# Verificar archivos de configuración
Write-Host "2. Verificando archivos de configuración:" -ForegroundColor Yellow
if (Test-Path "render.yaml") {
    Write-Host "   ✅ render.yaml encontrado en raíz" -ForegroundColor Green
} else {
    Write-Host "   ❌ render.yaml NO encontrado" -ForegroundColor Red
}

if (Test-Path "build.sh") {
    Write-Host "   ✅ build.sh encontrado en raíz" -ForegroundColor Green
} else {
    Write-Host "   ❌ build.sh NO encontrado en raíz" -ForegroundColor Red
}

Write-Host

# Verificar configuración Django
Write-Host "3. Verificando configuración Django:" -ForegroundColor Yellow
if (Test-Path "backend/config/settings.py") {
    Write-Host "   ✅ settings.py encontrado" -ForegroundColor Green
    
    $settingsContent = Get-Content "backend/config/settings.py" -Raw
    
    if ($settingsContent -match "ALLOWED_HOSTS") {
        Write-Host "   ✅ ALLOWED_HOSTS configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ALLOWED_HOSTS no encontrado" -ForegroundColor Red
    }
    
    if ($settingsContent -match "CORS_ALLOWED_ORIGINS") {
        Write-Host "   ✅ CORS_ALLOWED_ORIGINS configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ CORS_ALLOWED_ORIGINS no encontrado" -ForegroundColor Red
    }
    
    if ($settingsContent -match "WhiteNoiseMiddleware") {
        Write-Host "   ✅ WhiteNoise configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ WhiteNoise no configurado" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ settings.py NO encontrado" -ForegroundColor Red
}

Write-Host

# Verificar wsgi.py
Write-Host "4. Verificando WSGI:" -ForegroundColor Yellow
if (Test-Path "backend/config/wsgi.py") {
    Write-Host "   ✅ wsgi.py encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ wsgi.py NO encontrado" -ForegroundColor Red
}

Write-Host

# Mostrar contenido de render.yaml
if (Test-Path "render.yaml") {
    Write-Host "5. Contenido de render.yaml:" -ForegroundColor Yellow
    Write-Host "   ---" -ForegroundColor Gray
    Get-Content "render.yaml" | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host "   ---" -ForegroundColor Gray
}

Write-Host
Write-Host "=== INSTRUCCIONES PARA RENDER ===" -ForegroundColor Cyan
Write-Host
Write-Host "Para desplegar en Render:" -ForegroundColor White
Write-Host "1. Hacer commit de los cambios:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Fix Render deployment configuration'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host
Write-Host "2. En Render Dashboard:" -ForegroundColor Yellow
Write-Host "   - Crear nuevo Web Service" -ForegroundColor Gray
Write-Host "   - Conectar repositorio AR-E-Web" -ForegroundColor Gray
Write-Host "   - Render detectará automáticamente render.yaml" -ForegroundColor Gray
Write-Host "   - O configurar manualmente:" -ForegroundColor Gray
Write-Host "     * Root Directory: backend" -ForegroundColor Gray
Write-Host "     * Build Command: ./build.sh" -ForegroundColor Gray
Write-Host "     * Start Command: gunicorn config.wsgi:application" -ForegroundColor Gray
Write-Host
Write-Host "3. Configurar variables de entorno en Render:" -ForegroundColor Yellow
Write-Host "   - SECRET_KEY=tu_clave_secreta" -ForegroundColor Gray
Write-Host "   - DEBUG=False" -ForegroundColor Gray
Write-Host "   - ALLOWED_HOSTS=tu-app.onrender.com" -ForegroundColor Gray
Write-Host "   - CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app" -ForegroundColor Gray
Write-Host
Write-Host "4. Crear y conectar base de datos PostgreSQL" -ForegroundColor Yellow
Write-Host
Write-Host "=== FIN DE VERIFICACIÓN ===" -ForegroundColor Cyan