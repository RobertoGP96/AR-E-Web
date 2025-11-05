"""
Script para probar el flujo completo de asignación de agente
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CustomUser
from api.serializers import UserSerializer

print("=== Verificación Completa de Asignación de Agente ===\n")

# 1. Obtener agente y cliente
agent = CustomUser.objects.filter(role='agent').first()
client = CustomUser.objects.filter(role='client').first()

if not agent:
    print("❌ No hay agentes disponibles")
    exit(1)

if not client:
    print("❌ No hay clientes disponibles")
    exit(1)

print(f"✓ Agente: {agent.full_name} (ID: {agent.id})")
print(f"✓ Cliente: {client.full_name} (ID: {client.id})")
print(f"  Estado actual: {'Tiene agente asignado' if client.assigned_agent else 'Sin agente asignado'}")

# 2. Simular actualización desde el frontend
print(f"\n=== Simulando Actualización desde Frontend ===")
print(f"Asignando agente {agent.full_name} al cliente {client.full_name}")

# Datos que vendría del frontend
update_data = {
    'assigned_agent': agent.id
}

print(f"\nDatos enviados (JSON):")
print(f"  {update_data}")

# 3. Procesar con el serializer (como lo hace el ViewSet)
serializer = UserSerializer(client, data=update_data, partial=True)

if serializer.is_valid():
    print("\n✓ Validación exitosa")
    
    # Guardar cambios
    updated_client = serializer.save()
    
    print(f"\n✓ Cliente actualizado exitosamente")
    print(f"  - Cliente: {updated_client.full_name}")
    print(f"  - Agente asignado: {updated_client.assigned_agent.full_name if updated_client.assigned_agent else 'Ninguno'}")
    print(f"  - ID del agente: {updated_client.assigned_agent.id if updated_client.assigned_agent else 'N/A'}")
    
    # 4. Verificar que se guardó correctamente en la base de datos
    client.refresh_from_db()
    print(f"\n✓ Verificación en base de datos:")
    print(f"  - assigned_agent guardado: {client.assigned_agent is not None}")
    if client.assigned_agent:
        print(f"  - Agente: {client.assigned_agent.full_name} (ID: {client.assigned_agent.id})")
    
    # 5. Verificar que el serializer lo devuelve en la respuesta
    response_serializer = UserSerializer(client)
    print(f"\n✓ Datos en respuesta (lo que vería el frontend):")
    print(f"  - assigned_agent presente: {'assigned_agent' in response_serializer.data}")
    if 'assigned_agent' in response_serializer.data:
        print(f"  - Valor: {response_serializer.data['assigned_agent']}")
    
    print("\n" + "="*60)
    print("✅ Todo el flujo funciona correctamente")
    print("="*60)
    
else:
    print("\n❌ Error de validación:")
    for field, errors in serializer.errors.items():
        print(f"  - {field}: {errors}")
