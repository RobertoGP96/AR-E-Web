"""
Script para migrar los deliveries existentes y asignar el cliente del pedido al delivery.
Este script debe ejecutarse después de aplicar la migración del campo client.
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import DeliverReceip

def migrate_delivery_clients():
    """
    Actualiza los deliveries existentes asignando el cliente del pedido al campo client.
    """
    deliveries_without_client = DeliverReceip.objects.filter(client__isnull=True)
    total = deliveries_without_client.count()
    
    print(f"Encontrados {total} deliveries sin cliente asignado.")
    
    updated = 0
    skipped = 0
    
    for delivery in deliveries_without_client:
        if delivery.order and delivery.order.client:
            delivery.client = delivery.order.client
            delivery.save(update_fields=['client'])
            updated += 1
            print(f"✓ Delivery #{delivery.id} actualizado con cliente {delivery.client.full_name}")
        else:
            skipped += 1
            print(f"⚠ Delivery #{delivery.id} no tiene pedido o el pedido no tiene cliente")
    
    print(f"\n=== Resumen ===")
    print(f"Total de deliveries procesados: {total}")
    print(f"Actualizados: {updated}")
    print(f"Omitidos (sin cliente disponible): {skipped}")

if __name__ == '__main__':
    print("=== Iniciando migración de clientes en deliveries ===\n")
    migrate_delivery_clients()
    print("\n=== Migración completada ===")
