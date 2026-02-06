#!/usr/bin/env python
"""
Script de diagnóstico completo del flujo de cambio de estado de productos.
Verifica la lógica correcta de:
1. ENCARGADO → COMPRADO (cuando amount_purchased >= amount_requested)
2. COMPRADO → RECIBIDO (cuando amount_received >= amount_requested)
3. RECIBIDO → ENTREGADO (cuando amount_delivered >= amount_purchased AND amount_delivered >= amount_received)
"""

import os
import sys
import django

# Configuración de Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from api.models import Product, Order, ProductBuyed, ProductReceived, ProductDelivery, CustomUser, Shop
from api.enums import ProductStatusEnum, OrderStatusEnum
from decimal import Decimal


def print_product_status(product, title=""):
    """Imprime el estado actual de un producto"""
    if title:
        print(f"\n{title}")
    print(f"  Producto: {product.name} (ID: {product.id})")
    print(f"  Estado: {product.status}")
    print(f"  Cantidades:")
    print(f"    - Solicitada (amount_requested): {product.amount_requested}")
    print(f"    - Comprada (amount_purchased): {product.amount_purchased}")
    print(f"    - Recibida (amount_received): {product.amount_received}")
    print(f"    - Entregada (amount_delivered): {product.amount_delivered}")
    print(f"  Propiedades calculadas:")
    print(f"    - pending_purchase: {product.pending_purchase}")
    print(f"    - pending_received: {product.pending_received}")
    print(f"    - pending_delivery: {product.pending_delivery}")
    print(f"    - is_fully_purchased: {product.is_fully_purchased}")
    print(f"    - is_fully_received: {product.is_fully_received}")
    print(f"    - is_fully_delivered: {product.is_fully_delivered}")


def test_scenario_1_purchase_flow():
    """
    ESCENARIO 1: Flujo de Compra
    - Crear producto con amount_requested = 10
    - Crear ProductBuyed con amount_buyed = 10
    - Verificar que estado cambia a COMPRADO
    """
    print("\n" + "="*80)
    print("ESCENARIO 1: FLUJO DE COMPRA")
    print("="*80)
    
    # Limpiar datos previos
    Product.objects.filter(name="Test Product Scenario 1").delete()
    Order.objects.filter(client__username="test_user").delete()
    try:
        CustomUser.objects.get(username="test_user").delete()
    except:
        pass
    try:
        Shop.objects.get(name="Test Shop").delete()
    except:
        pass
    
    # Crear usuario de prueba
    user = CustomUser.objects.create(
        username="test_user",
        email="test@example.com",
        full_name="Test User",
        role="client"
    )
    
    # Crear tienda
    shop = Shop.objects.create(name="Test Shop", owner=user)
    
    # Crear orden
    order = Order.objects.create(client=user)
    
    # Crear producto
    product = Product.objects.create(
        name="Test Product Scenario 1",
        amount_requested=10,
        order=order,
        shop=shop,
        shop_cost=100.0
    )
    
    print(f"\n✓ Producto creado con amount_requested=10")
    print_product_status(product, "Estado inicial:")
    
    # Verificar estado inicial
    if product.status != ProductStatusEnum.ENCARGADO.value:
        print(f"  ❌ ERROR: Estado inicial debe ser ENCARGADO, pero es {product.status}")
    else:
        print(f"  ✓ Estado inicial correcto: ENCARGADO")
    
    # Crear ProductBuyed con amount_buyed = 10
    print(f"\n✓ Creando ProductBuyed con amount_buyed=10...")
    buyed = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=10
    )
    
    # Refrescar el producto
    product.refresh_from_db()
    print_product_status(product, "Estado después de compra:")
    
    # Verificar cambio de estado
    if product.status != ProductStatusEnum.COMPRADO.value:
        print(f"  ❌ ERROR: Estado debe cambiar a COMPRADO, pero es {product.status}")
        print(f"  ⚠️  PROBLEMA DETECTADO: Signal no está actualizando correctamente el estado")
        return False
    else:
        print(f"  ✓ Estado cambió correctamente a COMPRADO")
    
    # Verificar amount_purchased
    if product.amount_purchased != 10:
        print(f"  ❌ ERROR: amount_purchased debe ser 10, pero es {product.amount_purchased}")
        return False
    else:
        print(f"  ✓ amount_purchased actualizado correctamente")
    
    return True


def test_scenario_2_reception_flow():
    """
    ESCENARIO 2: Flujo de Recepción
    - Partir del estado COMPRADO (10 compradas)
    - Crear ProductReceived con amount_received = 10
    - Verificar que estado cambia a RECIBIDO
    """
    print("\n" + "="*80)
    print("ESCENARIO 2: FLUJO DE RECEPCIÓN")
    print("="*80)
    
    # Limpiar datos previos
    Product.objects.filter(name="Test Product Scenario 2").delete()
    Order.objects.filter(client__username="test_user2").delete()
    try:
        CustomUser.objects.get(username="test_user2").delete()
    except:
        pass
    try:
        Shop.objects.get(name="Test Shop 2").delete()
    except:
        pass
    
    # Crear usuario
    user = CustomUser.objects.create(
        username="test_user2",
        email="test2@example.com",
        full_name="Test User 2",
        role="client"
    )
    
    # Crear tienda
    shop = Shop.objects.create(name="Test Shop 2", owner=user)
    
    # Crear orden
    order = Order.objects.create(client=user)
    
    # Crear producto
    product = Product.objects.create(
        name="Test Product Scenario 2",
        amount_requested=10,
        order=order,
        shop=shop,
        shop_cost=100.0
    )
    
    # Crear ProductBuyed
    buyed = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=10
    )
    product.refresh_from_db()
    
    print(f"\n✓ Producto en estado COMPRADO (amount_purchased=10)")
    print_product_status(product, "Estado actual:")
    
    # Crear ProductReceived
    print(f"\n✓ Creando ProductReceived con amount_received=10...")
    received = ProductReceived.objects.create(
        original_product=product,
        amount_received=10
    )
    
    # Refrescar el producto
    product.refresh_from_db()
    print_product_status(product, "Estado después de recepción:")
    
    # Verificar cambio de estado
    if product.status != ProductStatusEnum.RECIBIDO.value:
        print(f"  ❌ ERROR: Estado debe cambiar a RECIBIDO, pero es {product.status}")
        print(f"  ⚠️  PROBLEMA DETECTADO: Signal no está actualizando correctamente el estado")
        return False
    else:
        print(f"  ✓ Estado cambió correctamente a RECIBIDO")
    
    # Verificar amount_received
    if product.amount_received != 10:
        print(f"  ❌ ERROR: amount_received debe ser 10, pero es {product.amount_received}")
        return False
    else:
        print(f"  ✓ amount_received actualizado correctamente")
    
    return True


def test_scenario_3_delivery_flow():
    """
    ESCENARIO 3: Flujo de Entrega
    - Partir del estado RECIBIDO (10 recibidas)
    - Crear ProductDelivery con amount_delivered = 10
    - Verificar que estado cambia a ENTREGADO
    """
    print("\n" + "="*80)
    print("ESCENARIO 3: FLUJO DE ENTREGA")
    print("="*80)
    
    # Limpiar datos previos
    Product.objects.filter(name="Test Product Scenario 3").delete()
    Order.objects.filter(client__username="test_user3").delete()
    try:
        CustomUser.objects.get(username="test_user3").delete()
    except:
        pass
    try:
        Shop.objects.get(name="Test Shop 3").delete()
    except:
        pass
    
    # Crear usuario
    user = CustomUser.objects.create(
        username="test_user3",
        email="test3@example.com",
        full_name="Test User 3",
        role="client"
    )
    
    # Crear tienda
    shop = Shop.objects.create(name="Test Shop 3", owner=user)
    
    # Crear orden
    order = Order.objects.create(client=user)
    
    # Crear producto
    product = Product.objects.create(
        name="Test Product Scenario 3",
        amount_requested=10,
        order=order,
        shop=shop,
        shop_cost=100.0
    )
    
    # Crear ProductBuyed
    buyed = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=10
    )
    
    # Crear ProductReceived
    received = ProductReceived.objects.create(
        original_product=product,
        amount_received=10
    )
    product.refresh_from_db()
    
    print(f"\n✓ Producto en estado RECIBIDO (amount_received=10)")
    print_product_status(product, "Estado actual:")
    
    # Crear ProductDelivery
    print(f"\n✓ Creando ProductDelivery con amount_delivered=10...")
    delivery = ProductDelivery.objects.create(
        original_product=product,
        amount_delivered=10
    )
    
    # Refrescar el producto
    product.refresh_from_db()
    print_product_status(product, "Estado después de entrega:")
    
    # Verificar cambio de estado
    if product.status != ProductStatusEnum.ENTREGADO.value:
        print(f"  ❌ ERROR: Estado debe cambiar a ENTREGADO, pero es {product.status}")
        print(f"  ⚠️  PROBLEMA DETECTADO: Signal no está actualizando correctamente el estado")
        return False
    else:
        print(f"  ✓ Estado cambió correctamente a ENTREGADO")
    
    # Verificar amount_delivered
    if product.amount_delivered != 10:
        print(f"  ❌ ERROR: amount_delivered debe ser 10, pero es {product.amount_delivered}")
        return False
    else:
        print(f"  ✓ amount_delivered actualizado correctamente")
    
    return True


def test_scenario_4_partial_flow():
    """
    ESCENARIO 4: Flujo Parcial
    - amount_requested = 10
    - Crear 2 ProductBuyed de 5 cada uno
    - Verificar estado COMPRADO (5+5=10)
    - Crear ProductReceived de 5
    - Verificar estado sigue siendo COMPRADO (no cambia a RECIBIDO porque no se recibió todo)
    - Crear otro ProductReceived de 5
    - Verificar estado cambia a RECIBIDO
    """
    print("\n" + "="*80)
    print("ESCENARIO 4: FLUJO PARCIAL (MÚLTIPLES TRANSACCIONES)")
    print("="*80)
    
    # Limpiar datos previos
    Product.objects.filter(name="Test Product Scenario 4").delete()
    Order.objects.filter(client__username="test_user4").delete()
    try:
        CustomUser.objects.get(username="test_user4").delete()
    except:
        pass
    try:
        Shop.objects.get(name="Test Shop 4").delete()
    except:
        pass
    
    # Crear usuario
    user = CustomUser.objects.create(
        username="test_user4",
        email="test4@example.com",
        full_name="Test User 4",
        role="client"
    )
    
    # Crear tienda
    shop = Shop.objects.create(name="Test Shop 4", owner=user)
    
    # Crear orden
    order = Order.objects.create(client=user)
    
    # Crear producto
    product = Product.objects.create(
        name="Test Product Scenario 4",
        amount_requested=10,
        order=order,
        shop=shop,
        shop_cost=100.0
    )
    
    print(f"\n✓ Producto creado con amount_requested=10")
    
    # Crear primer ProductBuyed (5)
    print(f"\n✓ Creando primer ProductBuyed con amount_buyed=5...")
    buyed1 = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=5
    )
    product.refresh_from_db()
    print_product_status(product, "Después del primer ProductBuyed:")
    
    if product.status != ProductStatusEnum.ENCARGADO.value:
        print(f"  ❌ ERROR: Estado debe ser ENCARGADO (5 < 10), pero es {product.status}")
        return False
    else:
        print(f"  ✓ Estado correcto: ENCARGADO")
    
    # Crear segundo ProductBuyed (5)
    print(f"\n✓ Creando segundo ProductBuyed con amount_buyed=5...")
    buyed2 = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=5
    )
    product.refresh_from_db()
    print_product_status(product, "Después del segundo ProductBuyed:")
    
    if product.status != ProductStatusEnum.COMPRADO.value:
        print(f"  ❌ ERROR: Estado debe ser COMPRADO (5+5=10), pero es {product.status}")
        return False
    else:
        print(f"  ✓ Estado cambió a COMPRADO")
    
    # Crear primer ProductReceived (5)
    print(f"\n✓ Creando primer ProductReceived con amount_received=5...")
    received1 = ProductReceived.objects.create(
        original_product=product,
        amount_received=5
    )
    product.refresh_from_db()
    print_product_status(product, "Después del primer ProductReceived:")
    
    if product.status != ProductStatusEnum.COMPRADO.value:
        print(f"  ❌ ERROR: Estado debe ser COMPRADO (5 < 10), pero es {product.status}")
        return False
    else:
        print(f"  ✓ Estado se mantiene en COMPRADO")
    
    # Crear segundo ProductReceived (5)
    print(f"\n✓ Creando segundo ProductReceived con amount_received=5...")
    received2 = ProductReceived.objects.create(
        original_product=product,
        amount_received=5
    )
    product.refresh_from_db()
    print_product_status(product, "Después del segundo ProductReceived:")
    
    if product.status != ProductStatusEnum.RECIBIDO.value:
        print(f"  ❌ ERROR: Estado debe ser RECIBIDO (5+5=10), pero es {product.status}")
        return False
    else:
        print(f"  ✓ Estado cambió a RECIBIDO")
    
    return True


def test_scenario_5_refund_flow():
    """
    ESCENARIO 5: Flujo con Reembolso
    - amount_requested = 10
    - Crear ProductBuyed con amount_buyed=10 y quantity_refuned=0 (estado COMPRADO)
    - Marcar como reembolsado con quantity_refuned=2
    - Verificar que amount_purchased se actualiza a 8
    - Verificar que estado cambia de vuelta a ENCARGADO
    """
    print("\n" + "="*80)
    print("ESCENARIO 5: FLUJO CON REEMBOLSO")
    print("="*80)
    
    # Limpiar datos previos
    Product.objects.filter(name="Test Product Scenario 5").delete()
    Order.objects.filter(client__username="test_user5").delete()
    try:
        CustomUser.objects.get(username="test_user5").delete()
    except:
        pass
    try:
        Shop.objects.get(name="Test Shop 5").delete()
    except:
        pass
    
    # Crear usuario
    user = CustomUser.objects.create(
        username="test_user5",
        email="test5@example.com",
        full_name="Test User 5",
        role="client"
    )
    
    # Crear tienda
    shop = Shop.objects.create(name="Test Shop 5", owner=user)
    
    # Crear orden
    order = Order.objects.create(client=user)
    
    # Crear producto
    product = Product.objects.create(
        name="Test Product Scenario 5",
        amount_requested=10,
        order=order,
        shop=shop,
        shop_cost=100.0
    )
    
    # Crear ProductBuyed
    print(f"\n✓ Creando ProductBuyed con amount_buyed=10...")
    buyed = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=10
    )
    product.refresh_from_db()
    print_product_status(product, "Estado después de compra:")
    
    if product.status != ProductStatusEnum.COMPRADO.value:
        print(f"  ❌ ERROR: Estado debe ser COMPRADO, pero es {product.status}")
        return False
    else:
        print(f"  ✓ Estado es COMPRADO")
    
    # Actualizar ProductBuyed con reembolso
    print(f"\n✓ Actualizando ProductBuyed con quantity_refuned=2...")
    buyed.quantity_refuned = 2
    buyed.save()
    
    product.refresh_from_db()
    print_product_status(product, "Estado después de reembolso:")
    
    if product.amount_purchased != 8:
        print(f"  ❌ ERROR: amount_purchased debe ser 8 (10-2), pero es {product.amount_purchased}")
        return False
    else:
        print(f"  ✓ amount_purchased actualizado a 8")
    
    if product.status != ProductStatusEnum.ENCARGADO.value:
        print(f"  ❌ ERROR: Estado debe cambiar a ENCARGADO (8 < 10), pero es {product.status}")
        return False
    else:
        print(f"  ✓ Estado cambió a ENCARGADO")
    
    return True


def main():
    """Ejecuta todos los tests"""
    print("\n" + "="*80)
    print("DIAGNÓSTICO COMPLETO DEL FLUJO DE CAMBIO DE ESTADO DE PRODUCTOS")
    print("="*80)
    
    results = {}
    
    try:
        results["Escenario 1: Compra"] = test_scenario_1_purchase_flow()
    except Exception as e:
        print(f"\n❌ ERROR EN ESCENARIO 1: {str(e)}")
        import traceback
        traceback.print_exc()
        results["Escenario 1: Compra"] = False
    
    try:
        results["Escenario 2: Recepción"] = test_scenario_2_reception_flow()
    except Exception as e:
        print(f"\n❌ ERROR EN ESCENARIO 2: {str(e)}")
        import traceback
        traceback.print_exc()
        results["Escenario 2: Recepción"] = False
    
    try:
        results["Escenario 3: Entrega"] = test_scenario_3_delivery_flow()
    except Exception as e:
        print(f"\n❌ ERROR EN ESCENARIO 3: {str(e)}")
        import traceback
        traceback.print_exc()
        results["Escenario 3: Entrega"] = False
    
    try:
        results["Escenario 4: Parcial"] = test_scenario_4_partial_flow()
    except Exception as e:
        print(f"\n❌ ERROR EN ESCENARIO 4: {str(e)}")
        import traceback
        traceback.print_exc()
        results["Escenario 4: Parcial"] = False
    
    try:
        results["Escenario 5: Reembolso"] = test_scenario_5_refund_flow()
    except Exception as e:
        print(f"\n❌ ERROR EN ESCENARIO 5: {str(e)}")
        import traceback
        traceback.print_exc()
        results["Escenario 5: Reembolso"] = False
    
    # Resumen
    print("\n" + "="*80)
    print("RESUMEN DE RESULTADOS")
    print("="*80)
    
    for scenario, result in results.items():
        status = "✓ PASÓ" if result else "❌ FALLÓ"
        print(f"{scenario}: {status}")
    
    total_passed = sum(1 for r in results.values() if r)
    total = len(results)
    print(f"\nTotal: {total_passed}/{total} escenarios pasaron")
    
    if total_passed == total:
        print("\n✓ ¡Todos los escenarios pasaron! La lógica está funcionando correctamente.")
        return 0
    else:
        print(f"\n❌ {total - total_passed} escenarios fallaron. Hay problemas en la lógica.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
