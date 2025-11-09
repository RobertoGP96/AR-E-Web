"""
Script simplificado para probar el ciclo de vida del producto
Crea todos los datos necesarios
"""
import os
import sys
import django

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import (
    Product, ProductBuyed, ProductReceived, ProductDelivery,
    Package, Order, CustomUser, ShoppingReceip, DeliverReceip,
    Shop, BuyingAccounts, Category
)
from api.enums import ProductStatusEnum
from django.utils import timezone

def test_simple_lifecycle():
    """
    Prueba simple del ciclo de vida sin dependencias complejas
    """
    print("\n" + "="*70)
    print("PRUEBA SIMPLE: Ciclo de vida del producto")
    print("="*70 + "\n")
    
    try:
        # Encontrar o crear datos mínimos necesarios
        shop = Shop.objects.first()
        if not shop:
            shop = Shop.objects.create(name="TEST SHOP", link="http://test.com")
            print("✓ Tienda de prueba creada")
        
        client = CustomUser.objects.filter(role='client').first()
        if not client:
            client = CustomUser.objects.create_user(
                phone_number="11111111",
                password="test123",
                name="Test",
                last_name="Client",
                role="client",
                home_address="Test"
            )
            print("✓ Cliente de prueba creado")
        
        sales_manager = CustomUser.objects.filter(role='admin').first()
        if not sales_manager:
            sales_manager = CustomUser.objects.create_user(
                phone_number="22222222",
                password="test123",
                name="Test",
                last_name="Admin",
                role="admin",
                home_address="Test"
            )
            print("✓ Admin de prueba creado")
        
        order = Order.objects.create(
            client=client,
            sales_manager=sales_manager,
            status="Encargado"
        )
        print("✓ Orden de prueba creada\n")
        
        # Crear producto con estado ENCARGADO
        product = Product.objects.create(
            name="PRODUCTO TEST SIMPLE",
            shop=shop,
            order=order,
            amount_requested=10,
            shop_cost=100.0,
            status=ProductStatusEnum.ENCARGADO.value
        )
        print(f"PASO 1: Producto creado - Estado: {product.status}")
        print(f"        Solicitado: {product.amount_requested}\n")
        
        # COMPRAR
        buying_account = BuyingAccounts.objects.first()
        if not buying_account:
            buying_account = BuyingAccounts.objects.create(
                account_name="TEST ACCOUNT"
            )
        
        shopping_receip = ShoppingReceip.objects.create(
            shopping_account=buying_account,
            shop_of_buy=shop,
            total_cost_of_purchase=1000.0
        )
        
        ProductBuyed.objects.create(
            original_product=product,
            shoping_receip=shopping_receip,
            amount_buyed=10,
            actual_cost_of_product=100.0
        )
        
        product.refresh_from_db()
        print(f"PASO 2: Compra completa - Estado: {product.status}")
        print(f"        Comprado: {product.amount_purchased}/{product.amount_requested}")
        
        if product.status == ProductStatusEnum.COMPRADO.value:
            print("        ✓ Estado correcto: COMPRADO\n")
        else:
            print(f"        ❌ Estado incorrecto: esperado COMPRADO, actual {product.status}\n")
        
        # RECIBIR
        package = Package.objects.create(
            agency_name="TEST-PKG",
            number_of_tracking="TEST123",
            status_of_processing="Recibido",
            arrival_date=timezone.now().date()
        )
        
        ProductReceived.objects.create(
            original_product=product,
            package=package,
            amount_received=10
        )
        
        product.refresh_from_db()
        print(f"PASO 3: Recepción completa - Estado: {product.status}")
        print(f"        Recibido: {product.total_received}/{product.amount_requested}")
        
        if product.status == ProductStatusEnum.RECIBIDO.value:
            print("        ✓ Estado correcto: RECIBIDO\n")
        else:
            print(f"        ❌ Estado incorrecto: esperado RECIBIDO, actual {product.status}\n")
        
        # ENTREGAR
        delivery_receip = DeliverReceip.objects.create(
            client=client,
            weight=5.0,
            deliver_date=timezone.now()
        )
        
        ProductDelivery.objects.create(
            original_product=product,
            deliver_receip=delivery_receip,
            amount_delivered=10
        )
        
        product.refresh_from_db()
        print(f"PASO 4: Entrega completa - Estado: {product.status}")
        print(f"        Entregado: {product.amount_delivered}/{product.amount_requested}")
        
        if product.status == ProductStatusEnum.ENTREGADO.value:
            print("        ✓ Estado correcto: ENTREGADO\n")
        else:
            print(f"        ❌ Estado incorrecto: esperado ENTREGADO, actual {product.status}\n")
        
        # RESUMEN
        print("="*70)
        print("RESUMEN DEL CICLO DE VIDA:")
        print("="*70)
        print(f"  ENCARGADO → COMPRADO → RECIBIDO → ENTREGADO")
        print(f"\n  Estado final: {product.status}")
        print(f"  Cantidad solicitada: {product.amount_requested}")
        print(f"  Cantidad comprada: {product.amount_purchased}")
        print(f"  Cantidad recibida: {product.total_received}")
        print(f"  Cantidad entregada: {product.amount_delivered}")
        
        if product.status == ProductStatusEnum.ENTREGADO.value:
            print(f"\n  ✅ PRUEBA EXITOSA: El ciclo de vida funciona correctamente")
        else:
            print(f"\n  ❌ PRUEBA FALLIDA: Estado final incorrecto")
        
        print("="*70)
        
        # Limpiar
        print("\nLimpiando datos de prueba...")
        ProductDelivery.objects.filter(original_product=product).delete()
        ProductReceived.objects.filter(original_product=product).delete()
        ProductBuyed.objects.filter(original_product=product).delete()
        delivery_receip.delete()
        package.delete()
        shopping_receip.delete()
        product.delete()
        order.delete()
        print("✓ Limpieza completada\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_simple_lifecycle()
