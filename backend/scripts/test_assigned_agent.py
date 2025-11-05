"""
Script para probar la asignación de agente en usuarios
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CustomUser
from api.serializers import UserSerializer

print("=== Test de Asignación de Agente ===\n")

# 1. Verificar que tenemos agentes
agents = CustomUser.objects.filter(role='agent')
print(f"✓ Agentes disponibles: {agents.count()}")
for agent in agents:
    print(f"  - {agent.full_name} (ID: {agent.id})")

# 2. Verificar que tenemos clientes
clients = CustomUser.objects.filter(role='client')
print(f"\n✓ Clientes existentes: {clients.count()}")
for client in clients:
    agent_info = f"Agente: {client.assigned_agent.full_name}" if client.assigned_agent else "Sin agente"
    print(f"  - {client.full_name} (ID: {client.id}) - {agent_info}")

# 3. Test del serializer - Verificar que assigned_agent está en los campos
serializer = UserSerializer()
print(f"\n✓ Campos del UserSerializer:")
print(f"  {', '.join(serializer.Meta.fields)}")
print(f"\n✓ Campo 'assigned_agent' presente: {'assigned_agent' in serializer.Meta.fields}")

# 4. Test de creación de usuario con agente asignado
if agents.exists():
    agent = agents.first()
    print(f"\n=== Test de Creación de Usuario con Agente ===")
    print(f"Agente a asignar: {agent.full_name} (ID: {agent.id})")
    
    test_data = {
        'name': 'Test',
        'last_name': 'Usuario',
        'phone_number': '+1234567899',
        'password': 'test123',
        'role': 'client',
        'assigned_agent': agent.id,
        'email': 'test@example.com',
        'home_address': 'Test Address'
    }
    
    print(f"\nDatos a enviar:")
    print(json.dumps({k: v for k, v in test_data.items() if k != 'password'}, indent=2))
    
    serializer = UserSerializer(data=test_data)
    if serializer.is_valid():
        print("\n✓ Validación exitosa")
        print(f"✓ assigned_agent en validated_data: {'assigned_agent' in serializer.validated_data}")
        if 'assigned_agent' in serializer.validated_data:
            print(f"✓ Valor de assigned_agent: {serializer.validated_data['assigned_agent']}")
        
        # No guardar realmente, solo probar validación
        print("\n✓ El serializer aceptaría este usuario correctamente")
    else:
        print("\n✗ Error de validación:")
        print(json.dumps(serializer.errors, indent=2))

# 5. Test de actualización de cliente existente
if clients.exists() and agents.exists():
    client = clients.first()
    agent = agents.first()
    
    print(f"\n=== Test de Actualización de Cliente ===")
    print(f"Cliente: {client.full_name} (ID: {client.id})")
    print(f"Agente actual: {client.assigned_agent.full_name if client.assigned_agent else 'Ninguno'}")
    print(f"Nuevo agente: {agent.full_name} (ID: {agent.id})")
    
    update_data = {
        'assigned_agent': agent.id
    }
    
    serializer = UserSerializer(client, data=update_data, partial=True)
    if serializer.is_valid():
        print("\n✓ Validación de actualización exitosa")
        print(f"✓ assigned_agent en validated_data: {'assigned_agent' in serializer.validated_data}")
        if 'assigned_agent' in serializer.validated_data:
            print(f"✓ Nuevo valor: {serializer.validated_data['assigned_agent']}")
        
        # No guardar realmente
        print("\n✓ La actualización funcionaría correctamente")
    else:
        print("\n✗ Error de validación:")
        print(json.dumps(serializer.errors, indent=2))

print("\n" + "="*60)
print("✅ Test completado")
print("="*60)
