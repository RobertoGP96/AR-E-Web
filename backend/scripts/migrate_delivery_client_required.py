"""
Script de migración para:
1. Eliminar el campo 'order' de DeliverReceip
2. Hacer el campo 'client' requerido (eliminando null=True, blank=True)
3. Asignar clientes a deliveries que no tengan uno basándose en la orden asociada

Este script debe ejecutarse ANTES de hacer las migraciones finales.
"""

import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import DeliverReceip, CustomUser

def migrate_delivery_clients():
    """
    Asigna clientes a todos los deliveries que no tengan uno.
    Prioridad: 
    1. Si tiene order asociada, usa order.client
    2. Si no, busca el primer cliente disponible
    """
    print("=" * 60)
    print("Iniciando migración de clientes en deliveries...")
    print("=" * 60)
    
    # Obtener todos los deliveries
    all_deliveries = DeliverReceip.objects.all()
    total = all_deliveries.count()
    print(f"\nTotal de deliveries: {total}")
    
    # Deliveries sin cliente
    deliveries_without_client = all_deliveries.filter(client__isnull=True)
    count_without_client = deliveries_without_client.count()
    print(f"Deliveries sin cliente asignado: {count_without_client}")
    
    if count_without_client == 0:
        print("\n✅ Todos los deliveries ya tienen cliente asignado.")
        return
    
    # Obtener primer cliente disponible como fallback
    fallback_client = CustomUser.objects.filter(role='client').first()
    
    if not fallback_client:
        print("\n❌ ERROR: No hay clientes en la base de datos.")
        print("Por favor, crea al menos un cliente antes de ejecutar esta migración.")
        sys.exit(1)
    
    print(f"\nCliente fallback: {fallback_client.full_name} (ID: {fallback_client.id})")
    
    # Procesar deliveries sin cliente
    updated_from_order = 0
    updated_with_fallback = 0
    
    for delivery in deliveries_without_client:
        if hasattr(delivery, 'order') and delivery.order and delivery.order.client:
            # Caso 1: Tiene orden, usar su cliente
            delivery.client = delivery.order.client
            updated_from_order += 1
            print(f"  - Delivery #{delivery.id}: Cliente asignado desde orden (#{delivery.order.id}): {delivery.order.client.full_name}")
        else:
            # Caso 2: No tiene orden o la orden no tiene cliente, usar fallback
            delivery.client = fallback_client
            updated_with_fallback += 1
            print(f"  - Delivery #{delivery.id}: Cliente fallback asignado: {fallback_client.full_name}")
        
        delivery.save()
    
    print("\n" + "=" * 60)
    print("Resumen de migración:")
    print("=" * 60)
    print(f"✅ Deliveries actualizados desde orden: {updated_from_order}")
    print(f"✅ Deliveries con cliente fallback: {updated_with_fallback}")
    print(f"✅ Total actualizado: {updated_from_order + updated_with_fallback}")
    print("\n🎉 Migración completada exitosamente.")
    print("\nAhora puedes:")
    print("1. Ejecutar: python manage.py makemigrations")
    print("2. Ejecutar: python manage.py migrate")
    print("=" * 60)

if __name__ == "__main__":
    try:
        migrate_delivery_clients()
    except Exception as e:
        print(f"\n❌ Error durante la migración: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
