#!/bin/bash
# Script para crear superusuario Django

# Valores por defecto
USERNAME=${1:-"admin"}
EMAIL=${2:-"admin@ejemplo.com"}
PASSWORD=${3:-"admin123"}

echo "=== CREANDO SUPERUSUARIO DJANGO ==="
echo

# Cambiar al directorio backend
if [ -d "backend" ]; then
    cd backend
    echo "✅ Cambiado al directorio backend"
elif [ -f "manage.py" ]; then
    echo "✅ Ya en directorio Django"
else
    echo "❌ No se encontró manage.py o directorio backend"
    exit 1
fi

# Verificar que manage.py existe
if [ ! -f "manage.py" ]; then
    echo "❌ manage.py no encontrado"
    exit 1
fi

echo "Creando superusuario con:"
echo "  Username: $USERNAME"
echo "  Email: $EMAIL"
echo "  Password: $PASSWORD"
echo

# Configurar variables de entorno
export DJANGO_SUPERUSER_USERNAME="$USERNAME"
export DJANGO_SUPERUSER_EMAIL="$EMAIL"
export DJANGO_SUPERUSER_PASSWORD="$PASSWORD"

# Ejecutar comando
python manage.py create_admin

if [ $? -eq 0 ]; then
    echo
    echo "✅ Superusuario creado exitosamente"
    echo "🌐 Accede al admin en: http://localhost:8000/admin/"
    echo "👤 Username: $USERNAME"
    echo "🔑 Password: $PASSWORD"
else
    echo "❌ Error creando superusuario"
    exit 1
fi

echo
echo "=== FIN CREACION SUPERUSUARIO ==="