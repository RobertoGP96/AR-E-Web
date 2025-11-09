"""
Script para corregir manualmente los estados de productos inconsistentes
"""
import os
import sys
import django

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Product
from api.enums import ProductStatusEnum

def fix_product_statuses():
    """
    Corrige los estados de los productos según sus cantidades
    """
    print("\n" + "="*70)
    print("CORRECCIÓN DE ESTADOS DE PRODUCTOS")
    print("="*70 + "\n")
    
    fixed_count = 0
    
    for product in Product.objects.all():
        old_status = product.status
        new_status = None
        
        # Determinar el estado correcto basado en las cantidades
        if product.amount_delivered >= product.amount_requested:
            new_status = ProductStatusEnum.ENTREGADO.value
        elif product.total_received >= product.amount_requested:
            new_status = ProductStatusEnum.RECIBIDO.value
        elif product.amount_purchased >= product.amount_requested:
            new_status = ProductStatusEnum.COMPRADO.value
        else:
            new_status = ProductStatusEnum.ENCARGADO.value
        
        # Actualizar si es necesario
        if old_status != new_status:
            product.status = new_status
            product.save(update_fields=['status', 'updated_at'])
            print(f"✓ {product.name}: {old_status} → {new_status}")
            fixed_count += 1
    
    print(f"\n{'='*70}")
    if fixed_count > 0:
        print(f"Se corrigieron {fixed_count} productos")
    else:
        print("Todos los productos tienen estados correctos")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    fix_product_statuses()
