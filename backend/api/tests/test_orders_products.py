"""
Tests for Order and Product models and APIs
"""

from django.test import TestCase
from rest_framework import status
from decimal import Decimal
from api.tests import BaseAPITestCase, ModelTestCase
from api.models import Order, Product, Shop


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

    def test_product_amount_methods_default(self):
        """Test product amount methods return 0 by default"""
        self.assertEqual(self.product.amount_buyed(), 0)
        self.assertEqual(self.product.amount_received(), 0)
        self.assertEqual(self.product.amount_delivered(), 0)

    def test_product_cost_per_product_default(self):
        """Test cost per product returns 0 when no buys"""
        self.assertEqual(self.product.cost_per_product(), 0)


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
