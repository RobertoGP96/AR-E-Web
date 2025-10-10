"""
Script manual para probar actualizaciones parciales de usuarios
Ejecutar con: python test_partial_update_manual.py
"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/arye_system"

# Generar datos únicos con timestamp
timestamp = int(time.time())
TEST_EMAIL = f"prueba{timestamp}@test.com"
TEST_PHONE = f"12345{timestamp % 100000}"

def print_separator():
    print("\n" + "="*80 + "\n")

def test_partial_updates():
    """Prueba las actualizaciones parciales de usuarios"""
    
    print("🔍 VERIFICACIÓN DE ACTUALIZACIONES PARCIALES DE USUARIOS")
    print_separator()
    
    # Paso 1: Crear un usuario de prueba
    print("📝 PASO 1: Creando usuario de prueba...")
    user_data = {
        "email": TEST_EMAIL,
        "name": "Usuario",
        "last_name": "Prueba",
        "phone_number": TEST_PHONE,
        "password": "password123",
        "role": "user",
        "home_address": "Dirección Original"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api_data/user/",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            user = response.json()
            user_id = user['id']
            print(f"✅ Usuario creado exitosamente con ID: {user_id}")
            print(f"   Datos: {json.dumps(user, indent=2)}")
        else:
            print(f"❌ Error al crear usuario: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        print("   Asegúrate de que el servidor Django esté corriendo en http://127.0.0.1:8000")
        return
    
    print_separator()
    
    # Paso 2: Obtener el usuario para tener un token (normalmente se haría login)
    print("🔑 PASO 2: Intentando autenticación...")
    auth_data = {
        "email": TEST_EMAIL,
        "password": "password123"
    }
    
    try:
        auth_response = requests.post(
            f"{BASE_URL}/auth/",
            json=auth_data,
            headers={"Content-Type": "application/json"}
        )
        
        if auth_response.status_code == 200:
            tokens = auth_response.json()
            access_token = tokens.get('access')
            print(f"✅ Autenticación exitosa")
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
        else:
            print(f"⚠️  Autenticación falló: {auth_response.status_code}")
            print(f"   Respuesta: {auth_response.text}")
            print("   Continuando sin token...")
            headers = {"Content-Type": "application/json"}
    except Exception as e:
        print(f"⚠️  Error en autenticación: {e}")
        print("   Continuando sin token...")
        headers = {"Content-Type": "application/json"}
    
    print_separator()
    
    # Paso 3: Actualizar solo el nombre
    print("📝 PASO 3: Actualizando SOLO el nombre...")
    partial_data = {"name": "NombreActualizado"}
    
    response = requests.patch(
        f"{BASE_URL}/api_data/user/{user_id}/",
        json=partial_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated_user = response.json()
        print(f"✅ Actualización parcial exitosa!")
        print(f"   Nombre actualizado: {updated_user['name']}")
        print(f"   Apellido sin cambios: {updated_user['last_name']}")
        print(f"   Email sin cambios: {updated_user.get('email', 'N/A')}")
        print(f"   Teléfono sin cambios: {updated_user['phone_number']}")
        print(f"   Dirección sin cambios: {updated_user.get('home_address', 'N/A')}")
    else:
        print(f"❌ Error en actualización: {response.status_code}")
        print(f"   Respuesta: {response.text}")
    
    print_separator()
    
    # Paso 4: Actualizar solo el teléfono
    print("📝 PASO 4: Actualizando SOLO el teléfono...")
    partial_data = {"phone_number": "9876543210"}
    
    response = requests.patch(
        f"{BASE_URL}/api_data/user/{user_id}/",
        json=partial_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated_user = response.json()
        print(f"✅ Actualización parcial exitosa!")
        print(f"   Teléfono actualizado: {updated_user['phone_number']}")
        print(f"   Nombre sin cambios: {updated_user['name']}")
        print(f"   Apellido sin cambios: {updated_user['last_name']}")
    else:
        print(f"❌ Error en actualización: {response.status_code}")
        print(f"   Respuesta: {response.text}")
    
    print_separator()
    
    # Paso 5: Actualizar solo la dirección
    print("📝 PASO 5: Actualizando SOLO la dirección...")
    partial_data = {"home_address": "Nueva Dirección 123"}
    
    response = requests.patch(
        f"{BASE_URL}/api_data/user/{user_id}/",
        json=partial_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated_user = response.json()
        print(f"✅ Actualización parcial exitosa!")
        print(f"   Dirección actualizada: {updated_user.get('home_address', 'N/A')}")
        print(f"   Nombre sin cambios: {updated_user['name']}")
        print(f"   Teléfono sin cambios: {updated_user['phone_number']}")
    else:
        print(f"❌ Error en actualización: {response.status_code}")
        print(f"   Respuesta: {response.text}")
    
    print_separator()
    
    # Paso 6: Actualizar múltiples campos
    print("📝 PASO 6: Actualizando MÚLTIPLES campos (nombre y apellido)...")
    partial_data = {
        "name": "NombreFinal",
        "last_name": "ApellidoFinal"
    }
    
    response = requests.patch(
        f"{BASE_URL}/api_data/user/{user_id}/",
        json=partial_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated_user = response.json()
        print(f"✅ Actualización parcial exitosa!")
        print(f"   Nombre actualizado: {updated_user['name']}")
        print(f"   Apellido actualizado: {updated_user['last_name']}")
        print(f"   Teléfono sin cambios: {updated_user['phone_number']}")
        print(f"   Dirección sin cambios: {updated_user.get('home_address', 'N/A')}")
    else:
        print(f"❌ Error en actualización: {response.status_code}")
        print(f"   Respuesta: {response.text}")
    
    print_separator()
    
    # Paso 7: Verificar el usuario final
    print("🔍 PASO 7: Verificando estado final del usuario...")
    response = requests.get(
        f"{BASE_URL}/api_data/user/{user_id}/",
        headers=headers
    )
    
    if response.status_code == 200:
        final_user = response.json()
        print(f"✅ Usuario obtenido exitosamente:")
        print(json.dumps(final_user, indent=2, ensure_ascii=False))
    else:
        print(f"❌ Error al obtener usuario: {response.status_code}")
    
    print_separator()
    
    # Paso 8: Limpiar - Eliminar usuario de prueba
    print("🧹 PASO 8: Limpiando - Eliminando usuario de prueba...")
    response = requests.delete(
        f"{BASE_URL}/api_data/user/{user_id}/",
        headers=headers
    )
    
    if response.status_code in [200, 204]:
        print(f"✅ Usuario de prueba eliminado exitosamente")
    else:
        print(f"⚠️  No se pudo eliminar el usuario (ID: {user_id})")
        print(f"   Puedes eliminarlo manualmente desde el admin de Django")
    
    print_separator()
    print("✨ VERIFICACIÓN COMPLETADA")
    print_separator()

if __name__ == "__main__":
    test_partial_updates()
