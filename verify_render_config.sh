#!/usr/bin/env bash

echo "=== VERIFICACIÓN DE CONFIGURACIÓN PARA RENDER ==="
echo

# Verificar estructura del proyecto
echo "1. Verificando estructura del proyecto:"
if [ -d "backend" ]; then
    echo "   ✅ Directorio backend encontrado"
    if [ -f "backend/manage.py" ]; then
        echo "   ✅ manage.py encontrado en backend"
    else
        echo "   ❌ manage.py NO encontrado en backend"
    fi
    if [ -f "backend/requirements.txt" ]; then
        echo "   ✅ requirements.txt encontrado en backend"
    else
        echo "   ❌ requirements.txt NO encontrado en backend"
    fi
else
    echo "   ❌ Directorio backend NO encontrado"
fi

echo

# Verificar archivos de configuración
echo "2. Verificando archivos de configuración:"
if [ -f "render.yaml" ]; then
    echo "   ✅ render.yaml encontrado en raíz"
else
    echo "   ❌ render.yaml NO encontrado"
fi

if [ -f "build.sh" ]; then
    echo "   ✅ build.sh encontrado en raíz"
    if [ -x "build.sh" ]; then
        echo "   ✅ build.sh es ejecutable"
    else
        echo "   ⚠️  build.sh no es ejecutable (ejecutar: chmod +x build.sh)"
    fi
else
    echo "   ❌ build.sh NO encontrado en raíz"
fi

echo

# Verificar configuración Django
echo "3. Verificando configuración Django:"
if [ -f "backend/config/settings.py" ]; then
    echo "   ✅ settings.py encontrado"
    
    # Verificar configuraciones importantes
    if grep -q "ALLOWED_HOSTS" backend/config/settings.py; then
        echo "   ✅ ALLOWED_HOSTS configurado"
    else
        echo "   ❌ ALLOWED_HOSTS no encontrado"
    fi
    
    if grep -q "CORS_ALLOWED_ORIGINS" backend/config/settings.py; then
        echo "   ✅ CORS_ALLOWED_ORIGINS configurado"
    else
        echo "   ❌ CORS_ALLOWED_ORIGINS no encontrado"
    fi
    
    if grep -q "WhiteNoiseMiddleware" backend/config/settings.py; then
        echo "   ✅ WhiteNoise configurado"
    else
        echo "   ❌ WhiteNoise no configurado"
    fi
else
    echo "   ❌ settings.py NO encontrado"
fi

echo

# Verificar wsgi.py
echo "4. Verificando WSGI:"
if [ -f "backend/config/wsgi.py" ]; then
    echo "   ✅ wsgi.py encontrado"
else
    echo "   ❌ wsgi.py NO encontrado"
fi

echo

# Mostrar contenido de render.yaml
if [ -f "render.yaml" ]; then
    echo "5. Contenido de render.yaml:"
    echo "   ---"
    cat render.yaml | sed 's/^/   /'
    echo "   ---"
fi

echo
echo "=== INSTRUCCIONES PARA RENDER ==="
echo
echo "Para desplegar en Render:"
echo "1. Hacer commit de los cambios:"
echo "   git add ."
echo "   git commit -m 'Fix Render deployment configuration'"
echo "   git push origin main"
echo
echo "2. En Render Dashboard:"
echo "   - Crear nuevo Web Service"
echo "   - Conectar repositorio AR-E-Web"
echo "   - Render detectará automáticamente render.yaml"
echo "   - O configurar manualmente:"
echo "     * Root Directory: backend"
echo "     * Build Command: ./build.sh"
echo "     * Start Command: gunicorn config.wsgi:application"
echo
echo "3. Configurar variables de entorno en Render:"
echo "   - SECRET_KEY=tu_clave_secreta"
echo "   - DEBUG=False"
echo "   - ALLOWED_HOSTS=tu-app.onrender.com"
echo "   - CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app"
echo
echo "4. Crear y conectar base de datos PostgreSQL"
echo
echo "=== FIN DE VERIFICACIÓN ==="