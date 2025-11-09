"""
Script para probar el ciclo de vida completo de un producto:
ENCARGADO -> COMPRADO -> RECIBIDO -> ENTREGADO
"""
import os
import sys
import django

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import (
    Product, ProductBuyed, ProductReceived, ProductDelivery,
    Package, Order, CustomUser, ShoppingReceip, DeliverReceip,
    Shop, BuyingAccounts
)
from api.enums import ProductStatusEnum
from django.utils import timezone

def print_product_status(product, step):
    """Helper para imprimir el estado actual del producto"""
    print(f"\n{'='*60}")
    print(f"PASO {step}")
    print(f"{'='*60}")
    product.refresh_from_db()
    print(f"Producto: {product.name}")
    print(f"Estado: {product.status}")
    print(f"Cantidad solicitada: {product.amount_requested}")
    print(f"Cantidad comprada: {product.amount_purchased}")
    print(f"Cantidad recibida: {product.total_received}")
    print(f"Cantidad entregada: {product.amount_delivered}")
    print(f"{'='*60}\n")

def test_product_lifecycle():
    """
    Prueba el ciclo completo:
    1. ENCARGADO (inicial)
    2. COMPRADO (al comprar toda la cantidad)
    3. RECIBIDO (al recibir toda la cantidad)
    4. ENTREGADO (al entregar toda la cantidad)
    """
    print("\n" + "="*60)
    print("PRUEBA: Ciclo de vida completo del producto")
    print("="*60 + "\n")
    
    try:
        # 1. Buscar o crear datos necesarios
        admin_user = CustomUser.objects.filter(role='admin').first()
        if not admin_user:
            print("❌ No se encontró un usuario admin")
            return
        
        # Buscar una orden existente
        order = Order.objects.first()
        if not order:
            print("❌ No se encontró una orden. Por favor crea una orden primero.")
            return
        
        # Buscar o crear una tienda
        shop = Shop.objects.first()
        if not shop:
            print("❌ No se encontró una tienda. Por favor crea una tienda primero.")
            return
        
        # Buscar o crear cuenta de compra
        buying_account = BuyingAccounts.objects.first()
        if not buying_account:
            print("❌ No se encontró una cuenta de compra. Por favor crea una cuenta primero.")
            return
        
        # Crear un producto de prueba con estado ENCARGADO
        product = Product.objects.create(
            name="PRODUCTO TEST CICLO VIDA",
            shop=shop,
            order=order,
            amount_requested=10,
            shop_cost=100.0,
            status=ProductStatusEnum.ENCARGADO.value
        )
        
        print_product_status(product, "1 - INICIAL (ENCARGADO)")
        
        if product.status != ProductStatusEnum.ENCARGADO.value:
            print(f"❌ ERROR: Estado inicial incorrecto. Esperado: ENCARGADO, Actual: {product.status}")
            return
        else:
            print("✓ Estado inicial correcto: ENCARGADO")
        
        # 2. COMPRAR el producto (parcial)
        print("\n--- Comprando 5 unidades (parcial) ---")
        shopping_receip = ShoppingReceip.objects.create(
            shopping_account=buying_account,
            shop_of_buy=shop,
            total_cost_of_purchase=500.0
        )
        
        pb1 = ProductBuyed.objects.create(
            original_product=product,
            shoping_receip=shopping_receip,
            amount_buyed=5,
            actual_cost_of_product=50.0
        )
        
        print_product_status(product, "2A - DESPUÉS DE COMPRA PARCIAL (5/10)")
        
        if product.status == ProductStatusEnum.ENCARGADO.value:
            print("✓ Estado correcto: ENCARGADO (compra parcial)")
        else:
            print(f"❌ ERROR: Estado incorrecto. Esperado: ENCARGADO, Actual: {product.status}")
        
        # 3. COMPLETAR la compra
        print("\n--- Comprando las 5 unidades restantes ---")
        pb2 = ProductBuyed.objects.create(
            original_product=product,
            shoping_receip=shopping_receip,
            amount_buyed=5,
            actual_cost_of_product=50.0
        )
        
        print_product_status(product, "2B - DESPUÉS DE COMPRA COMPLETA (10/10)")
        
        if product.status == ProductStatusEnum.COMPRADO.value:
            print("✓ Estado correcto: COMPRADO (toda la cantidad comprada)")
        else:
            print(f"❌ ERROR: Estado incorrecto. Esperado: COMPRADO, Actual: {product.status}")
        
        # 4. RECIBIR el producto (parcial)
        print("\n--- Recibiendo 6 unidades (parcial) ---")
        package = Package.objects.create(
            agency_name="TEST-PKG-LIFECYCLE",
            number_of_tracking="TEST-TRACK-001",
            status_of_processing="Recibido",
            arrival_date=timezone.now().date()
        )
        
        pr1 = ProductReceived.objects.create(
            original_product=product,
            package=package,
            amount_received=6
        )
        
        print_product_status(product, "3A - DESPUÉS DE RECEPCIÓN PARCIAL (6/10)")
        
        if product.status == ProductStatusEnum.COMPRADO.value:
            print("✓ Estado correcto: COMPRADO (recepción parcial)")
        else:
            print(f"❌ ERROR: Estado incorrecto. Esperado: COMPRADO, Actual: {product.status}")
        
        # 5. COMPLETAR la recepción
        print("\n--- Recibiendo las 4 unidades restantes ---")
        pr2 = ProductReceived.objects.create(
            original_product=product,
            package=package,
            amount_received=4
        )
        
        print_product_status(product, "3B - DESPUÉS DE RECEPCIÓN COMPLETA (10/10)")
        
        if product.status == ProductStatusEnum.RECIBIDO.value:
            print("✓ Estado correcto: RECIBIDO (toda la cantidad recibida)")
        else:
            print(f"❌ ERROR: Estado incorrecto. Esperado: RECIBIDO, Actual: {product.status}")
        
        # 6. ENTREGAR el producto (parcial)
        print("\n--- Entregando 7 unidades (parcial) ---")
        client = CustomUser.objects.filter(role='client').first()
        if not client:
            # Crear un cliente de prueba
            client = CustomUser.objects.create_user(
                email="test_client@test.com",
                phone_number="88888888",
                password="test123",
                name="Cliente",
                last_name="Test",
                role="client",
                home_address="Test Address"
            )
        
        delivery_receip = DeliverReceip.objects.create(
            client=client,
            weight=5.0,
            deliver_date=timezone.now()
        )
        
        pd1 = ProductDelivery.objects.create(
            original_product=product,
            deliver_receip=delivery_receip,
            amount_delivered=7
        )
        
        print_product_status(product, "4A - DESPUÉS DE ENTREGA PARCIAL (7/10)")
        
        if product.status == ProductStatusEnum.RECIBIDO.value:
            print("✓ Estado correcto: RECIBIDO (entrega parcial)")
        else:
            print(f"❌ ERROR: Estado incorrecto. Esperado: RECIBIDO, Actual: {product.status}")
        
        # 7. COMPLETAR la entrega
        print("\n--- Entregando las 3 unidades restantes ---")
        pd2 = ProductDelivery.objects.create(
            original_product=product,
            deliver_receip=delivery_receip,
            amount_delivered=3
        )
        
        print_product_status(product, "4B - DESPUÉS DE ENTREGA COMPLETA (10/10)")
        
        if product.status == ProductStatusEnum.ENTREGADO.value:
            print("✓ Estado correcto: ENTREGADO (toda la cantidad entregada)")
        else:
            print(f"❌ ERROR: Estado incorrecto. Esperado: ENTREGADO, Actual: {product.status}")
        
        # 8. PRUEBA INVERSA: Eliminar entregas y ver si el estado retrocede
        print("\n" + "="*60)
        print("PRUEBA INVERSA: Verificar retroceso de estados")
        print("="*60 + "\n")
        
        print("--- Eliminando entrega parcial (7 unidades) ---")
        pd1.delete()
        print_product_status(product, "5 - DESPUÉS DE ELIMINAR ENTREGA PARCIAL")
        
        if product.status == ProductStatusEnum.RECIBIDO.value:
            print("✓ Estado correcto: RECIBIDO (aún hay 3 entregadas, pero falta completar)")
        else:
            print(f"⚠ Estado: {product.status}")
        
        print("--- Eliminando entrega completa (3 unidades) ---")
        pd2.delete()
        print_product_status(product, "6 - DESPUÉS DE ELIMINAR TODAS LAS ENTREGAS")
        
        if product.status == ProductStatusEnum.RECIBIDO.value:
            print("✓ Estado correcto: RECIBIDO (recepción completa, sin entregas)")
        else:
            print(f"❌ ERROR: Estado incorrecto. Esperado: RECIBIDO, Actual: {product.status}")
        
        # Limpiar
        print("\n" + "="*60)
        print("LIMPIEZA: Eliminando datos de prueba")
        print("="*60 + "\n")
        
        ProductReceived.objects.filter(package=package).delete()
        package.delete()
        ProductBuyed.objects.filter(shoping_receip=shopping_receip).delete()
        shopping_receip.delete()
        delivery_receip.delete()
        product.delete()
        
        print("✓ Datos de prueba eliminados correctamente")
        print("\n" + "="*60)
        print("PRUEBA COMPLETADA CON ÉXITO")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error durante la prueba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_product_lifecycle()
