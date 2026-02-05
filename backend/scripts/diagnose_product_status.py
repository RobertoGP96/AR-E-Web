"""
Script para diagnosticar por qué un producto con cantidad encargada=1, comprada=1 y recibida=1
no tiene estado RECIBIDO
"""
import os
import sys
import django

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Product, ProductBuyed, ProductReceived
from api.enums import ProductStatusEnum

def diagnose_product_status():
    print("\n" + "="*80)
    print("DIAGNÓSTICO: Productos con cantidades coincidentes pero estado incorrecto")
    print("="*80 + "\n")
    
    # Buscar todos los productos que podrían tener el problema
    products = Product.objects.all()
    
    problematic_products = []
    
    for product in products:
        # Calcular totales reales
        total_purchased = sum(pb.amount_buyed for pb in product.buys.all())
        total_received = sum(pr.amount_received for pr in product.receiveds.all())
        
        print(f"\nProducto: {product.name}")
        print(f"  ID: {product.id}")
        print(f"  Estado actual: {product.status}")
        print(f"  amount_requested: {product.amount_requested}")
        print(f"  amount_purchased (BD): {product.amount_purchased}")
        print(f"  amount_received (BD): {product.amount_received}")
        print(f"  total_purchased (calculado): {total_purchased}")
        print(f"  total_received (calculado): {total_received}")
        
        # Verificar si hay inconsistencia
        should_be_received = (
            total_received >= product.amount_requested and 
            product.amount_requested > 0 and
            product.status not in [ProductStatusEnum.RECIBIDO.value, ProductStatusEnum.ENTREGADO.value]
        )
        
        if should_be_received:
            problematic_products.append(product)
            print(f"  ⚠️  PROBLEMA: Debería estar RECIBIDO pero está {product.status}")
            
            # Analizar por qué no se actualizó
            print(f"  🔍 Análisis:")
            print(f"     - total_received ({total_received}) >= amount_requested ({product.amount_requested})? {total_received >= product.amount_requested}")
            print(f"     - amount_requested > 0? {product.amount_requested > 0}")
            print(f"     - Estado permitido para cambio? {product.status in [ProductStatusEnum.COMPRADO.value, ProductStatusEnum.ENCARGADO.value]}")
            
            # Verificar si los campos en BD están desactualizados
            if product.amount_received != total_received:
                print(f"     - ❌ INCONSISTENCIA: amount_received en BD ({product.amount_received}) != total_received calculado ({total_received})")
            
        else:
            print(f"  ✓ Estado correcto")
    
    print(f"\n" + "="*80)
    print(f"RESUMEN: Se encontraron {len(problematic_products)} productos con problemas")
    
    if problematic_products:
        print(f"\n🔧 CORRECCIÓN AUTOMÁTICA:")
        for product in problematic_products:
            print(f"\nCorrigiendo producto: {product.name}")
            
            # Recalcular totales
            total_received = sum(pr.amount_received for pr in product.receiveds.all())
            product.amount_received = total_received
            
            # Actualizar estado si corresponde
            if total_received >= product.amount_requested and product.amount_requested > 0:
                if product.status in [ProductStatusEnum.COMPRADO.value, ProductStatusEnum.ENCARGADO.value]:
                    product.status = ProductStatusEnum.RECIBIDO.value
                    print(f"  ✓ Estado cambiado a RECIBIDO")
                else:
                    print(f"  ⚠️  No se puede cambiar a RECIBIDO desde estado {product.status}")
            
            product.save()
            print(f"  ✓ Producto actualizado")
    
    print("="*80)

if __name__ == "__main__":
    diagnose_product_status()
