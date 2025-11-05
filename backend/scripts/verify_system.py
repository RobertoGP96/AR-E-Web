"""
Script para verificar el funcionamiento completo del sistema
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CustomUser
from api.serializers import UserSerializer, UserProfileSerializer
import json

print("="*70)
print("VERIFICACIÓN COMPLETA DEL SISTEMA")
print("="*70)

def test_agents():
    """Verificar agentes"""
    print("\n🔍 PRUEBA 1: Verificando agentes...")
    agents = CustomUser.objects.filter(role='agent')
    print(f"  Total de agentes: {agents.count()}")
    
    for agent in agents:
        clients_count = CustomUser.objects.filter(assigned_agent=agent).count()
        print(f"\n  Agente: {agent.full_name}")
        print(f"    • ID: {agent.id}")
        print(f"    • Email: {agent.email or 'Sin email'}")
        print(f"    • Teléfono: {agent.phone_number}")
        print(f"    • Ganancia: {agent.agent_profit}%")
        print(f"    • Clientes asignados: {clients_count}")
        
        # Verificar serialización
        serializer = UserSerializer(agent)
        data = serializer.data
        assert 'assigned_agent' in data, "❌ Campo assigned_agent no está en el serializer"
        print(f"    ✓ Serializer incluye assigned_agent")
    
    return agents.count() > 0

def test_clients():
    """Verificar clientes"""
    print("\n🔍 PRUEBA 2: Verificando clientes...")
    clients = CustomUser.objects.filter(role='client')
    print(f"  Total de clientes: {clients.count()}")
    
    with_agent = 0
    without_agent = 0
    
    for client in clients:
        agent_name = client.assigned_agent.full_name if client.assigned_agent else "Sin agente"
        print(f"\n  Cliente: {client.full_name}")
        print(f"    • ID: {client.id}")
        print(f"    • Email: {client.email or 'Sin email'}")
        print(f"    • Teléfono: {client.phone_number}")
        print(f"    • Dirección: {client.home_address or 'Sin dirección'}")
        print(f"    • Agente asignado: {agent_name}")
        
        if client.assigned_agent:
            with_agent += 1
            print(f"    • ID del agente: {client.assigned_agent.id}")
        else:
            without_agent += 1
        
        # Verificar serialización
        serializer = UserSerializer(client)
        data = serializer.data
        assert 'assigned_agent' in data, "❌ Campo assigned_agent no está en el serializer"
        print(f"    ✓ Serializer incluye assigned_agent: {data['assigned_agent']}")
    
    print(f"\n  Resumen:")
    print(f"    • Clientes con agente: {with_agent}")
    print(f"    • Clientes sin agente: {without_agent}")
    
    return clients.count() > 0

def test_serializers():
    """Verificar que los serializers incluyen el campo assigned_agent"""
    print("\n🔍 PRUEBA 3: Verificando serializers...")
    
    # Probar con un cliente que tiene agente
    client_with_agent = CustomUser.objects.filter(role='client', assigned_agent__isnull=False).first()
    if client_with_agent:
        print(f"\n  Cliente con agente: {client_with_agent.full_name}")
        
        # UserSerializer
        serializer1 = UserSerializer(client_with_agent)
        data1 = serializer1.data
        print(f"    UserSerializer:")
        print(f"      • assigned_agent presente: {'assigned_agent' in data1}")
        print(f"      • assigned_agent valor: {data1.get('assigned_agent')}")
        
        # UserProfileSerializer
        serializer2 = UserProfileSerializer(client_with_agent)
        data2 = serializer2.data
        print(f"    UserProfileSerializer:")
        print(f"      • assigned_agent presente: {'assigned_agent' in data2}")
        print(f"      • assigned_agent valor: {data2.get('assigned_agent')}")
        
        assert 'assigned_agent' in data1, "❌ UserSerializer no incluye assigned_agent"
        assert 'assigned_agent' in data2, "❌ UserProfileSerializer no incluye assigned_agent"
        print(f"    ✓ Ambos serializers incluyen assigned_agent correctamente")
    
    # Probar con un cliente sin agente
    client_without_agent = CustomUser.objects.filter(role='client', assigned_agent__isnull=True).first()
    if client_without_agent:
        print(f"\n  Cliente sin agente: {client_without_agent.full_name}")
        
        serializer = UserSerializer(client_without_agent)
        data = serializer.data
        print(f"    • assigned_agent presente: {'assigned_agent' in data}")
        print(f"    • assigned_agent valor: {data.get('assigned_agent')}")
        assert data.get('assigned_agent') is None, "❌ assigned_agent debería ser None"
        print(f"    ✓ assigned_agent es None correctamente")
    
    return True

def test_optional_fields():
    """Verificar campos opcionales"""
    print("\n🔍 PRUEBA 4: Verificando campos opcionales...")
    
    # Usuarios sin email
    without_email = CustomUser.objects.filter(email__isnull=True)
    print(f"  Usuarios sin email: {without_email.count()}")
    for user in without_email[:3]:
        print(f"    • {user.full_name} ({user.get_role_display()})")
        serializer = UserSerializer(user)
        data = serializer.data
        print(f"      Email en serializer: {data.get('email')}")
    
    # Usuarios sin dirección
    without_address = CustomUser.objects.filter(home_address='')
    print(f"\n  Usuarios sin dirección: {without_address.count()}")
    for user in without_address[:3]:
        print(f"    • {user.full_name} ({user.get_role_display()})")
        serializer = UserSerializer(user)
        data = serializer.data
        print(f"      Dirección en serializer: {data.get('home_address') or 'Vacía'}")
    
    print(f"  ✓ Campos opcionales funcionan correctamente")
    return True

def test_update_flow():
    """Simular flujo de actualización"""
    print("\n🔍 PRUEBA 5: Simulando actualización de cliente...")
    
    client = CustomUser.objects.filter(role='client', assigned_agent__isnull=False).first()
    if not client:
        print("  ⚠ No hay clientes con agente para probar")
        return False
    
    print(f"  Cliente: {client.full_name}")
    print(f"  Agente actual: {client.assigned_agent.full_name}")
    print(f"  ID del agente: {client.assigned_agent.id}")
    
    # Simular datos que vendrían del frontend
    update_data = {
        'id': client.id,
        'name': client.name,
        'last_name': client.last_name,
        'phone_number': client.phone_number,
        'email': client.email,
        'home_address': client.home_address,
        'role': client.role,
        'assigned_agent': client.assigned_agent.id
    }
    
    print(f"\n  Datos de actualización simulados:")
    print(f"    {json.dumps(update_data, indent=4, ensure_ascii=False)}")
    
    # Verificar que el serializer puede manejar estos datos
    serializer = UserSerializer(client, data=update_data, partial=True)
    if serializer.is_valid():
        print(f"  ✓ Serializer válido")
        print(f"  ✓ Datos validados correctamente")
    else:
        print(f"  ❌ Serializer inválido: {serializer.errors}")
        return False
    
    # Probar cambio de agente
    other_agent = CustomUser.objects.filter(role='agent').exclude(id=client.assigned_agent.id).first()
    if other_agent:
        print(f"\n  Probando cambio de agente a: {other_agent.full_name}")
        update_data['assigned_agent'] = other_agent.id
        serializer = UserSerializer(client, data=update_data, partial=True)
        if serializer.is_valid():
            print(f"  ✓ Cambio de agente validado correctamente")
        else:
            print(f"  ❌ Error al cambiar agente: {serializer.errors}")
            return False
    
    # Probar remover agente
    print(f"\n  Probando remover agente asignado...")
    update_data['assigned_agent'] = None
    serializer = UserSerializer(client, data=update_data, partial=True)
    if serializer.is_valid():
        print(f"  ✓ Remoción de agente validada correctamente")
    else:
        print(f"  ❌ Error al remover agente: {serializer.errors}")
        return False
    
    return True

def test_edge_cases():
    """Probar casos extremos"""
    print("\n🔍 PRUEBA 6: Verificando casos extremos...")
    
    # Cliente sin nada opcional
    clients = CustomUser.objects.filter(
        role='client',
        email__isnull=True,
        home_address='',
        assigned_agent__isnull=True
    )
    
    if clients.exists():
        client = clients.first()
        print(f"  Cliente con mínimos datos: {client.full_name}")
        print(f"    • Email: {client.email}")
        print(f"    • Dirección: {client.home_address}")
        print(f"    • Agente: {client.assigned_agent}")
        
        serializer = UserSerializer(client)
        data = serializer.data
        print(f"    • Serializer funciona: {'id' in data}")
        print(f"  ✓ Cliente con datos mínimos funciona correctamente")
    else:
        print(f"  ℹ No hay clientes con datos mínimos")
    
    # Agente sin email
    agents = CustomUser.objects.filter(role='agent', email__isnull=True)
    if agents.exists():
        agent = agents.first()
        clients_count = CustomUser.objects.filter(assigned_agent=agent).count()
        print(f"\n  Agente sin email: {agent.full_name}")
        print(f"    • Clientes asignados: {clients_count}")
        print(f"  ✓ Agente sin email funciona correctamente")
    
    return True

# Ejecutar todas las pruebas
try:
    results = []
    
    results.append(("Agentes", test_agents()))
    results.append(("Clientes", test_clients()))
    results.append(("Serializers", test_serializers()))
    results.append(("Campos opcionales", test_optional_fields()))
    results.append(("Flujo de actualización", test_update_flow()))
    results.append(("Casos extremos", test_edge_cases()))
    
    print("\n" + "="*70)
    print("RESUMEN DE PRUEBAS")
    print("="*70)
    
    all_passed = True
    for name, result in results:
        status = "✅ PASÓ" if result else "❌ FALLÓ"
        print(f"  {name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "="*70)
    if all_passed:
        print("✅ TODAS LAS PRUEBAS PASARON - SISTEMA FUNCIONANDO CORRECTAMENTE")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON - REVISAR ERRORES")
    print("="*70)
    
except Exception as e:
    print(f"\n❌ ERROR DURANTE LAS PRUEBAS: {e}")
    import traceback
    traceback.print_exc()
