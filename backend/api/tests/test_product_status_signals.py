"""
Tests para verificar que los signals de actualización de estado del producto funcionan correctamente.
"""
from django.test import TestCase, TransactionTestCase
from django.db.models.signals import post_save, post_delete
from api.models import (
    Product, Order, CustomUser, ProductBuyed, ProductReceived, 
    ProductDelivery, DeliverReceip, Package, Shop, Category
)
from api.enums import ProductStatusEnum, OrderStatusEnum


class ProductBuyedSignalsTest(TransactionTestCase):
    """Tests para signals de ProductBuyed"""
    
    def setUp(self):
        """Configuración común para los tests"""
        # Crear usuario cliente
        self.client_user = CustomUser.objects.create_user(
            email="client@test.com",
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
            name="Test Shop",
            sales_manager=self.client_user
        )
        
        # Crear orden
        self.order = Order.objects.create(
            client=self.client_user,
            status=OrderStatusEnum.ENCARGADO.value
        )
        
        # Crear producto
        self.product = Product.objects.create(
            name="Test Product",
            sku="TEST-001",
            shop=self.shop,
            order=self.order,
            amount_requested=10,
            shop_cost=100.0,
            total_cost=1000.0
        )
    
    def test_product_status_changes_to_comprado_on_buyed_save(self):
        """Verifica que el estado del producto cambia a COMPRADO cuando se compra la cantidad solicitada"""
        # Inicialmente el producto debe estar ENCARGADO
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
        
        # Crear un ProductBuyed con la cantidad solicitada
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=10
        )
        
        # El producto debe cambiar a COMPRADO
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
        self.assertEqual(self.product.amount_purchased, 10)
    
    def test_product_amount_purchased_updates_on_buyed_save(self):
        """Verifica que amount_purchased se actualiza correctamente"""
        # Crear dos ProductBuyed
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5
        )
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5
        )
        
        # El total debe ser 10
        self.product.refresh_from_db()
        self.assertEqual(self.product.amount_purchased, 10)
    
    def test_product_status_reverts_to_encargado_on_buyed_delete(self):
        """Verifica que el estado vuelve a ENCARGADO cuando se elimina una compra incompleta"""
        # Crear un ProductBuyed parcial
        buyed = ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5
        )
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
        
        # Eliminar el ProductBuyed
        buyed.delete()
        
        # El estado debe seguir siendo ENCARGADO
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
        self.assertEqual(self.product.amount_purchased, 0)


class ProductReceivedSignalsTest(TransactionTestCase):
    """Tests para signals de ProductReceived"""
    
    def setUp(self):
        """Configuración común para los tests"""
        # Crear usuario cliente
        self.client_user = CustomUser.objects.create_user(
            email="client@test.com",
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
            name="Test Shop",
            sales_manager=self.client_user
        )
        
        # Crear orden
        self.order = Order.objects.create(
            client=self.client_user,
            status=OrderStatusEnum.ENCARGADO.value
        )
        
        # Crear producto
        self.product = Product.objects.create(
            name="Test Product",
            sku="TEST-001",
            shop=self.shop,
            order=self.order,
            amount_requested=10,
            shop_cost=100.0,
            total_cost=1000.0
        )
        
        # Crear paquete
        self.package = Package.objects.create(
            agency_name="Test Agency",
            number_of_tracking="TRACK123"
        )
    
    def test_product_status_changes_to_recibido_on_received_save(self):
        """Verifica que el estado del producto cambia a RECIBIDO cuando se recibe la cantidad solicitada"""
        # Inicialmente el producto debe estar ENCARGADO
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
        
        # Crear un ProductReceived con la cantidad solicitada
        ProductReceived.objects.create(
            original_product=self.product,
            package=self.package,
            amount_received=10
        )
        
        # El producto debe cambiar a RECIBIDO
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.RECIBIDO.value)
        self.assertEqual(self.product.amount_received, 10)
    
    def test_product_amount_received_updates_on_received_save(self):
        """Verifica que amount_received se actualiza correctamente"""
        # Crear dos ProductReceived
        ProductReceived.objects.create(
            original_product=self.product,
            package=self.package,
            amount_received=5
        )
        ProductReceived.objects.create(
            original_product=self.product,
            package=self.package,
            amount_received=5
        )
        
        # El total debe ser 10
        self.product.refresh_from_db()
        self.assertEqual(self.product.amount_received, 10)


class ProductDeliverySignalsTest(TransactionTestCase):
    """Tests para signals de ProductDelivery"""
    
    def setUp(self):
        """Configuración común para los tests"""
        # Crear usuario cliente y manager
        self.client_user = CustomUser.objects.create_user(
            email="client@test.com",
            password="testpass123",
            role="client"
        )
        
        self.manager_user = CustomUser.objects.create_user(
            email="manager@test.com",
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
            name="Test Shop",
            sales_manager=self.client_user
        )
        
        # Crear orden
        self.order = Order.objects.create(
            client=self.client_user,
            status=OrderStatusEnum.ENCARGADO.value
        )
        
        # Crear producto con cantidad comprada
        self.product = Product.objects.create(
            name="Test Product",
            sku="TEST-001",
            shop=self.shop,
            order=self.order,
            amount_requested=10,
            amount_purchased=10,
            amount_received=10,
            shop_cost=100.0,
            total_cost=1000.0,
            status=ProductStatusEnum.RECIBIDO.value
        )
        
        # Crear delivery receipt
        self.delivery = DeliverReceip.objects.create(
            client=self.client_user,
            category=self.category,
            weight=10.0
        )
    
    def test_product_status_changes_to_entregado_on_delivery_save(self):
        """Verifica que el estado del producto cambia a ENTREGADO cuando se entrega toda la cantidad"""
        # Crear un ProductDelivery con la cantidad comprada/recibida
        ProductDelivery.objects.create(
            original_product=self.product,
            deliver_receip=self.delivery,
            amount_delivered=10
        )
        
        # El producto debe cambiar a ENTREGADO
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.ENTREGADO.value)
        self.assertEqual(self.product.amount_delivered, 10)
    
    def test_product_amount_delivered_updates_on_delivery_save(self):
        """Verifica que amount_delivered se actualiza correctamente"""
        # Crear dos ProductDelivery
        ProductDelivery.objects.create(
            original_product=self.product,
            deliver_receip=self.delivery,
            amount_delivered=5
        )
        ProductDelivery.objects.create(
            original_product=self.product,
            deliver_receip=self.delivery,
            amount_delivered=5
        )
        
        # El total debe ser 10
        self.product.refresh_from_db()
        self.assertEqual(self.product.amount_delivered, 10)
    
    def test_order_status_changes_to_completado_when_all_delivered(self):
        """Verifica que la orden cambia a COMPLETADO cuando todos los productos se entregan"""
        # Crear un ProductDelivery
        ProductDelivery.objects.create(
            original_product=self.product,
            deliver_receip=self.delivery,
            amount_delivered=10
        )
        
        # La orden debe cambiar a COMPLETADO
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, OrderStatusEnum.COMPLETADO.value)


class SignalsIntegrationTest(TransactionTestCase):
    """Tests de integración para el flujo completo de estados"""
    
    def setUp(self):
        """Configuración común para los tests"""
        # Crear usuario cliente
        self.client_user = CustomUser.objects.create_user(
            email="client@test.com",
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
            name="Test Shop",
            sales_manager=self.client_user
        )
        
        # Crear orden
        self.order = Order.objects.create(
            client=self.client_user,
            status=OrderStatusEnum.ENCARGADO.value
        )
        
        # Crear producto
        self.product = Product.objects.create(
            name="Test Product",
            sku="TEST-001",
            shop=self.shop,
            order=self.order,
            amount_requested=10,
            shop_cost=100.0,
            total_cost=1000.0
        )
        
        # Crear paquete y delivery
        self.package = Package.objects.create(
            agency_name="Test Agency",
            number_of_tracking="TRACK123"
        )
        
        self.delivery = DeliverReceip.objects.create(
            client=self.client_user,
            category=self.category,
            weight=10.0
        )
    
    def test_complete_product_lifecycle(self):
        """Prueba el ciclo completo: ENCARGADO -> COMPRADO -> RECIBIDO -> ENTREGADO"""
        # Estado inicial: ENCARGADO
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
        
        # Comprar producto -> COMPRADO
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=10
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
        
        # Recibir producto -> RECIBIDO
        ProductReceived.objects.create(
            original_product=self.product,
            package=self.package,
            amount_received=10
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.RECIBIDO.value)
        
        # Entregar producto -> ENTREGADO
        ProductDelivery.objects.create(
            original_product=self.product,
            deliver_receip=self.delivery,
            amount_delivered=10
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.ENTREGADO.value)
        
        # Verificar que la orden está completada
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, OrderStatusEnum.COMPLETADO.value)
