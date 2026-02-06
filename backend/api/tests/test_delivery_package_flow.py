"""
Tests para verificar que el flujo completo de creación de paquete con productos
dispara correctamente los signals y actualiza los campos del producto.
"""
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import (
    Product, Order, ProductBuyed, ProductReceived, 
    ProductDelivery, DeliverReceip, Shop, Category
)
from api.enums import ProductStatusEnum, OrderStatusEnum
from api.serializers import DeliverReceipSerializer
import time
import uuid

CustomUser = get_user_model()


class DeliveryPackageFlowTest(TransactionTestCase):
    """
    Tests para verificar el flujo completo de creación de paquete con productos.
    
    Flujo esperado:
    1. Crear DeliverReceip (paquete)
    2. Asignar ProductDelivery (productos al paquete)
    3. Signal post_save en ProductDelivery se dispara
    4. ProductStatusService.recalculate_product_status() se ejecuta
    5. Product.amount_delivered se actualiza
    6. Product.status se actualiza a RECIBIDO/ENTREGADO según corresponda
    """
    
    def setUp(self):
        """Configuración común para los tests"""
        # Crear usuarios con emails únicos
        unique_id = str(uuid.uuid4())[:8]
        self.client_user = CustomUser.objects.create_user(
            phone_number=f"+34123456789{unique_id}",
            email=f"client_{unique_id}@test.com",
            name="Client User",
            password="testpass123",
            role="client"
        )
        
        self.manager_user = CustomUser.objects.create_user(
            phone_number=f"+34987654321{unique_id}",
            email=f"manager_{unique_id}@test.com",
            name="Manager User",
            password="testpass123",
            role="logistical"
        )
        
        # Crear categoría
        self.category = Category.objects.create(
            name="Electronics",
            shipping_cost_per_pound=5.0
        )
        
        # Crear tienda
        self.shop = Shop.objects.create(
            name=f"Test Shop {unique_id}",
            link=f"https://test-shop-{unique_id}.com",
            tax_rate=0.21
        )
        
        # Crear orden
        self.order = Order.objects.create(
            client=self.client_user,
            status=OrderStatusEnum.PROCESANDO.value
        )
        
    def test_product_delivery_signal_fires_when_creating_package(self):
        """
        Verifica que cuando se crea un paquete de entrega (DeliverReceip)
        con productos (ProductDelivery), el signal se dispara y actualiza el estado.
        
        Escenario:
        - Producto pedido: 10 unidades
        - Producto comprado: 10 unidades
        - Producto recibido: 10 unidades
        - Producto entregado: 0 unidades (será actualizado por el signal)
        
        Resultado esperado:
        - Al crear ProductDelivery con 10 unidades
        - Product.amount_delivered debe ser 10
        - Product.status debe ser ENTREGADO
        """
        # Crear un producto completo
        product = Product.objects.create(
            name="Test Product",
            sku="TEST-001",
            shop=self.shop,
            order=self.order,
            amount_requested=10,
            amount_purchased=10,
            amount_received=10,
            amount_delivered=0,  # Aún no se ha entregado
            shop_cost=100.0,
            total_cost=1000.0,
            status=ProductStatusEnum.RECIBIDO.value
        )
        
        # Crear DeliverReceip (paquete)
        delivery = DeliverReceip.objects.create(
            client=self.client_user,
            category=self.category,
            weight=10.0
        )
        
        # Crear ProductDelivery (asignar producto al paquete)
        product_delivery = ProductDelivery.objects.create(
            original_product=product,
            deliver_receip=delivery,
            amount_delivered=10
        )
        
        # Verificar que el signal se disparó y actualizó el producto
        product.refresh_from_db()
        
        # ✓ VERIFICACIÓN 1: amount_delivered debe ser 10
        self.assertEqual(
            product.amount_delivered, 10,
            f"❌ amount_delivered esperado 10, obtuvo {product.amount_delivered}"
        )
        
        # ✓ VERIFICACIÓN 2: status debe ser ENTREGADO
        self.assertEqual(
            product.status, ProductStatusEnum.ENTREGADO.value,
            f"❌ status esperado {ProductStatusEnum.ENTREGADO.value}, obtuvo {product.status}"
        )
        
        print(f"✓ Signal disparado correctamente:")
        print(f"  - Product ID: {product.id}")
        print(f"  - amount_delivered: {product.amount_delivered} (esperado 10)")
        print(f"  - status: {product.status} (esperado {ProductStatusEnum.ENTREGADO.value})")
    
    def test_partial_delivery_changes_status_to_entregado_when_amount_matches(self):
        """
        Verifica que el estado cambia correctamente cuando se entrega parcialmente
        pero la cantidad total coincide con la solicitada.
        
        Escenario:
        - Producto pedido: 10 unidades
        - Producto comprado: 10 unidades
        - Producto recibido: 10 unidades
        - Crear dos paquetes con 5 unidades cada uno
        
        Resultado esperado:
        - Después del primer paquete: status = ENTREGADO (5+0 no es suficiente, pero...)
          NOTA: Esto depende de la lógica, puede ser RECIBIDO si no se ha entregado todo
        - Después del segundo paquete: status = ENTREGADO (5+5 = 10)
        """
        # Crear un producto
        product = Product.objects.create(
            name="Test Product",
            sku="TEST-001",
            shop=self.shop,
            order=self.order,
            amount_requested=10,
            amount_purchased=10,
            amount_received=10,
            amount_delivered=0,
            shop_cost=100.0,
            total_cost=1000.0,
            status=ProductStatusEnum.RECIBIDO.value
        )
        
        # Crear primer paquete
        delivery1 = DeliverReceip.objects.create(
            client=self.client_user,
            category=self.category,
            weight=5.0
        )
        
        # Entregar 5 unidades
        ProductDelivery.objects.create(
            original_product=product,
            deliver_receip=delivery1,
            amount_delivered=5
        )
        
        product.refresh_from_db()
        
        # ✓ VERIFICACIÓN 1: Después de entregar 5
        self.assertEqual(product.amount_delivered, 5)
        # El status debe ser RECIBIDO porque no se entregó todo
        self.assertEqual(product.status, ProductStatusEnum.RECIBIDO.value)
        
        # Crear segundo paquete
        delivery2 = DeliverReceip.objects.create(
            client=self.client_user,
            category=self.category,
            weight=5.0
        )
        
        # Entregar 5 unidades más
        ProductDelivery.objects.create(
            original_product=product,
            deliver_receip=delivery2,
            amount_delivered=5
        )
        
        product.refresh_from_db()
        
        # ✓ VERIFICACIÓN 2: Después de entregar 5+5=10
        self.assertEqual(
            product.amount_delivered, 10,
            f"❌ amount_delivered esperado 10, obtuvo {product.amount_delivered}"
        )
        
        # ✓ VERIFICACIÓN 3: Status debe ser ENTREGADO
        self.assertEqual(
            product.status, ProductStatusEnum.ENTREGADO.value,
            f"❌ status esperado {ProductStatusEnum.ENTREGADO.value}, obtuvo {product.status}"
        )
        
        print(f"✓ Entrega parcial manejada correctamente:")
        print(f"  - Primer paquete: 5 unidades → amount_delivered=5, status={ProductStatusEnum.RECIBIDO.value}")
        print(f"  - Segundo paquete: 5 unidades → amount_delivered=10, status={ProductStatusEnum.ENTREGADO.value}")
    
    def test_product_status_mismatch_between_ordered_and_delivered(self):
        """
        Verifica el comportamiento cuando la cantidad entregada no coincide
        con la cantidad solicitada.
        
        Escenario:
        - Producto pedido: 10 unidades
        - Producto comprado: 10 unidades
        - Producto recibido: 10 unidades
        - Producto entregado: 8 unidades (MISMATCH)
        
        Resultado esperado:
        - Status debe ser RECIBIDO (no ENTREGADO porque no se entregó todo)
        """
        product = Product.objects.create(
            name="Test Product",
            sku="TEST-001",
            shop=self.shop,
            order=self.order,
            amount_requested=10,
            amount_purchased=10,
            amount_received=10,
            amount_delivered=0,
            shop_cost=100.0,
            total_cost=1000.0,
            status=ProductStatusEnum.RECIBIDO.value
        )
        
        delivery = DeliverReceip.objects.create(
            client=self.client_user,
            category=self.category,
            weight=8.0
        )
        
        # Entregar solo 8 unidades (no todas)
        ProductDelivery.objects.create(
            original_product=product,
            deliver_receip=delivery,
            amount_delivered=8
        )
        
        product.refresh_from_db()
        
        # ✓ VERIFICACIÓN: status debe ser RECIBIDO (no ENTREGADO)
        self.assertEqual(product.amount_delivered, 8)
        self.assertEqual(
            product.status, ProductStatusEnum.RECIBIDO.value,
            f"❌ status debe ser RECIBIDO cuando no se entrega todo, obtuvo {product.status}"
        )
        
        print(f"✓ Mismatch entre pedido y entrega manejado correctamente:")
        print(f"  - Pedido: 10 unidades")
        print(f"  - Entregado: 8 unidades")
        print(f"  - Status: {product.status} (esperado RECIBIDO)")


class DeliverReceipSerializerFlowTest(APITestCase):
    """
    Tests usando el serializador DeliverReceipSerializer para simular
    el flujo real de creación de paquetes desde la API.
    """
    
    def setUp(self):
        """Configuración común para los tests"""
        # Crear usuarios con emails únicos
        unique_id = str(uuid.uuid4())[:8]
        self.client_user = CustomUser.objects.create_user(
            phone_number=f"+34123456789{unique_id}",
            email=f"client_{unique_id}@test.com",
            name="Client User",
            password="testpass123",
            role="client"
        )
        
        # Crear categoría
        self.category = Category.objects.create(
            name="Electronics",
            shipping_cost_per_pound=5.0
        )
        
        # Crear tienda
        self.shop = Shop.objects.create(
            name="Test Shop APIFlow",
            link="https://test-shop-api.com",
            tax_rate=0.21
        )
        
        # Crear orden
        self.order = Order.objects.create(
            client=self.client_user,
            status=OrderStatusEnum.PROCESANDO.value
        )
    
    def test_create_delivery_with_products_via_serializer(self):
        """
        Verifica que al crear un DeliverReceip con ProductDelivery
        usando el serializador, los signals se disparan correctamente.
        """
        # Crear producto
        product = Product.objects.create(
            name="Test Product",
            sku="TEST-001",
            shop=self.shop,
            order=self.order,
            amount_requested=10,
            amount_purchased=10,
            amount_received=10,
            amount_delivered=0,
            shop_cost=100.0,
            total_cost=1000.0,
            status=ProductStatusEnum.RECIBIDO.value
        )
        
        # Datos para crear DeliverReceip
        delivery_data = {
            'client_id': self.client_user.id,
            'category_id': self.category.id,
            'weight': 10.0,
            'delivered_products': [
                {
                    'original_product_id': product.id,
                    'amount_delivered': 10
                }
            ]
        }
        
        # Usar el serializador
        serializer = DeliverReceipSerializer(data=delivery_data)
        
        if serializer.is_valid():
            delivery = serializer.save()
            
            # Refrescar el producto para obtener los cambios del signal
            product.refresh_from_db()
            
            # ✓ VERIFICACIONES
            self.assertEqual(product.amount_delivered, 10)
            self.assertEqual(product.status, ProductStatusEnum.ENTREGADO.value)
            
            print(f"✓ DeliverReceip creado vía serializer:")
            print(f"  - DeliverReceip ID: {delivery.id}")
            print(f"  - Productos: {delivery.delivered_products.count()}")
            print(f"  - Product status actualizado a: {product.status}")
        else:
            self.fail(f"Serializer errors: {serializer.errors}")


# ============================================================================
# DIAGNOSTICO Y DEBUGGING
# ============================================================================

class DeliverySignalDiagnosticsTest(TransactionTestCase):
    """
    Tests para diagnosticar si los signals se están disparando correctamente.
    """
    
    def setUp(self):
        """Configuración común para los tests"""
        self.client_user = CustomUser.objects.create_user(
            phone_number=f"+34123456789{str(uuid.uuid4())[:8]}",
            email=f"client_{str(uuid.uuid4())[:8]}@test.com",
            name="Client User",
            password="testpass123",
            role="client"
        )
        
        self.category = Category.objects.create(
            name="Electronics",
            shipping_cost_per_pound=5.0
        )
        
        self.shop = Shop.objects.create(
            name="Test Shop Diag",
            link="https://test-shop-diag.com",
            tax_rate=0.21
        )
        
        self.order = Order.objects.create(
            client=self.client_user,
            status=OrderStatusEnum.PROCESANDO.value
        )
    
    def test_signal_dispatch_logging(self):
        """
        Verifica y registra si los signals se están disparando
        durante la creación de ProductDelivery.
        """
        from django.db.models.signals import post_save
        from api.models import ProductDelivery
        
        # Crear un flag para detectar si el signal se disparó
        signal_fired = {'fired': False, 'instance': None}
        
        def signal_handler(sender, instance, created, **kwargs):
            signal_fired['fired'] = True
            signal_fired['instance'] = instance
        
        # Conectar el signal manualmente para verificación
        post_save.connect(signal_handler, sender=ProductDelivery, dispatch_uid='test_signal')
        
        try:
            # Crear producto
            product = Product.objects.create(
                name="Test Product",
                sku="TEST-001",
                shop=self.shop,
                order=self.order,
                amount_requested=10,
                amount_purchased=10,
                amount_received=10,
                amount_delivered=0,
                shop_cost=100.0,
                total_cost=1000.0,
                status=ProductStatusEnum.RECIBIDO.value
            )
            
            # Crear paquete
            delivery = DeliverReceip.objects.create(
                client=self.client_user,
                category=self.category,
                weight=10.0
            )
            
            # Crear ProductDelivery
            product_delivery = ProductDelivery.objects.create(
                original_product=product,
                deliver_receip=delivery,
                amount_delivered=10
            )
            
            # Verificar si el signal se disparó
            self.assertTrue(
                signal_fired['fired'],
                "❌ Signal post_save no se disparó para ProductDelivery"
            )
            
            # Verificar que el producto se actualizó
            product.refresh_from_db()
            self.assertEqual(product.amount_delivered, 10)
            
            print(f"✓ Signal diagnostics:")
            print(f"  - Signal disparado: {signal_fired['fired']}")
            print(f"  - ProductDelivery ID: {product_delivery.id}")
            print(f"  - Product actualizado: amount_delivered={product.amount_delivered}")
            print(f"  - Product status: {product.status}")
        finally:
            # Desconectar el signal
            post_save.disconnect(dispatch_uid='test_signal')
