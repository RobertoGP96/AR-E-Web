"""
Script para probar la actualización automática del estado de productos al recibir
"""
import os
import sys
import django

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Product, ProductReceived, Package, Order, CustomUser
from api.enums import ProductStatusEnum

def test_product_received_status():
    """
    Prueba que al crear ProductReceived:
    1. Se actualice el estado del producto a RECIBIDO cuando se reciba toda la cantidad
    2. Se mantenga el estado si no se ha recibido toda la cantidad
    """
    print("\n" + "="*60)
    print("PRUEBA: Actualización automática de estado de productos")
    print("="*60 + "\n")
    
    # Buscar o crear una orden de prueba
    try:
        # Buscar un usuario admin
        admin_user = CustomUser.objects.filter(role='admin').first()
        if not admin_user:
            print("❌ No se encontró un usuario admin. Creando uno...")
            admin_user = CustomUser.objects.create_user(
                email="test_admin@test.com",
                phone_number="99999999",
                password="test123",
                name="Test",
                last_name="Admin",
                role="admin",
                home_address="Test Address"
            )
        
        # Buscar o crear una orden
        order = Order.objects.filter(created_by=admin_user).first()
        if not order:
            print("❌ No se encontró una orden. Por favor crea una orden primero.")
            return
        
        # Buscar un producto con estado ENCARGADO o COMPRADO
        product = Product.objects.filter(
            order=order,
            status__in=[ProductStatusEnum.ENCARGADO.value, ProductStatusEnum.COMPRADO.value]
        ).first()
        
        if not product:
            print("❌ No se encontró un producto disponible para probar.")
            print("Por favor crea un producto con estado ENCARGADO o COMPRADO.")
            return
        
        print(f"✓ Producto seleccionado: {product.name}")
        print(f"  - ID: {product.id}")
        print(f"  - Estado inicial: {product.status}")
        print(f"  - Cantidad solicitada: {product.amount_requested}")
        print(f"  - Cantidad recibida actualmente: {product.total_received}")
        print()
        
        # Crear un paquete de prueba
        package = Package.objects.create(
            agency_name="TEST-PKG-001",
            number_of_tracking="TEST123456",
            status_of_processing="Recibido",
            arrival_date=django.utils.timezone.now().date()
        )
        print(f"✓ Paquete de prueba creado: {package.agency_name}")
        print()
        
        # Caso 1: Recibir MENOS de la cantidad solicitada
        print("--- Caso 1: Recibir cantidad PARCIAL ---")
        partial_amount = max(1, product.amount_requested - 1)  # Una unidad menos
        
        pr1 = ProductReceived.objects.create(
            original_product=product,
            package=package,
            amount_received=partial_amount,
            observation="Prueba: Recepción parcial"
        )
        
        # Recargar el producto desde la BD
        product.refresh_from_db()
        
        print(f"  Cantidad recibida: {partial_amount}")
        print(f"  Total recibido: {product.total_received}")
        print(f"  Estado del producto: {product.status}")
        
        if product.status != ProductStatusEnum.RECIBIDO.value:
            print(f"  ✓ CORRECTO: El estado NO cambió a RECIBIDO (faltan unidades)")
        else:
            print(f"  ❌ ERROR: El estado cambió a RECIBIDO prematuramente")
        print()
        
        # Caso 2: Completar la cantidad solicitada
        print("--- Caso 2: Completar la cantidad TOTAL ---")
        remaining = product.amount_requested - product.total_received
        
        if remaining > 0:
            pr2 = ProductReceived.objects.create(
                original_product=product,
                package=package,
                amount_received=remaining,
                observation="Prueba: Completar recepción"
            )
            
            # Recargar el producto desde la BD
            product.refresh_from_db()
            
            print(f"  Cantidad recibida adicional: {remaining}")
            print(f"  Total recibido final: {product.total_received}")
            print(f"  Estado del producto: {product.status}")
            
            if product.status == ProductStatusEnum.RECIBIDO.value:
                print(f"  ✓ CORRECTO: El estado cambió a RECIBIDO automáticamente")
            else:
                print(f"  ❌ ERROR: El estado NO cambió a RECIBIDO")
            print()
        
        # Caso 3: Eliminar un ProductReceived y verificar que el estado se ajuste
        print("--- Caso 3: Eliminar un ProductReceived ---")
        pr1.delete()
        
        # Recargar el producto desde la BD
        product.refresh_from_db()
        
        print(f"  Total recibido después de eliminar: {product.total_received}")
        print(f"  Estado del producto: {product.status}")
        
        if product.total_received >= product.amount_requested:
            if product.status == ProductStatusEnum.RECIBIDO.value:
                print(f"  ✓ CORRECTO: El estado sigue siendo RECIBIDO")
            else:
                print(f"  ❌ ERROR: El estado debería ser RECIBIDO")
        else:
            if product.status != ProductStatusEnum.RECIBIDO.value:
                print(f"  ✓ CORRECTO: El estado volvió a {product.status}")
            else:
                print(f"  ❌ ERROR: El estado debería haber cambiado de RECIBIDO")
        
        print()
        print("="*60)
        print("LIMPIEZA: Eliminando datos de prueba")
        print("="*60)
        
        # Limpiar datos de prueba
        ProductReceived.objects.filter(package=package).delete()
        package.delete()
        
        # Restaurar el estado original del producto si es necesario
        product.status = ProductStatusEnum.ENCARGADO.value
        product.save()
        
        print("✓ Datos de prueba eliminados correctamente")
        print()
        
    except Exception as e:
        print(f"\n❌ Error durante la prueba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_product_received_status()
