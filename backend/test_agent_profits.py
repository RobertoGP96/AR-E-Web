"""
Script para verificar el cálculo de ganancias de agentes
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import DeliverReceip, User
from datetime import datetime, timedelta
from django.utils import timezone

print("=" * 80)
print("VERIFICACIÓN DE GANANCIAS DE AGENTES")
print("=" * 80)
print()

# 1. Verificar todas las entregas
print("1. TODAS LAS ENTREGAS EN EL SISTEMA")
print("-" * 80)
all_deliveries = DeliverReceip.objects.all()
print(f"Total de entregas: {all_deliveries.count()}")
print()

if all_deliveries.count() > 0:
    for delivery in all_deliveries:
        agent = delivery.client.assigned_agent
        agent_name = agent.full_name if agent else "Sin agente"
        print(f"Entrega ID: {delivery.id}")
        print(f"  Cliente: {delivery.client.full_name}")
        print(f"  Agente asignado: {agent_name}")
        print(f"  Peso: {delivery.weight} lbs")
        print(f"  Fecha de entrega: {delivery.deliver_date}")
        print(f"  Categoría: {delivery.category.name if delivery.category else 'Sin categoría'}")
        
        # Calcular valores
        print(f"\n  Cálculos:")
        print(f"    - agent_profit_calculated: ${delivery.agent_profit_calculated:.2f}")
        print(f"    - delivery_expenses: ${delivery.delivery_expenses:.2f}")
        print(f"    - client_charge: ${delivery.client_charge:.2f}")
        print(f"    - system_delivery_profit: ${delivery.system_delivery_profit:.2f}")
        
        if agent:
            print(f"    - agent.agent_profit (por libra): ${agent.agent_profit:.2f}")
            print(f"    - Cálculo manual: {delivery.weight} lbs × ${agent.agent_profit:.2f} = ${delivery.weight * agent.agent_profit:.2f}")
        else:
            print(f"    - manager_profit (fallback): ${delivery.manager_profit:.2f}")
        
        print()

# 2. Verificar rango de fechas de los últimos 12 meses
print("\n2. ENTREGAS EN LOS ÚLTIMOS 12 MESES")
print("-" * 80)
now = timezone.now()
current_date = now.date()

# Calcular hace 12 meses
twelve_months_ago = current_date.replace(day=1) - timedelta(days=330)
print(f"Rango de fechas: {twelve_months_ago} hasta {current_date}")
print()

deliveries_last_12_months = DeliverReceip.objects.filter(
    deliver_date__date__gte=twelve_months_ago,
    deliver_date__date__lte=current_date
)
print(f"Entregas en últimos 12 meses: {deliveries_last_12_months.count()}")

if deliveries_last_12_months.count() > 0:
    total_agent_profit = sum(float(d.agent_profit_calculated) for d in deliveries_last_12_months)
    print(f"Ganancia total de agentes (12 meses): ${total_agent_profit:.2f}")
    print()
    
    for delivery in deliveries_last_12_months:
        agent = delivery.client.assigned_agent
        agent_name = agent.full_name if agent else "Sin agente"
        print(f"  - Entrega {delivery.id}: {agent_name} - ${delivery.agent_profit_calculated:.2f}")

# 3. Verificar agentes activos
print("\n3. AGENTES ACTIVOS Y SUS GANANCIAS")
print("-" * 80)
agents = User.objects.filter(role='agent', is_active=True)
print(f"Total de agentes activos: {agents.count()}")
print()

for agent in agents:
    print(f"Agente: {agent.full_name}")
    print(f"  Email: {agent.email}")
    print(f"  Ganancia por libra: ${agent.agent_profit:.2f}")
    
    # Todas las entregas del agente
    agent_deliveries = DeliverReceip.objects.filter(
        client__assigned_agent=agent
    )
    print(f"  Total entregas (históricas): {agent_deliveries.count()}")
    
    if agent_deliveries.count() > 0:
        total_profit = sum(float(d.agent_profit_calculated) for d in agent_deliveries)
        print(f"  Ganancia total (histórica): ${total_profit:.2f}")
        
        # Entregas del mes actual
        month_start = current_date.replace(day=1)
        current_month_deliveries = DeliverReceip.objects.filter(
            client__assigned_agent=agent,
            deliver_date__gte=month_start,
            deliver_date__lte=current_date
        )
        
        if current_month_deliveries.count() > 0:
            current_month_profit = sum(float(d.agent_profit_calculated) for d in current_month_deliveries)
            print(f"  Ganancia mes actual: ${current_month_profit:.2f}")
        else:
            print(f"  Ganancia mes actual: $0.00")
    
    print()

print("=" * 80)
print("VERIFICACIÓN COMPLETADA")
print("=" * 80)
