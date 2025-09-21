"""
Script para crear superusuario usando variables de entorno
"""
import os
import django
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def create_superuser():
    """Crear superusuario usando variables de entorno"""
    User = get_user_model()
    
    # Obtener datos desde variables de entorno
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@ejemplo.com')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
    
    # Verificar si el usuario ya existe
    if User.objects.filter(username=username).exists():
        print(f"⚠️  El superusuario '{username}' ya existe")
        return
    
    # Crear superusuario
    try:
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f"✅ Superusuario '{username}' creado exitosamente")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")
        print(f"🌐 Admin URL: /admin/")
    except Exception as e:
        print(f"❌ Error creando superusuario: {e}")

if __name__ == '__main__':
    create_superuser()