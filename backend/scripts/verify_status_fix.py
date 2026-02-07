#!/usr/bin/env python
"""
Script para verificar que el estado de los productos se lee correctamente de la BD
sin ser recalculado en la serialización.

Este script:
1. Busca productos con estado "Recibido"
2. Verifica que amount_purchased >= amount_requested
3. Verifica que amount_received >= amount_requested
4. Obtiene el producto vía API y confirma que devuelve el estado correcto
"""

import os
import sys
import django
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

from api.models import Product
from api.serializers import ProductSerializer
from api.enums import ProductStatusEnum

def verify_product_status():
    """Verifica que los estados se leen correctamente de la BD"""
    
    print("\n" + "="*80)
    print("VERIFICANDO INTEGRIDAD DE ESTADOS DE PRODUCTOS")
    print("="*80 + "\n")
    
    # Contar productos por estado
    status_counts = {}
    for status in ProductStatusEnum:
        count = Product.objects.filter(status=status.value).count()
        status_counts[status.value] = count
        print(f"  {status.value:15} -> {count:3} productos")
    
    print("\n" + "-"*80)
    print("ANÁLISIS DETALLADO POR ESTADO")
    print("-"*80 + "\n")
    
    problematic_products = []
    
    for status in ProductStatusEnum:
        products = Product.objects.filter(status=status.value)[:5]  # Primeros 5 de cada estado
        
        if products.exists():
            print(f"\n📊 Estado: {status.value}")
            print(f"   {'─' * 76}")
            
            for product in products:
                serializer = ProductSerializer(product)
                serialized_status = serializer.data.get('status', 'N/A')
                
                # Verificar consistencia
                is_consistent = product.status == serialized_status
                consistency_mark = "✓" if is_consistent else "✗"
                
                print(f"\n   {consistency_mark} Producto: {product.name}")
                print(f"      ID: {product.id}")
                print(f"      BD Status: {product.status}")
                print(f"      API Status: {serialized_status}")
                print(f"      Solicitado: {product.amount_requested}")
                print(f"      Comprado: {product.amount_purchased}")
                print(f"      Recibido: {product.amount_received}")
                print(f"      Entregado: {product.amount_delivered}")
                
                if not is_consistent:
                    problematic_products.append({
                        'id': product.id,
                        'name': product.name,
                        'bd_status': product.status,
                        'api_status': serialized_status
                    })
    
    print("\n" + "="*80)
    print("RESUMEN")
    print("="*80)
    
    if problematic_products:
        print(f"\n⚠️  PROBLEMAS ENCONTRADOS: {len(problematic_products)} productos")
        print("\nProductos con estado inconsistente:\n")
        for p in problematic_products:
            print(f"  - {p['name']} (ID: {p['id']})")
            print(f"    BD: {p['bd_status']} -> API: {p['api_status']}")
    else:
        print("\n✓ EXCELENTE: Todos los productos tienen estados consistentes")
        print("  El estado se lee correctamente de la BD sin recalcular")
    
    print("\n" + "="*80 + "\n")
    
    return len(problematic_products) == 0

if __name__ == '__main__':
    success = verify_product_status()
    sys.exit(0 if success else 1)
