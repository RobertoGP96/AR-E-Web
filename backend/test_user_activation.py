#!/usr/bin/env python
"""
Script para verificar que los usuarios se registren con cuentas activadas automáticamente.
"""
import os
import sys
import django

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CustomUser
from django.conf import settings

def test_user_activation():
    """Prueba la activación automática de usuarios"""
    
    print("=== Verificación de Activación Automática de Usuarios ===\n")
    
    # Verificar configuración
    email_verification_enabled = getattr(settings, 'ENABLE_EMAIL_VERIFICATION', False)
    print(f"1. ENABLE_EMAIL_VERIFICATION: {email_verification_enabled}")
    
    # Crear un usuario de prueba
    test_phone = "+5355555999"
    test_email = "test@example.com"
    test_name = "Usuario Prueba"
    
    # Eliminar usuario si existe
    CustomUser.objects.filter(phone_number=test_phone).delete()
    CustomUser.objects.filter(email=test_email).delete()
    
    print(f"\n2. Creando usuario de prueba...")
    print(f"   - Teléfono: {test_phone}")
    print(f"   - Email: {test_email}")
    print(f"   - Nombre: {test_name}")
    
    # Crear usuario usando el manager
    user = CustomUser.objects.create_user(
        phone_number=test_phone,
        email=test_email,
        name=test_name,
        last_name="Apellido",
        home_address="Dirección de prueba",
        password="123456"
    )
    
    print(f"\n3. Usuario creado - Verificando estado:")
    print(f"   - ID: {user.id}")
    print(f"   - is_active: {user.is_active}")
    print(f"   - is_verified: {user.is_verified}")
    print(f"   - sent_verification_email: {user.sent_verification_email}")
    print(f"   - verification_secret: {'Set' if user.verification_secret else 'None'}")
    
    # Verificar si puede hacer login
    authenticated = user.check_password("123456") and user.is_active
    print(f"\n4. ¿Puede hacer login? {authenticated}")
    
    if email_verification_enabled:
        print("\n⚠️  ADVERTENCIA: La verificación por email está HABILITADA")
        print("   Los usuarios necesitarán verificar su email para completar el registro")
    else:
        print("\n✅ CONFIGURACIÓN CORRECTA: La verificación por email está DESHABILITADA")
        print("   Los usuarios se activan automáticamente al registrarse")
    
    # Limpiar
    user.delete()
    print(f"\n5. Usuario de prueba eliminado")
    
    print("\n=== Prueba completada ===")
    
    return {
        'email_verification_enabled': email_verification_enabled,
        'user_active_by_default': user.is_active,
        'user_verified_by_default': user.is_verified,
        'can_login': authenticated
    }

if __name__ == "__main__":
    try:
        result = test_user_activation()
        
        print(f"\n=== RESUMEN ===")
        print(f"✅ Usuarios se activan automáticamente: {result['user_active_by_default']}")
        print(f"✅ Verificación automática: {not result['email_verification_enabled']}")
        print(f"✅ Pueden hacer login inmediatamente: {result['can_login']}")
        
        if result['email_verification_enabled']:
            print(f"\n⚠️  RECOMENDACIÓN: Deshabilitá la verificación por email")
            print(f"   Agregá ENABLE_EMAIL_VERIFICATION=False a tu archivo .env")
        else:
            print(f"\n🎉 CONFIGURACIÓN ÓPTIMA: Los usuarios se registran y activan automáticamente")
            
    except Exception as e:
        print(f"\n❌ Error en la prueba: {e}")
        sys.exit(1)