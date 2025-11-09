#!/usr/bin/env python
"""
Script para actualizar el campo amount_received de todos los productos
basándose en la suma de sus ProductReceived
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Product
from django.db import transaction

def update_products_amount_received():
    """Actualiza el campo amount_received de todos los productos"""
    
    with transaction.atomic():
        products = Product.objects.all()
        updated_count = 0
        
        for product in products:
            # Calcular el total recibido
            total_received = sum(pr.amount_received for pr in product.receiveds.all())
            
            # Actualizar solo si hay cambios
            if product.amount_received != total_received:
                product.amount_received = total_received
                product.save(update_fields=['amount_received', 'updated_at'])
                updated_count += 1
                print(f"✓ Producto '{product.name}' actualizado: {total_received} unidades recibidas")
        
        print(f"\n✅ Se actualizaron {updated_count} productos de {products.count()} totales")

if __name__ == '__main__':
    print("🔄 Actualizando amount_received de todos los productos...\n")
    update_products_amount_received()
    print("\n✨ Proceso completado")
