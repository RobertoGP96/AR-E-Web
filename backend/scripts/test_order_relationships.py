"""
Script para verificar la relación entre órdenes, clientes y agentes
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Order, CustomUser

print("=== Verificando Relación Órdenes-Clientes-Agentes ===\n")

orders = Order.objects.all()
print(f"Total de órdenes: {orders.count()}\n")

for order in orders:
    print(f"Orden #{order.id}")
    print(f"  Cliente: {order.client.full_name} (ID: {order.client.id})")
    print(f"  Sales Manager: {order.sales_manager.full_name} (ID: {order.sales_manager.id})")
    print(f"  Cliente tiene agente asignado: {order.client.assigned_agent}")
    
    if order.client.assigned_agent:
        print(f"  Agente asignado del cliente: {order.client.assigned_agent.full_name}")
    else:
        print(f"  ⚠️ El cliente NO tiene agente asignado en el campo 'assigned_agent'")
        print(f"  💡 Pero el sales_manager de la orden es: {order.sales_manager.full_name}")
    print()

print("\n=== Recomendación ===")
print("El problema es que los clientes no tienen el campo 'assigned_agent' configurado.")
print("Existen dos soluciones:")
print("1. Asignar manualmente el agente a cada cliente")
print("2. Modificar el reporte para contar clientes basándose en las órdenes (sales_manager)")
