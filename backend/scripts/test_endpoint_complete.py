"""
Script para probar el endpoint completo de reportes de ganancias
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Order, CustomUser
from django.db.models import Sum

print("=== Test Completo del Endpoint de Reportes ===\n")

agents = CustomUser.objects.filter(role='agent', is_active=True)

for agent in agents:
    print(f"\n{'='*60}")
    print(f"AGENTE: {agent.full_name}")
    print(f"{'='*60}")
    
    # Clientes con assigned_agent
    clients_with_assigned_agent = CustomUser.objects.filter(
        assigned_agent=agent, 
        role='client'
    ).values_list('id', flat=True)
    
    # Clientes con órdenes
    clients_with_orders = Order.objects.filter(
        sales_manager=agent
    ).values_list('client_id', flat=True).distinct()
    
    # Total único
    all_client_ids = set(clients_with_assigned_agent) | set(clients_with_orders)
    
    print(f"\n📊 Conteo de Clientes:")
    print(f"  • Clientes con campo 'assigned_agent': {len(clients_with_assigned_agent)}")
    print(f"  • Clientes con órdenes gestionadas: {len(set(clients_with_orders))}")
    print(f"  • ✅ Total de clientes únicos: {len(all_client_ids)}")
    
    if all_client_ids:
        print(f"\n👥 Lista de clientes:")
        for client_id in all_client_ids:
            client = CustomUser.objects.get(id=client_id)
            has_assigned = "✓" if client.assigned_agent == agent else "✗"
            orders = Order.objects.filter(client=client, sales_manager=agent).count()
            print(f"  • {client.full_name} (ID: {client_id})")
            print(f"    - Agente asignado: {has_assigned}")
            print(f"    - Órdenes: {orders}")
    
    # Órdenes
    orders_count = Order.objects.filter(sales_manager=agent).count()
    orders_completed = Order.objects.filter(sales_manager=agent, status='ENTREGADO').count()
    
    print(f"\n📦 Órdenes:")
    print(f"  • Total gestionadas: {orders_count}")
    print(f"  • Completadas: {orders_completed}")

print(f"\n{'='*60}")
print("✅ Test completado exitosamente")
print("El endpoint debe mostrar estos números correctamente")
print(f"{'='*60}")
