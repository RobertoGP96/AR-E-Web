"""
Script para probar el endpoint de reportes de ganancias
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import DeliverReceip, Order, CustomUser
from django.db.models import Sum

print("=== Probando consultas de reportes de ganancias ===\n")

# Verificar agentes
agents = CustomUser.objects.filter(role='agent', is_active=True)
print(f"✓ Número de agentes activos: {agents.count()}")

# Verificar deliveries
deliveries = DeliverReceip.objects.all()
print(f"✓ Total de deliveries: {deliveries.count()}")

# Verificar órdenes
orders = Order.objects.all()
print(f"✓ Total de órdenes: {orders.count()}")

print("\n=== Probando consultas por agente ===\n")

for agent in agents[:3]:  # Probar con los primeros 3 agentes
    print(f"\nAgente: {agent.full_name}")
    
    # Consulta corregida: usando client__assigned_agent
    total_profit = DeliverReceip.objects.filter(
        client__assigned_agent=agent
    ).aggregate(total=Sum('manager_profit'))['total'] or 0
    
    print(f"  - Total de ganancias: ${total_profit}")
    
    # Clientes asignados (nueva lógica)
    clients_with_assigned_agent = CustomUser.objects.filter(
        assigned_agent=agent, 
        role='client'
    ).values_list('id', flat=True)
    
    clients_with_orders = Order.objects.filter(
        sales_manager=agent
    ).values_list('client_id', flat=True).distinct()
    
    all_client_ids = set(clients_with_assigned_agent) | set(clients_with_orders)
    clients_count = len(all_client_ids)
    
    print(f"  - Clientes con assigned_agent: {len(clients_with_assigned_agent)}")
    print(f"  - Clientes con órdenes: {len(set(clients_with_orders))}")
    print(f"  - Total de clientes únicos: {clients_count}")
    
    # Órdenes gestionadas
    orders_count = Order.objects.filter(sales_manager=agent).count()
    print(f"  - Órdenes gestionadas: {orders_count}")

print("\n✓ Todas las consultas ejecutadas exitosamente")
print("✓ El endpoint debería funcionar correctamente ahora")
