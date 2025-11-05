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
    phone_number = os.environ.get('DJANGO_SUPERUSER_PHONE', '53123456')
    name = os.environ.get('DJANGO_SUPERUSER_NAME', 'Admin')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@ejemplo.com')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
    
    # Verificar si el usuario ya existe
    if User.objects.filter(phone_number=phone_number).exists():
        print(f"⚠️  El superusuario con teléfono '{phone_number}' ya existe")
        return
    
    # Crear superusuario
    try:
        user = User.objects.create_superuser(
            phone_number=phone_number,
            name=name,
            email=email,
            password=password
        )
        user.role = 'admin'
        user.is_staff = True
        user.is_superuser = True
        user.is_verified = True
        user.save()
        
        print(f"✅ Superusuario creado exitosamente")
        print(f"📱 Teléfono: {phone_number}")
        print(f"👤 Nombre: {name}")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")
        print(f"🌐 Admin URL: /admin/")
    except Exception as e:
        print(f"❌ Error creando superusuario: {e}")

if __name__ == '__main__':
    create_superuser()