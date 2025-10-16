# Script PowerShell para crear superusuario localmente
param(
    [string]$Username = "admin",
    [string]$Email = "admin@ejemplo.com",
    [string]$Password = "admin123"
)

Write-Host "=== CREANDO SUPERUSUARIO DJANGO ===" -ForegroundColor Cyan
Write-Host

# Cambiar al directorio backend
if (Test-Path "backend") {
    Set-Location "backend"
    Write-Host "OK Cambiado al directorio backend" -ForegroundColor Green
} elseif (Test-Path "manage.py") {
    Write-Host "OK Ya en directorio Django" -ForegroundColor Green
} else {
    Write-Host "ERROR No se encontro manage.py o directorio backend" -ForegroundColor Red
    exit 1
}

# Verificar que manage.py existe
if (-not (Test-Path "manage.py")) {
    Write-Host "ERROR manage.py no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "Creando superusuario con:" -ForegroundColor Yellow
Write-Host "  Username: $Username" -ForegroundColor Gray
Write-Host "  Email: $Email" -ForegroundColor Gray
Write-Host "  Password: $Password" -ForegroundColor Gray
Write-Host

# Ejecutar comando
try {
    $env:DJANGO_SUPERUSER_USERNAME = $Username
    $env:DJANGO_SUPERUSER_EMAIL = $Email
    $env:DJANGO_SUPERUSER_PASSWORD = $Password
    
    python manage.py create_admin
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host
        Write-Host "OK Superusuario creado exitosamente" -ForegroundColor Green
        Write-Host "URL Admin: http://localhost:8000/admin/" -ForegroundColor Cyan
        Write-Host "Username: $Username" -ForegroundColor White
        Write-Host "Password: $Password" -ForegroundColor White
    } else {
        Write-Host "ERROR creando superusuario" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR ejecutando comando: $_" -ForegroundColor Red
}

Write-Host
Write-Host "=== FIN CREACION SUPERUSUARIO ===" -ForegroundColor Cyan