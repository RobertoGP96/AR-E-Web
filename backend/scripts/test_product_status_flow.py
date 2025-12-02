"""
Script para probar el flujo completo de cambio de estado de productos.
Verifica que:
1. Al crear ProductReceived cuya suma == amount_purchased → estado = RECIBIDO
2. Al crear ProductDelivery cuya suma == amount_received == amount_purchased → estado = ENTREGADO
"""

import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Product, ProductBuyed, ProductReceived, ProductDelivery, ProductStatusEnum, Order, Shop, Category
from django.contrib.auth import get_user_model

User = get_user_model()

def cleanup_test_data():
    """Limpia datos de prueba previos"""
    Product.objects.filter(sku__startswith='TEST_').delete()
    print("✓ Datos previos limpiados\n")

def create_test_product():
    """Crea un producto de prueba"""
    # Obtener o crear usuario
    user = User.objects.first()
    if not user:
        user = User.objects.create_superuser('admin', 'admin@test.com', 'password')
    
    # Obtener o crear categoría y tienda
    category, _ = Category.objects.get_or_create(name='Test Category')
    shop, _ = Shop.objects.get_or_create(name='Test Shop', defaults={'user': user})
    
    # Crear orden
    order = Order.objects.create(
        client=user,
        sales_manager=user,
        observation='Orden de prueba'
    )
    
    # Crear producto
    product = Product.objects.create(
        sku='TEST_001',
        name='Producto Prueba',
        shop=shop,
        category=category,
        order=order,
        amount_requested=5,
        shop_cost=10.0,
        total_cost=50.0,
        status=ProductStatusEnum.ENCARGADO.value
    )
    
    return product, user, order

def test_product_received_status_change():
    """
    TEST 1: Verifica que al crear ProductBuyed y luego ProductReceived,
    el estado cambie de ENCARGADO → COMPRADO → RECIBIDO
    """
    print("="*70)
    print("TEST 1: Cambio de estado a RECIBIDO")
    print("="*70)
    
    cleanup_test_data()
    product, user, order = create_test_product()
    
    print(f"\n📦 Producto creado: {product.name}")
    print(f"   Estado inicial: {product.status}")
    print(f"   Cantidad solicitada: {product.amount_requested}")
    print(f"   Cantidad comprada: {product.amount_purchased}")
    print(f"   Cantidad recibida: {product.amount_received}")
    
    # PASO 1: Crear ProductBuyed
    print("\n--- PASO 1: Crear ProductBuyed ---")
    pb = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=5,
        actual_cost_of_product=10.0,
        real_cost_of_product=10.0
    )
    product.refresh_from_db()
    print(f"ProductBuyed creado: {pb.amount_buyed} unidades")
    print(f"Estado actual: {product.status}")
    print(f"Cantidad comprada actualizada: {product.amount_purchased}")
    
    if product.status != ProductStatusEnum.COMPRADO.value:
        print(f"⚠️  AVISO: Estado no cambió a COMPRADO automáticamente")
    
    # PASO 2: Crear ProductReceived
    print("\n--- PASO 2: Crear ProductReceived ---")
    pr = ProductReceived.objects.create(
        original_product=product,
        amount_received=5
    )
    product.refresh_from_db()
    print(f"ProductReceived creado: {pr.amount_received} unidades")
    print(f"Estado actual: {product.status}")
    print(f"Cantidad recibida actualizada: {product.amount_received}")
    
    # VERIFICACIÓN
    if product.status == ProductStatusEnum.RECIBIDO.value:
        print(f"\n✅ ÉXITO: Estado cambió a RECIBIDO")
        print(f"   Total recibido ({product.amount_received}) == Total comprado ({product.amount_purchased})")
        return True
    else:
        print(f"\n❌ ERROR: Estado no cambió a RECIBIDO")
        print(f"   Estado actual: {product.status}")
        print(f"   Total recibido: {product.amount_received}")
        print(f"   Total comprado: {product.amount_purchased}")
        return False

def test_product_delivered_status_change():
    """
    TEST 2: Verifica que al crear ProductDelivery,
    el estado cambie de RECIBIDO → ENTREGADO
    """
    print("\n" + "="*70)
    print("TEST 2: Cambio de estado a ENTREGADO")
    print("="*70)
    
    cleanup_test_data()
    product, user, order = create_test_product()
    
    print(f"\n📦 Producto creado: {product.name}")
    print(f"   Estado inicial: {product.status}")
    
    # Preparar: Comprar y recibir el producto
    print("\n--- PREPARACIÓN: Comprar y recibir ---")
    pb = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=5,
        actual_cost_of_product=10.0,
        real_cost_of_product=10.0
    )
    pr = ProductReceived.objects.create(
        original_product=product,
        amount_received=5
    )
    product.refresh_from_db()
    print(f"Producto comprado y recibido")
    print(f"Estado actual: {product.status}")
    print(f"Cantidad recibida: {product.amount_received}")
    
    if product.status != ProductStatusEnum.RECIBIDO.value:
        print(f"⚠️  AVISO: El producto no está en estado RECIBIDO")
    
    # PASO 3: Crear ProductDelivery
    print("\n--- PASO 3: Crear ProductDelivery ---")
    pd = ProductDelivery.objects.create(
        original_product=product,
        amount_delivered=5
    )
    product.refresh_from_db()
    print(f"ProductDelivery creado: {pd.amount_delivered} unidades")
    print(f"Estado actual: {product.status}")
    print(f"Cantidad entregada actualizada: {product.amount_delivered}")
    
    # VERIFICACIÓN
    if product.status == ProductStatusEnum.ENTREGADO.value:
        print(f"\n✅ ÉXITO: Estado cambió a ENTREGADO")
        print(f"   Total entregado ({product.amount_delivered}) == Total recibido ({product.amount_received})")
        print(f"   Total entregado ({product.amount_delivered}) == Total comprado ({product.amount_purchased})")
        return True
    else:
        print(f"\n❌ ERROR: Estado no cambió a ENTREGADO")
        print(f"   Estado actual: {product.status}")
        print(f"   Total entregado: {product.amount_delivered}")
        print(f"   Total recibido: {product.amount_received}")
        print(f"   Total comprado: {product.amount_purchased}")
        return False

def test_multiple_packages():
    """
    TEST 3: Verifica que funcione con múltiples paquetes/entregas
    cuya suma sea igual a la cantidad comprada
    """
    print("\n" + "="*70)
    print("TEST 3: Múltiples paquetes/entregas")
    print("="*70)
    
    cleanup_test_data()
    product, user, order = create_test_product()
    
    print(f"\n📦 Producto creado: {product.name}")
    print(f"   Cantidad solicitada: {product.amount_requested}")
    
    # Comprar
    pb = ProductBuyed.objects.create(
        original_product=product,
        amount_buyed=5,
        actual_cost_of_product=10.0,
        real_cost_of_product=10.0
    )
    product.refresh_from_db()
    
    # Recibir en 3 paquetes
    print("\n--- Recibiendo en 3 paquetes ---")
    for i, amount in enumerate([2, 1, 2], 1):
        pr = ProductReceived.objects.create(
            original_product=product,
            amount_received=amount
        )
        product.refresh_from_db()
        print(f"  Paquete {i}: {amount} unidades → Total recibido: {product.amount_received}, Estado: {product.status}")
    
    if product.status != ProductStatusEnum.RECIBIDO.value:
        print(f"❌ ERROR: No cambió a RECIBIDO después de recibir todo")
        return False
    
    # Entregar en 3 envíos
    print("\n--- Entregando en 3 envíos ---")
    for i, amount in enumerate([2, 1, 2], 1):
        pd = ProductDelivery.objects.create(
            original_product=product,
            amount_delivered=amount
        )
        product.refresh_from_db()
        print(f"  Envío {i}: {amount} unidades → Total entregado: {product.amount_delivered}, Estado: {product.status}")
    
    if product.status == ProductStatusEnum.ENTREGADO.value:
        print(f"\n✅ ÉXITO: Estado cambió a ENTREGADO después de múltiples entregas")
        return True
    else:
        print(f"\n❌ ERROR: No cambió a ENTREGADO")
        print(f"   Estado actual: {product.status}")
        return False

def main():
    print("\n" + "="*70)
    print("PRUEBAS DE CAMBIO DE ESTADO DE PRODUCTOS")
    print("="*70 + "\n")
    
    results = []
    
    # Ejecutar tests
    results.append(("TEST 1: RECIBIDO", test_product_received_status_change()))
    results.append(("TEST 2: ENTREGADO", test_product_delivered_status_change()))
    results.append(("TEST 3: Múltiples paquetes/entregas", test_multiple_packages()))
    
    # Resumen
    print("\n" + "="*70)
    print("RESUMEN DE RESULTADOS")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASÓ" if result else "❌ FALLÓ"
        print(f"{status}: {test_name}")
    
    print(f"\n{passed}/{total} pruebas pasadas")
    
    # Limpiar datos de prueba
    cleanup_test_data()

if __name__ == '__main__':
    main()
