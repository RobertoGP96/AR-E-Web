#!/usr/bin/env python3
"""
Script para probar el endpoint de creación de usuarios administrativos
"""

import requests
import json
import sys

# Configuración del endpoint
BASE_URL = "http://localhost:8000"  # Cambiar según tu configuración
ENDPOINT = "/admin/create/"
SECRET_KEY = "change-this-secret-key-in-production"  # Clave por defecto del settings.py

def test_create_admin():
    """Prueba la creación de un usuario administrador"""
    
    url = f"{BASE_URL}{ENDPOINT}"
    
    # Datos de prueba para crear un administrador
    test_data = {
        "secret_key": SECRET_KEY,
        "name": "Admin",
        "last_name": "Prueba",
        "email": "admin@test.com",
        "phone_number": "+5355123456",
        "home_address": "123 Admin Street",
        # "password": "admin123"  # Si no se proporciona, se genera automáticamente
    }
    
    try:
        print("🚀 Probando endpoint de creación de administrador...")
        print(f"📍 URL: {url}")
        print(f"📝 Datos: {json.dumps(test_data, indent=2)}")
        print()
        
        # Realizar la petición POST
        response = requests.post(url, json=test_data)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response:")
        
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2))
            
            if response.status_code == 201:
                print("\n✅ Usuario administrador creado exitosamente!")
                if 'admin_user' in response_json and 'password' in response_json['admin_user']:
                    print(f"🔑 Contraseña generada: {response_json['admin_user']['password']}")
                    print(f"📧 Email: {response_json['admin_user']['email']}")
                    print(f"📱 Teléfono: {response_json['admin_user']['phone_number']}")
            else:
                print(f"\n❌ Error al crear usuario administrador")
                
        except json.JSONDecodeError:
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión. Asegúrate de que el servidor Django esté corriendo.")
        print("   Ejecuta: python manage.py runserver")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False
    
    return response.status_code == 201

def test_invalid_secret():
    """Prueba con clave secreta incorrecta"""
    
    url = f"{BASE_URL}{ENDPOINT}"
    
    test_data = {
        "secret_key": "clave-incorrecta",
        "name": "Admin",
        "last_name": "Prueba", 
        "phone_number": "+5355123457",
        "home_address": "123 Admin Street"
    }
    
    print("\n🔒 Probando con clave secreta incorrecta...")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Validación de clave secreta funcionando correctamente")
        else:
            print("❌ La validación de clave secreta no funcionó como se esperaba")
            
        print(f"📄 Response: {response.json()}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 PRUEBA DEL ENDPOINT DE CREACIÓN DE ADMINISTRADORES")
    print("=" * 60)
    
    # Probar creación exitosa
    success = test_create_admin()
    
    # Probar validación de clave secreta
    test_invalid_secret()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Todas las pruebas completadas exitosamente")
    else:
        print("❌ Algunas pruebas fallaron")
    print("=" * 60)