"""
Script para probar la actualización del estado de productos al cambiar cantidades recibidas y entregadas.
"""

import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Product, ProductReceived, ProductDelivery, ProductStatusEnum

def test_product_received_update():
    """Prueba actualización de estado al modificar cantidad recibida"""
    print("\n" + "="*60)
    print("TEST: Actualización de cantidad recibida")
    print("="*60)
    
    # Buscar un producto con cantidad recibida
    product_received = ProductReceived.objects.filter(
        original_product__isnull=False
    ).first()
    
    if not product_received:
        print("❌ No se encontraron productos recibidos para probar")
        return
    
    product = product_received.original_product
    
    print(f"\n📦 Producto: {product.name} (SKU: {product.sku})")
    print(f"   Estado actual: {product.status}")
    print(f"   Cantidad solicitada: {product.amount_requested}")
    print(f"   Cantidad recibida: {product.amount_received}")
    print(f"   Cantidad entregada: {product.amount_delivered}")
    
    # Guardar estados anteriores
    old_amount = product_received.amount_received
    old_status = product.status
    
    # Cambiar la cantidad recibida
    new_amount = old_amount + 1 if old_amount < product.amount_requested else old_amount - 1
    product_received.amount_received = new_amount
    product_received.save()
    
    # Refrescar el producto desde la BD
    product.refresh_from_db()
    
    print(f"\n✏️  Cantidad recibida cambiada de {old_amount} a {new_amount}")
    print(f"   Nuevo total recibido: {product.amount_received}")
    print(f"   Estado del producto: {old_status} → {product.status}")
    
    # Verificar si el estado cambió correctamente
    expected_status = None
    total_received = sum(pr.amount_received for pr in product.receiveds.all())
    
    if total_received >= product.amount_requested:
        if old_status in [ProductStatusEnum.COMPRADO.value, ProductStatusEnum.ENCARGADO.value]:
            expected_status = ProductStatusEnum.RECIBIDO.value
    
    if expected_status and product.status == expected_status:
        print(f"✅ Estado actualizado correctamente a '{expected_status}'")
    elif old_status == product.status:
        print(f"ℹ️  Estado se mantuvo en '{product.status}' (sin cambios esperados)")
    else:
        print(f"⚠️  Estado inesperado: esperado '{expected_status}', obtenido '{product.status}'")
    
    # Restaurar valor original
    product_received.amount_received = old_amount
    product_received.save()
    print(f"\n🔄 Cantidad restaurada a {old_amount}")

def test_product_delivery_update():
    """Prueba actualización de estado al modificar cantidad entregada"""
    print("\n" + "="*60)
    print("TEST: Actualización de cantidad entregada")
    print("="*60)
    
    # Buscar un producto con cantidad entregada
    product_delivery = ProductDelivery.objects.filter(
        original_product__isnull=False
    ).first()
    
    if not product_delivery:
        print("❌ No se encontraron productos entregados para probar")
        return
    
    product = product_delivery.original_product
    
    print(f"\n📦 Producto: {product.name} (SKU: {product.sku})")
    print(f"   Estado actual: {product.status}")
    print(f"   Cantidad solicitada: {product.amount_requested}")
    print(f"   Cantidad recibida: {product.amount_received}")
    print(f"   Cantidad entregada: {product.amount_delivered}")
    
    # Guardar estados anteriores
    old_amount = product_delivery.amount_delivered
    old_status = product.status
    
    # Cambiar la cantidad entregada
    new_amount = old_amount + 1 if old_amount < product.amount_requested else old_amount - 1
    product_delivery.amount_delivered = new_amount
    product_delivery.save()
    
    # Refrescar el producto desde la BD
    product.refresh_from_db()
    
    print(f"\n✏️  Cantidad entregada cambiada de {old_amount} a {new_amount}")
    print(f"   Nuevo total entregado: {product.amount_delivered}")
    print(f"   Estado del producto: {old_status} → {product.status}")
    
    # Verificar si el estado cambió correctamente
    expected_status = None
    total_delivered = sum(pd.amount_delivered for pd in product.delivers.all())
    
    if total_delivered >= product.amount_requested:
        if old_status in [ProductStatusEnum.RECIBIDO.value, ProductStatusEnum.COMPRADO.value, ProductStatusEnum.ENCARGADO.value]:
            expected_status = ProductStatusEnum.ENTREGADO.value
    
    if expected_status and product.status == expected_status:
        print(f"✅ Estado actualizado correctamente a '{expected_status}'")
    elif old_status == product.status:
        print(f"ℹ️  Estado se mantuvo en '{product.status}' (sin cambios esperados)")
    else:
        print(f"⚠️  Estado inesperado: esperado '{expected_status}', obtenido '{product.status}'")
    
    # Restaurar valor original
    product_delivery.amount_delivered = old_amount
    product_delivery.save()
    print(f"\n🔄 Cantidad restaurada a {old_amount}")

def main():
    print("\n" + "="*60)
    print("PRUEBA DE ACTUALIZACIÓN DE ESTADO DE PRODUCTOS")
    print("="*60)
    
    test_product_received_update()
    test_product_delivery_update()
    
    print("\n" + "="*60)
    print("PRUEBAS COMPLETADAS")
    print("="*60 + "\n")

if __name__ == '__main__':
    main()
