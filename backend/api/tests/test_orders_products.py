"""
Tests for Order and Product models and APIs
"""

from django.test import TestCase
from rest_framework import status
from decimal import Decimal
from api.tests import BaseAPITestCase, ModelTestCase
from api.models import Order, Product, Shop, ProductBuyed, ProductReceived, ProductDelivery, ShoppingReceip
from api.enums import ProductStatusEnum


class OrderModelTest(ModelTestCase):
    """Test the Order model"""

    def setUp(self):
        super().setUp()
        self.order = Order.objects.create(
            client=self.test_user,
            sales_manager=self.agent_user
        )

    def test_order_creation(self):
        """Test order is created successfully"""
        self.assertTrue(isinstance(self.order.id, type(self.order.id)))
        self.assertEqual(self.order.client, self.test_user)
        self.assertEqual(self.order.sales_manager, self.agent_user)
        self.assertEqual(self.order.status, 'Encargado')
        self.assertEqual(self.order.pay_status, 'No pagado')

    def test_order_str_method(self):
        """Test order string representation"""
        expected_str = f"Pedido #{self.order.pk} creado por {self.test_user.name}"
        self.assertEqual(str(self.order), expected_str)

    def test_order_total_cost_calculation(self):
        """Test order total cost calculation"""
        # Create products for the order
        product1 = Product.objects.create(
            sku='TEST001',
            name='Test Product 1',
            shop=self.test_shop,
            amount_requested=2,
            order=self.order,
            shop_cost=10.0,
            total_cost=25.0
        )
        product2 = Product.objects.create(
            sku='TEST002',
            name='Test Product 2',
            shop=self.test_shop,
            amount_requested=1,
            order=self.order,
            shop_cost=15.0,
            total_cost=30.0
        )
        
        expected_total = 25.0 + 30.0
        self.assertEqual(self.order.total_cost(), expected_total)

    def test_add_received_value_method(self):
        """Test that `add_received_value` increments received_value_of_client and updates pay_status"""
        # Add a product that gives a total cost for the order
        Product.objects.create(
            sku='TEST_ADD', name='Add Received Product', shop=self.test_shop,
            amount_requested=1, order=self.order, shop_cost=50.0, total_cost=50.0
        )

        # Initially no payment
        self.assertEqual(self.order.received_value_of_client, 0)
        self.assertEqual(self.order.pay_status, 'No pagado')

        # Add partial payment
        self.order.add_received_value(30.0)
        self.order.refresh_from_db()
        self.assertEqual(self.order.received_value_of_client, 30.0)
        self.assertEqual(self.order.pay_status, 'Parcial')

        # Add another payment making it greater than total
        self.order.add_received_value(25.0)
        self.order.refresh_from_db()
        self.assertEqual(self.order.received_value_of_client, 55.0)
        self.assertEqual(self.order.pay_status, 'Pagado')

    def test_save_recalculates_pay_status_on_update(self):
        """Test that updating received_value_of_client after products are present updates pay_status accordingly"""
        new_order = Order.objects.create(client=self.test_user, sales_manager=self.agent_user)

        # Add a product to define total_cost
        Product.objects.create(
            sku='TEST_CRE', name='Create Product', shop=self.test_shop,
            amount_requested=1, order=new_order, shop_cost=50.0, total_cost=50.0
        )

        # Now update the received_value and save - this should recalc pay_status
        new_order.received_value_of_client = 80.0
        new_order.save()
        new_order.refresh_from_db()
        self.assertEqual(new_order.received_value_of_client, 80.0)
        self.assertEqual(new_order.pay_status, 'Pagado')

    def test_received_value_equals_total_cost_marks_as_paid(self):
        """Test that when received_value_of_client equals total_cost, pay_status is 'Pagado'"""
        order = Order.objects.create(client=self.test_user, sales_manager=self.agent_user)
        
        # Add a product with total_cost = 100.0
        Product.objects.create(
            sku='TEST_EQUAL',
            name='Equal Payment Product',
            shop=self.test_shop,
            amount_requested=1,
            order=order,
            shop_cost=100.0,
            total_cost=100.0
        )
        
        # Add payment exactly equal to total_cost
        order.add_received_value(100.0)
        order.refresh_from_db()
        
        # Should be marked as "Pagado" not "Parcial"
        self.assertEqual(order.received_value_of_client, 100.0)
        self.assertEqual(order.pay_status, 'Pagado')
    
    def test_received_value_with_floating_point_precision(self):
        """Test that floating point precision doesn't prevent 'Pagado' status"""
        order = Order.objects.create(client=self.test_user, sales_manager=self.agent_user)
        
        # Add a product with decimal total_cost
        Product.objects.create(
            sku='TEST_FLOAT',
            name='Float Payment Product',
            shop=self.test_shop,
            amount_requested=1,
            order=order,
            shop_cost=49.99,
            total_cost=49.99
        )
        
        # Add payment with potential floating point precision issues
        order.add_received_value(49.99)
        order.refresh_from_db()
        
        # Should be marked as "Pagado" not "Parcial"
        self.assertAlmostEqual(order.received_value_of_client, 49.99, places=2)
        self.assertEqual(order.pay_status, 'Pagado')


class ProductModelTest(ModelTestCase):
    """Test the Product model"""

    def setUp(self):
        super().setUp()
        self.order = Order.objects.create(
            client=self.test_user,
            sales_manager=self.agent_user
        )
        self.product = Product.objects.create(
            sku='TEST001',
            name='Test Product',
            shop=self.test_shop,
            amount_requested=5,
            order=self.order,
            shop_cost=10.0,
            shop_delivery_cost=2.0,
            shop_taxes=1.0,
            own_taxes=0.5,
            added_taxes=0.5,
            total_cost=20.0
        )

    def test_product_creation(self):
        """Test product is created successfully"""
        self.assertEqual(self.product.sku, 'TEST001')
        self.assertEqual(self.product.name, 'Test Product')
        self.assertEqual(self.product.shop, self.test_shop)
        self.assertEqual(self.product.amount_requested, 5)
        self.assertEqual(self.product.order, self.order)
        self.assertEqual(self.product.total_cost, 20.0)

    def test_product_amount_fields_default(self):
        """Test product amount fields are initialized correctly"""
        self.assertEqual(self.product.amount_purchased, 0)
        self.assertEqual(self.product.amount_received, 0)
        self.assertEqual(self.product.amount_delivered, 0)

    def test_product_pending_calculations(self):
        """Test pending purchase and delivery calculations"""
        self.assertEqual(self.product.pending_purchase, 5)  # 5 requested - 0 purchased
        self.assertEqual(self.product.pending_delivery, 0)   # 0 purchased - 0 delivered

    def test_product_system_expenses_calculation(self):
        """Test that system_expenses includes added_taxes but NOT own_taxes"""
        # Setup: shop_cost=10, delivery=2, IVA 7%=0.7, added_taxes=0.5
        # Expected: 10 + 2 + 0.7 + 0.5 = 13.2
        expected_expenses = 10.0 + 2.0 + 0.7 + 0.5
        self.assertAlmostEqual(self.product.system_expenses, expected_expenses, places=2)
        
    def test_product_system_profit_calculation(self):
        """Test that system_profit includes own_taxes as additional profit"""
        # Setup: total_cost=20, system_expenses=13.2, own_taxes=0.5
        # Expected: (20 - 13.2) + 0.5 = 7.3
        expected_profit = (20.0 - self.product.system_expenses) + 0.5
        self.assertAlmostEqual(self.product.system_profit, expected_profit, places=2)
    
    def test_added_taxes_increases_expenses(self):
        """Test that added_taxes increases system expenses"""
        # Create product without added_taxes
        product_no_added = Product.objects.create(
            sku='TEST002',
            name='Test Product No Added',
            shop=self.test_shop,
            amount_requested=5,
            order=self.order,
            shop_cost=10.0,
            shop_delivery_cost=2.0,
            charge_iva=True,
            own_taxes=0.0,
            added_taxes=0.0,
            total_cost=15.0
        )
        
        # Expenses without added_taxes: 10 + 2 + 0.7 = 12.7
        expenses_without = product_no_added.system_expenses
        
        # Expenses with added_taxes: 10 + 2 + 0.7 + 0.5 = 13.2
        expenses_with = self.product.system_expenses
        
        # Verify that added_taxes increases expenses
        self.assertAlmostEqual(expenses_with - expenses_without, 0.5, places=2)
    
    def test_own_taxes_increases_profit(self):
        """Test that own_taxes increases system profit"""
        # Create product without own_taxes
        product_no_own = Product.objects.create(
            sku='TEST003',
            name='Test Product No Own',
            shop=self.test_shop,
            amount_requested=5,
            order=self.order,
            shop_cost=10.0,
            shop_delivery_cost=2.0,
            charge_iva=True,
            own_taxes=0.0,
            added_taxes=0.5,
            total_cost=20.0
        )
        
        # Profit without own_taxes
        profit_without = product_no_own.system_profit
        
        # Profit with own_taxes (should be 0.5 more)
        profit_with = self.product.system_profit
        
        # Verify that own_taxes increases profit
        self.assertAlmostEqual(profit_with - profit_without, 0.5, places=2)

    def test_product_status_flow_encargado_to_comprado(self):
        """Test product status changes from ENCARGADO to COMPRADO when purchased"""
        # Initial status should be ENCARGADO
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
        self.assertEqual(self.product.amount_purchased, 0)
        
        # Create a purchase for the full amount requested (5)
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5,
            actual_cost_of_product=10.0,
            real_cost_of_product=10.0
        )
        
        # Refresh product from database
        self.product.refresh_from_db()
        
        # Status should change to COMPRADO
        self.assertEqual(self.product.amount_purchased, 5)
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
    
    def test_product_status_flow_comprado_to_recibido(self):
        """Test product status changes from COMPRADO to RECIBIDO when received"""
        # First, mark as COMPRADO
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5,
            actual_cost_of_product=10.0,
            real_cost_of_product=10.0
        )
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
        self.assertEqual(self.product.amount_received, 0)
        
        # Now receive the products (equal to amount_purchased)
        ProductReceived.objects.create(
            original_product=self.product,
            amount_received=5
        )
        
        # Refresh product from database
        self.product.refresh_from_db()
        
        # Status should change to RECIBIDO when amount_received == amount_purchased
        self.assertEqual(self.product.amount_received, 5)
        self.assertEqual(self.product.status, ProductStatusEnum.RECIBIDO.value)
    
    def test_product_status_flow_recibido_to_entregado(self):
        """Test product status changes from RECIBIDO to ENTREGADO when delivered"""
        # First, purchase and receive
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5,
            actual_cost_of_product=10.0,
            real_cost_of_product=10.0
        )
        
        ProductReceived.objects.create(
            original_product=self.product,
            amount_received=5
        )
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.RECIBIDO.value)
        self.assertEqual(self.product.amount_delivered, 0)
        
        # Now deliver the products (equal to amount_purchased)
        ProductDelivery.objects.create(
            original_product=self.product,
            amount_delivered=5
        )
        
        # Refresh product from database
        self.product.refresh_from_db()
        
        # Status should change to ENTREGADO when amount_delivered == amount_purchased
        self.assertEqual(self.product.amount_delivered, 5)
        self.assertEqual(self.product.status, ProductStatusEnum.ENTREGADO.value)
    
    def test_product_status_partial_purchase(self):
        """Test product status remains ENCARGADO with partial purchase"""
        # Purchase only 3 out of 5 requested
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=3,
            actual_cost_of_product=10.0,
            real_cost_of_product=10.0
        )
        
        self.product.refresh_from_db()
        
        # Status should remain ENCARGADO
        self.assertEqual(self.product.amount_purchased, 3)
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
    
    def test_product_status_partial_receipt(self):
        """Test product status remains COMPRADO with partial receipt"""
        # Purchase full amount
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5,
            actual_cost_of_product=10.0,
            real_cost_of_product=10.0
        )
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
        
        # Receive only 3 out of 5 purchased
        ProductReceived.objects.create(
            original_product=self.product,
            amount_received=3
        )
        
        self.product.refresh_from_db()
        
        # Status should remain COMPRADO
        self.assertEqual(self.product.amount_received, 3)
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
    
    def test_product_status_partial_delivery(self):
        """Test product status remains RECIBIDO with partial delivery"""
        # Purchase and receive full amount
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5,
            actual_cost_of_product=10.0,
            real_cost_of_product=10.0
        )
        
        ProductReceived.objects.create(
            original_product=self.product,
            amount_received=5
        )
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.RECIBIDO.value)
        
        # Deliver only 3 out of 5 purchased
        ProductDelivery.objects.create(
            original_product=self.product,
            amount_delivered=3
        )
        
        self.product.refresh_from_db()
        
        # Status should remain RECIBIDO
        self.assertEqual(self.product.amount_delivered, 3)
        self.assertEqual(self.product.status, ProductStatusEnum.RECIBIDO.value)


class OrderAPITest(BaseAPITestCase):
    """Test the Order API endpoints"""

    def test_create_order_as_agent(self):
        """Test creating an order as an agent"""
        self.authenticate_user(self.agent_user)
        
        order_data = {
            'client': self.client_user.email,
            'status': 'Encargado',
            'pay_status': 'No pagado'
        }
        
        response = self.client.post('/shein_shop/order/', order_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['client'], self.client_user.email)
        self.assertEqual(response.data['sales_manager'], self.agent_user.email)

    def test_create_order_non_agent(self):
        """Test creating an order as non-agent fails"""
        self.authenticate_user(self.client_user)
        
        order_data = {
            'client': self.client_user.email,
        }
        
        response = self.client.post('/shein_shop/order/', order_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_order_invalid_client(self):
        """Test creating an order with invalid client email"""
        self.authenticate_user(self.agent_user)
        
        order_data = {
            'client': 'nonexistent@example.com',
        }
        
        response = self.client.post('/shein_shop/order/', order_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_order_list(self):
        """Test getting order list"""
        self.authenticate_user(self.agent_user)
        
        response = self.client.get('/shein_shop/order/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_get_order_detail(self):
        """Test getting order detail"""
        self.authenticate_user(self.agent_user)
        
        response = self.client.get(f'/shein_shop/order/{self.test_order.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.test_order.id)
        self.assertEqual(response.data['client'], self.client_user.email)

    def test_update_order(self):
        """Test updating an order"""
        self.authenticate_user(self.agent_user)
        
        update_data = {
            'status': 'Comprado',
            'pay_status': 'Pagado'
        }
        
        response = self.client.patch(f'/shein_shop/order/{self.test_order.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Comprado')
        self.assertEqual(response.data['pay_status'], 'Pagado')

    def test_update_order_payment_accumulates(self):
        """Test that partial updates to received_value_of_client accumulate and update pay_status accordingly"""
        self.authenticate_user(self.agent_user)

        # Add a product to determine a total_cost
        Product.objects.create(
            sku='TEST_P1',
            name='Payment Product',
            shop=self.test_shop,
            amount_requested=1,
            order=self.test_order,
            shop_cost=50.0,
            total_cost=50.0
        )

        # Ensure initial status
        response = self.client.get(f'/shein_shop/order/{self.test_order.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['pay_status'], 'No pagado')
        self.assertEqual(response.data['received_value_of_client'], 0)

        # Add a partial payment of 30.0
        response = self.client.patch(f'/shein_shop/order/{self.test_order.id}/', {'received_value_of_client': 30.0})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertAlmostEqual(float(response.data['received_value_of_client']), 30.0)
        self.assertEqual(response.data['pay_status'], 'Parcial')

        # Add another payment of 25.0 (total > 50 => Paid)
        response = self.client.patch(f'/shein_shop/order/{self.test_order.id}/', {'received_value_of_client': 25.0})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertAlmostEqual(float(response.data['received_value_of_client']), 55.0)
        self.assertEqual(response.data['pay_status'], 'Pagado')


class ProductAPITest(BaseAPITestCase):
    """Test the Product API endpoints"""

    def test_create_product(self):
        """Test creating a product"""
        self.authenticate_user(self.agent_user)
        
        product_data = {
            'sku': 'NEW001',
            'name': 'New Product',
            'shop': self.test_shop.name,
            'amount_requested': 3,
            'order': self.test_order.id,
            'shop_cost': 15.0,
            'shop_delivery_cost': 2.0,
            'shop_taxes': 1.0,
            'own_taxes': 0.5,
            'added_taxes': 0.5,
            'total_cost': 25.0,
            'description': 'A test product',
            'category': 'Electronics'
        }
        
        response = self.client.post('/shein_shop/product/', product_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['sku'], 'NEW001')
        self.assertEqual(response.data['name'], 'New Product')
        self.assertEqual(response.data['shop'], self.test_shop.name)

    def test_create_product_invalid_shop(self):
        """Test creating a product with invalid shop"""
        self.authenticate_user(self.agent_user)
        
        product_data = {
            'sku': 'NEW001',
            'name': 'New Product',
            'shop': 'Nonexistent Shop',
            'amount_requested': 3,
            'order': self.test_order.id,
            'shop_cost': 15.0,
            'total_cost': 25.0
        }
        
        response = self.client.post('/shein_shop/product/', product_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('shop', response.data)

    def test_create_product_invalid_order(self):
        """Test creating a product with invalid order"""
        self.authenticate_user(self.agent_user)
        
        product_data = {
            'sku': 'NEW001',
            'name': 'New Product',
            'shop': self.test_shop.name,
            'amount_requested': 3,
            'order': 99999,  # Non-existent order ID
            'shop_cost': 15.0,
            'total_cost': 25.0
        }
        
        response = self.client.post('/shein_shop/product/', product_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('order', response.data)

    def test_create_product_negative_cost(self):
        """Test creating a product with negative cost fails"""
        self.authenticate_user(self.agent_user)
        
        product_data = {
            'sku': 'NEW001',
            'name': 'New Product',
            'shop': self.test_shop.name,
            'amount_requested': 3,
            'order': self.test_order.id,
            'shop_cost': -15.0,  # Negative cost
            'total_cost': 25.0
        }
        
        response = self.client.post('/shein_shop/product/', product_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_product_zero_amount(self):
        """Test creating a product with zero amount fails"""
        self.authenticate_user(self.agent_user)
        
        product_data = {
            'sku': 'NEW001',
            'name': 'New Product',
            'shop': self.test_shop.name,
            'amount_requested': 0,  # Zero amount
            'order': self.test_order.id,
            'shop_cost': 15.0,
            'total_cost': 25.0
        }
        
        response = self.client.post('/shein_shop/product/', product_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_product_list(self):
        """Test getting product list"""
        self.authenticate_user(self.agent_user)
        
        # Create a test product first
        Product.objects.create(
            sku='LIST001',
            name='List Product',
            shop=self.test_shop,
            amount_requested=1,
            order=self.test_order,
            shop_cost=10.0,
            total_cost=15.0
        )
        
        response = self.client.get('/shein_shop/product/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_get_product_detail(self):
        """Test getting product detail"""
        self.authenticate_user(self.agent_user)
        
        product = Product.objects.create(
            sku='DETAIL001',
            name='Detail Product',
            shop=self.test_shop,
            amount_requested=2,
            order=self.test_order,
            shop_cost=10.0,
            total_cost=20.0
        )
        
        response = self.client.get(f'/shein_shop/product/{product.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sku'], 'DETAIL001')
        self.assertEqual(response.data['name'], 'Detail Product')

    def test_update_product(self):
        """Test updating a product"""
        self.authenticate_user(self.agent_user)
        
        product = Product.objects.create(
            sku='UPDATE001',
            name='Update Product',
            shop=self.test_shop,
            amount_requested=2,
            order=self.test_order,
            shop_cost=10.0,
            total_cost=20.0
        )
        
        update_data = {
            'name': 'Updated Product Name',
            'shop_cost': 12.0,
            'total_cost': 22.0
        }
        
        response = self.client.patch(f'/shein_shop/product/{product.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Product Name')
        self.assertEqual(float(response.data['shop_cost']), 12.0)

    def test_delete_product(self):
        """Test deleting a product"""
        self.authenticate_user(self.agent_user)
        
        product = Product.objects.create(
            sku='DELETE001',
            name='Delete Product',
            shop=self.test_shop,
            amount_requested=1,
            order=self.test_order,
            shop_cost=10.0,
            total_cost=15.0
        )
        
        response = self.client.delete(f'/shein_shop/product/{product.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify product is deleted
        with self.assertRaises(Product.DoesNotExist):
            Product.objects.get(id=product.id)
